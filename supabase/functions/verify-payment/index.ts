/// <reference lib="dom" />

// Verifies a Paystack transaction server-side, then marks the invoice paid
// using the service role. The browser must never be able to flip an invoice
// to "paid" on its own.
//
// Required secrets (supabase secrets set):
//   PAYSTACK_SECRET_KEY  - sk_live_... or sk_test_...
//   SB_URL               - project URL (or use built-in SUPABASE_URL)
//   SB_SERVICE_ROLE_KEY  - service role key (or built-in SUPABASE_SERVICE_ROLE_KEY)

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void
  env: {
    get(key: string): string | undefined
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reference, invoiceId } = await req.json()
    if (!reference || !invoiceId) {
      return json({ error: 'reference and invoiceId are required' }, 400)
    }

    const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!paystackKey || !supabaseUrl || !serviceKey) {
      return json({ error: 'Payment verification not configured' }, 500)
    }

    // 1. Load the invoice (service role bypasses RLS)
    const invoiceRes = await fetch(
      `${supabaseUrl}/rest/v1/invoices?id=eq.${encodeURIComponent(invoiceId)}&select=id,total,status,invoice_number`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
    )
    const invoices = await invoiceRes.json()
    const invoice = Array.isArray(invoices) ? invoices[0] : null
    if (!invoice) return json({ error: 'Invoice not found' }, 404)
    if (invoice.status === 'paid') return json({ ok: true, alreadyPaid: true })

    // 2. Verify the transaction with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackKey}` } },
    )
    const verify = await verifyRes.json()
    const tx = verify?.data

    if (!verifyRes.ok || verify?.status !== true || tx?.status !== 'success') {
      return json({ error: 'Payment not confirmed by Paystack' }, 402)
    }

    // 3. Amount and currency must match the invoice (Paystack amount is in kobo)
    const expectedKobo = Math.round(Number(invoice.total) * 100)
    if (Number(tx.amount) < expectedKobo || tx.currency !== 'NGN') {
      console.error('Amount mismatch', { reference, paid: tx.amount, expectedKobo, currency: tx.currency })
      return json({ error: 'Paid amount does not match invoice' }, 402)
    }

    // 4. Reference metadata must point at this invoice (blocks reference replay
    //    from a cheaper invoice)
    const metaInvoiceId = tx.metadata?.invoice_id
    if (metaInvoiceId && String(metaInvoiceId) !== String(invoiceId)) {
      console.error('Reference belongs to another invoice', { reference, metaInvoiceId, invoiceId })
      return json({ error: 'Payment reference does not match this invoice' }, 402)
    }

    // 5. Mark paid
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/invoices?id=eq.${encodeURIComponent(invoiceId)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          status: 'paid',
          paystack_ref: reference,
          paid_at: new Date().toISOString(),
        }),
      },
    )
    if (!updateRes.ok) {
      console.error('Invoice update failed', updateRes.status, await updateRes.text())
      return json({ error: 'Could not update invoice' }, 500)
    }

    return json({ ok: true })
  } catch (err) {
    console.error('verify-payment error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
