import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'Forever',
    color: 'rgba(255,255,255,0.07)',
    textColor: '#F0F5F2',
    planCode: null,
    features: [
      '5 invoices per month',
      '2 clients',
      'Basic expense tracking',
      'Payment links (Naira)',
    ],
  },
  {
    name: 'Growth',
    price: '₦3,500',
    sub: 'per month',
    color: '#00C566',
    textColor: '#080C0A',
    planCode: import.meta.env.VITE_PAYSTACK_GROWTH_PLAN,
    features: [
      'Unlimited invoices',
      'Unlimited clients',
      'Full expense tracker',
      'Profit & loss dashboard',
      'PDF downloads',
      'WhatsApp sharing',
      'AI Business Advisor',
      'Priority support',
    ],
    highlight: true,
  },
  {
    name: 'Business',
    price: '₦9,000',
    sub: 'per month',
    color: 'rgba(255,255,255,0.07)',
    textColor: '#F0F5F2',
    planCode: import.meta.env.VITE_PAYSTACK_BUSINESS_PLAN,
    features: [
      'Everything in Growth',
      'Up to 5 team members',
      'Multi-business support',
      'Custom invoice branding',
      'Monthly financial report',
      'Dedicated account manager',
    ],
  },
]

function Billing() {
  const { user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState('Starter')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) loadBillingStatus()
  }, [user])

  const loadBillingStatus = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    if (data?.plan) setCurrentPlan(data.plan)
  }

  const handleSubscribe = (plan) => {
    if (!plan.planCode) return
    setLoading(true)

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      plan: plan.planCode,
      currency: 'NGN',
      ref: `STACKPAY-SUB-${Date.now()}`,
      callback: async (response) => {
        await supabase
          .from('profiles')
          .update({ plan: plan.name })
          .eq('id', user.id)
        setCurrentPlan(plan.name)
        setLoading(false)
        alert(`🎉 Welcome to StackPay ${plan.name}! Your subscription is active.`)
      },
      onClose: () => setLoading(false),
    })
    handler.openIframe()
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
          color: '#F0F5F2',
          marginBottom: '0.3rem',
        }}>
          Billing & Plans
        </h1>
        <p style={{ color: '#8A9E92', fontSize: '0.9rem' }}>
          Current plan: <span style={{ color: '#00C566', fontWeight: 700 }}>
            {currentPlan}
          </span>
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start',
      }}>
        {plans.map((plan, i) => (
          <div key={i} style={{
            background: '#141A16',
            border: plan.highlight
              ? '2px solid #00C566'
              : '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '2rem',
            position: 'relative',
            transform: plan.highlight ? 'scale(1.02)' : 'scale(1)',
          }}>
            {plan.highlight && (
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#00C566',
                color: '#080C0A',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '0.3rem 1rem',
                borderRadius: '100px',
                whiteSpace: 'nowrap',
                letterSpacing: '0.5px',
              }}>
                MOST POPULAR
              </div>
            )}

            {currentPlan === plan.name && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(0,197,102,0.15)',
                border: '1px solid rgba(0,197,102,0.3)',
                color: '#00C566',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '100px',
                fontFamily: 'Syne, sans-serif',
              }}>
                ACTIVE
              </div>
            )}

            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: plan.highlight ? '#00C566' : '#8A9E92',
              marginBottom: '0.75rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              {plan.name}
            </div>

            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '2rem',
              color: '#F0F5F2',
              letterSpacing: '-1px',
              lineHeight: 1,
              marginBottom: '0.25rem',
            }}>
              {plan.price}
            </div>
            <div style={{
              color: '#8A9E92',
              fontSize: '0.82rem',
              marginBottom: '1.5rem',
            }}>
              {plan.sub}
            </div>

            <ul style={{ listStyle: 'none', marginBottom: '1.8rem' }}>
              {plan.features.map((feat, j) => (
                <li key={j} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  color: '#8A9E92',
                  fontSize: '0.88rem',
                  marginBottom: '0.65rem',
                  lineHeight: 1.5,
                }}>
                  <span style={{
                    color: '#00C566',
                    flexShrink: 0,
                    marginTop: '2px',
                    fontSize: '0.8rem',
                  }}>✓</span>
                  {feat}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={currentPlan === plan.name || !plan.planCode || loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '10px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: plan.highlight
                  ? 'none'
                  : '1px solid rgba(255,255,255,0.12)',
                background: currentPlan === plan.name
                  ? 'rgba(0,197,102,0.08)'
                  : plan.highlight
                  ? '#00C566'
                  : 'transparent',
                color: currentPlan === plan.name
                  ? '#00C566'
                  : plan.highlight
                  ? '#080C0A'
                  : '#F0F5F2',
                cursor: currentPlan === plan.name || !plan.planCode
                  ? 'default'
                  : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {currentPlan === plan.name
                ? 'Current Plan'
                : plan.planCode
                ? `Upgrade to ${plan.name}`
                : 'Free Forever'}
            </button>
          </div>
        ))}
      </div>

      {/* Cancel note */}
      <p style={{
        textAlign: 'center',
        color: '#4A6055',
        fontSize: '0.8rem',
        marginTop: '2rem',
      }}>
        Cancel anytime. No hidden fees. Billed in Naira.
      </p>
    </AppLayout>
  )
}

export default Billing
