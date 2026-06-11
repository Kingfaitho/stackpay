/// <reference lib="dom" />

// Sends receipt emails for an invoice the caller owns. Used when an owner
// manually marks an invoice paid (cash / bank transfer). Online payments get
// receipts automatically inside verify-payment.

import { sendReceiptEmails } from '../_shared/receipts.ts'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!supabaseUrl || !anonKey || !serviceKey || !resendKey) {
      return json({ error: 'Receipts not configured' }, 500)
    }

    // Caller must be signed in; receipts only go out for their own invoices
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    })
    if (!userRes.ok) return json({ error: 'Sign in required' }, 401)
    const user = await userRes.json()
    if (!user?.id) return json({ error: 'Sign in required' }, 401)

    const { invoiceId } = await req.json()
    if (!invoiceId) return json({ error: 'invoiceId is required' }, 400)

    const invoiceRes = await fetch(
      `${supabaseUrl}/rest/v1/invoices?id=eq.${encodeURIComponent(invoiceId)}&user_id=eq.${encodeURIComponent(user.id)}&select=invoice_number,total,user_id,clients(name,email)`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    )
    const invoices = await invoiceRes.json()
    const invoice = Array.isArray(invoices) ? invoices[0] : null
    if (!invoice) return json({ error: 'Invoice not found' }, 404)

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=business_name,email`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    )
    const profiles = await profileRes.json()
    const business = Array.isArray(profiles) ? profiles[0] : null

    await sendReceiptEmails(resendKey, {
      invoiceNumber: invoice.invoice_number,
      amount: Number(invoice.total),
      businessName: business?.business_name || 'Your business',
      ownerEmail: business?.email,
      clientName: invoice.clients?.name,
      clientEmail: invoice.clients?.email,
    })

    return json({ ok: true })
  } catch (err) {
    console.error('send-receipt error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
