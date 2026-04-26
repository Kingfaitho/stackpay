import { Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'Forever free',
    highlight: false,
    features: [
      '5 invoices per month',
      '2 clients',
      'Basic expense tracking',
      'Payment links (Naira)',
      'Email support',
    ],
    cta: 'Start Free',
  },
  {
    name: 'Growth',
    price: '₦3,500',
    sub: 'per month',
    highlight: true,
    features: [
      'Unlimited invoices',
      'Unlimited clients',
      'Full expense tracker',
      'Profit & loss dashboard',
      'Payment links (Naira + USD)',
      'WhatsApp invoice sharing',
      'AI Business Advisor',
      'Cash Flow Forecasting',
      'Priority support',
    ],
    cta: 'Get Early Access',
  },
  {
    name: 'Business',
    price: '₦9,000',
    sub: 'per month',
    highlight: false,
    features: [
      'Everything in Growth',
      'Team members (up to 5)',
      'Multi-business support',
      'Custom invoice branding',
      'Monthly financial report',
      'Dedicated account manager',
    ],
    cta: 'Join Waitlist',
  },
]

function Pricing() {
  const { colors, isDark } = useTheme()

  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="pricing" style={{
      padding: '100px 5%',
      background: colors.bgSecondary,
      transition: 'background 0.3s',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            color: colors.green,
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '1rem',
          }}>
            Pricing
          </span>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            letterSpacing: '-1px',
            color: colors.textPrimary,
            lineHeight: 1.2,
            marginBottom: '1rem',
            transition: 'color 0.3s',
          }}>
            Priced for Nigerian businesses
          </h2>
          <p style={{
            color: colors.textSecondary,
            fontSize: '1rem',
            transition: 'color 0.3s',
          }}>
            No dollar pricing. No confusion. Pay in Naira and cancel anytime.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}>
          {plans.map((plan, i) => (
            <div
              key={i}
              style={{
                background: colors.bgCard,
                border: plan.highlight
                  ? `2px solid ${colors.green}`
                  : `1px solid ${colors.border}`,
                borderRadius: '20px',
                padding: '2rem',
                position: 'relative',
                transform: plan.highlight ? 'scale(1.03)' : 'scale(1)',
                boxShadow: plan.highlight
                  ? `0 8px 32px ${isDark
                    ? 'rgba(0,197,102,0.15)'
                    : 'rgba(0,120,60,0.12)'}`
                  : isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
                transition: 'background 0.3s, border-color 0.3s',
              }}
            >
              {plan.highlight && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: colors.green,
                  color: isDark ? '#080C0A' : '#fff',
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

              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: plan.highlight ? colors.green : colors.textSecondary,
                marginBottom: '1rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                transition: 'color 0.3s',
              }}>
                {plan.name}
              </div>

              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(2rem, 3vw, 2.5rem)',
                color: colors.textPrimary,
                letterSpacing: '-1px',
                lineHeight: 1,
                marginBottom: '0.3rem',
                transition: 'color 0.3s',
              }}>
                {plan.price}
              </div>
              <div style={{
                color: colors.textMuted,
                fontSize: '0.85rem',
                marginBottom: '1.8rem',
                transition: 'color 0.3s',
              }}>
                {plan.sub}
              </div>

              <ul style={{ listStyle: 'none', marginBottom: '2rem' }}>
                {plan.features.map((feat, j) => (
                  <li key={j} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    color: colors.textSecondary,
                    fontSize: '0.9rem',
                    marginBottom: '0.8rem',
                    lineHeight: 1.5,
                    transition: 'color 0.3s',
                  }}>
                    <Check
                      size={16}
                      style={{
                        color: colors.green,
                        flexShrink: 0,
                        marginTop: '3px',
                      }}
                    />
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                onClick={scrollToWaitlist}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  background: plan.highlight ? colors.accent : 'transparent',
                  color: plan.highlight
                    ? colors.accentText
                    : colors.textPrimary,
                  border: plan.highlight
                    ? 'none'
                    : `1px solid ${colors.border}`,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  if (plan.highlight) {
                    e.currentTarget.style.opacity = '0.88'
                  } else {
                    e.currentTarget.style.borderColor = colors.borderGreen
                    e.currentTarget.style.color = colors.green
                  }
                }}
                onMouseLeave={e => {
                  if (plan.highlight) {
                    e.currentTarget.style.opacity = '1'
                  } else {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.color = colors.textPrimary
                  }
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing
