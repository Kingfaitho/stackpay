import { FileText, CreditCard, BarChart3, Users, Zap, Shield } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const features = [
  {
    icon: <FileText size={22} />,
    title: 'Smart Invoicing',
    desc: 'Create professional invoices in seconds. Add your logo, set due dates, and send directly to clients via WhatsApp or email.',
  },
  {
    icon: <CreditCard size={22} />,
    title: 'Naira Payment Links',
    desc: 'Generate a payment link your customers tap to pay instantly. Powered by Paystack. Money lands in your account same day.',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Expense Tracking',
    desc: 'Log every cost — data, transport, stock, rent. See exactly where your money is going and stop bleeding cash silently.',
  },
  {
    icon: <Users size={22} />,
    title: 'Client Management',
    desc: 'Store all your clients in one place. See their full payment history, outstanding balances, and contact details instantly.',
  },
  {
    icon: <Zap size={22} />,
    title: 'Profit Dashboard',
    desc: 'See your real profit at a glance — total income, total expenses, and what actually remains. No accountant needed.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Secure & Private',
    desc: 'Your business data is encrypted and belongs to you alone. We will never sell your data or share it with third parties.',
  },
]

function Features() {
  const { colors, isDark } = useTheme()

  return (
    <section id="features" style={{
      padding: '100px 5%',
      background: colors.bgPrimary,
      transition: 'background 0.3s',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '60px',
        }}>
          <span style={{
            color: colors.green,
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            Everything You Need
          </span>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            letterSpacing: '-1px',
            color: colors.textPrimary,
            maxWidth: '600px',
            lineHeight: 1.2,
            marginBottom: '1rem',
            transition: 'color 0.3s',
          }}>
            One tool. Every financial task your business needs.
          </h2>
          <p style={{
            color: colors.textSecondary,
            fontSize: '1rem',
            maxWidth: '480px',
            lineHeight: 1.7,
            transition: 'color 0.3s',
          }}>
            Most Nigerian SMEs use 4–6 different apps to do what StackPay does alone.
            Stop the chaos.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '2rem',
                transition: 'border-color 0.3s, transform 0.3s, background 0.3s',
                cursor: 'default',
                boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = colors.borderGreen
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = isDark
                  ? '0 8px 30px rgba(0,0,0,0.4)'
                  : '0 8px 30px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = isDark
                  ? 'none'
                  : '0 2px 12px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                background: isDark
                  ? 'rgba(0,197,102,0.1)'
                  : 'rgba(0,120,60,0.08)',
                border: `1px solid ${colors.borderGreen}`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.green,
                marginBottom: '1.2rem',
              }}>
                {f.icon}
              </div>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: colors.textPrimary,
                marginBottom: '0.6rem',
                transition: 'color 0.3s',
              }}>
                {f.title}
              </h3>
              <p style={{
                color: colors.textSecondary,
                fontSize: '0.9rem',
                lineHeight: 1.7,
                transition: 'color 0.3s',
              }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
