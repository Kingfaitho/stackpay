import { useTheme } from '../context/ThemeContext'

const steps = [
  {
    step: '01',
    title: 'Create your free account',
    desc: 'Sign up with your email and your business name. No credit card. No paperwork. Ready in 60 seconds.',
  },
  {
    step: '02',
    title: 'Add your clients & services',
    desc: 'Enter the names of your customers and what you sell or offer. StackPay remembers everything for next time.',
  },
  {
    step: '03',
    title: 'Send invoices & payment links',
    desc: 'Create an invoice and share it on WhatsApp. Your client taps the link and pays instantly with their card or bank transfer.',
  },
  {
    step: '04',
    title: 'Track everything on your dashboard',
    desc: 'Every payment, every expense, every client. Your profit and loss is always visible — updated in real time.',
  },
]

function HowItWorks() {
  const { colors, isDark } = useTheme()

  return (
    <section id="how-it-works" style={{
      padding: '100px 5%',
      background: colors.bgSecondary,
      transition: 'background 0.3s',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '70px' }}>
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
            How It Works
          </span>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            letterSpacing: '-1px',
            color: colors.textPrimary,
            lineHeight: 1.2,
            transition: 'color 0.3s',
          }}>
            Up and running in under 5 minutes
          </h2>
        </div>

        {/* Steps Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '2rem',
              height: '100%',
              boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
              transition: 'background 0.3s, border-color 0.3s',
            }}>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '2.5rem',
                color: isDark
                  ? 'rgba(0,197,102,0.15)'
                  : 'rgba(0,120,60,0.12)',
                letterSpacing: '-2px',
                marginBottom: '1rem',
                lineHeight: 1,
                transition: 'color 0.3s',
              }}>
                {s.step}
              </div>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: colors.textPrimary,
                marginBottom: '0.7rem',
                transition: 'color 0.3s',
              }}>
                {s.title}
              </h3>
              <p style={{
                color: colors.textSecondary,
                fontSize: '0.9rem',
                lineHeight: 1.7,
                transition: 'color 0.3s',
              }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
