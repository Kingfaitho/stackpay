/// <reference lib="dom" />

// Activates a paid plan only after verifying the Paystack subscription
// transaction server-side. The plan is applied to the authenticated caller,
// so nobody can upgrade someone else (or themselves, without paying).
//
// Required secrets: PAYSTACK_SECRET_KEY (already set for verify-payment).

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

// Naira prices must match the Pricing page; amounts are compared in kobo.
const PLAN_PRICES_KOBO: Record<string, number> = {
  Growth: 3_500 * 100,
  Business: 9_000 * 100,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!paystackKey || !supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: 'Subscription verification not configured' }, 500)
    }

    // 1. Identify the caller from their JWT; the plan can only be applied
    //    to this user.
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    })
    if (!userRes.ok) return json({ error: 'Sign in to activate a plan' }, 401)
    const user = await userRes.json()
    if (!user?.id) return json({ error: 'Sign in to activate a plan' }, 401)

    const { reference, planName } = await req.json()
    const expectedKobo = PLAN_PRICES_KOBO[planName]
    if (!reference || !expectedKobo) {
      return json({ error: 'reference and a valid planName are required' }, 400)
    }

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
    if (Number(tx.amount) < expectedKobo || tx.currency !== 'NGN') {
      console.error('Subscription amount mismatch', {
        reference, paid: tx.amount, expectedKobo, plan: planName,
      })
      return json({ error: 'Paid amount does not match the plan' }, 402)
    }
    // The charge must belong to the caller
    if (tx.customer?.email && user.email
      && tx.customer.email.toLowerCase() !== String(user.email).toLowerCase()) {
      console.error('Subscription email mismatch', { reference, txEmail: tx.customer.email })
      return json({ error: 'Payment was made by a different account' }, 402)
    }

    // 3. Activate the plan for the verified caller
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          plan: planName,
          plan_activated_at: new Date().toISOString(),
          plan_paystack_ref: reference,
        }),
      },
    )
    if (!updateRes.ok) {
      console.error('Plan update failed', updateRes.status, await updateRes.text())
      return json({ error: 'Could not activate plan' }, 500)
    }

    return json({ ok: true, plan: planName })
  } catch (err) {
    console.error('verify-subscription error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
