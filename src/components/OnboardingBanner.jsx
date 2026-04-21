import { Link } from 'react-router-dom'

function OnboardingBanner({ profile, invoiceCount, clientCount }) {
  const steps = [
    {
      done: !!profile?.business_name,
      icon: '⚙️',
      title: 'Complete your profile',
      desc: 'Add your business name so it appears on invoices',
      link: '/profile',
      cta: 'Set up profile',
    },
    {
      done: clientCount > 0,
      icon: '👥',
      title: 'Add your first client',
      desc: 'Add a customer you do business with',
      link: '/clients',
      cta: 'Add client',
    },
    {
      done: invoiceCount > 0,
      icon: '📄',
      title: 'Create your first invoice',
      desc: 'Send a professional invoice and get paid',
      link: '/invoices',
      cta: 'Create invoice',
    },
  ]

  const allDone = steps.every(s => s.done)
  if (allDone) return null

  const completedCount = steps.filter(s => s.done).length

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,197,102,0.06) 0%, rgba(124,106,247,0.04) 100%)',
      border: '1px solid rgba(0,197,102,0.15)',
      borderRadius: '20px',
      padding: '1.5rem 2rem',
      marginBottom: '2rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.2rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#EDF2EF',
            marginBottom: '0.2rem',
          }}>
            🚀 Get started with StackPay
          </h3>
          <p style={{ color: '#7A9485', fontSize: '0.82rem' }}>
            {completedCount} of {steps.length} steps completed
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '120px',
          height: '6px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(completedCount / steps.length) * 100}%`,
            height: '100%',
            background: '#00C566',
            borderRadius: '3px',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem',
      }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            background: step.done
              ? 'rgba(0,197,102,0.06)'
              : '#111815',
            border: `1px solid ${step.done
              ? 'rgba(0,197,102,0.2)'
              : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: step.done
                ? 'rgba(0,197,102,0.15)'
                : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              flexShrink: 0,
            }}>
              {step.done ? '✓' : step.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: step.done ? '#7A9485' : '#EDF2EF',
                marginBottom: '0.2rem',
                textDecoration: step.done ? 'line-through' : 'none',
              }}>
                {step.title}
              </div>
              <div style={{
                color: '#4A6055',
                fontSize: '0.78rem',
                marginBottom: '0.6rem',
                lineHeight: 1.4,
              }}>
                {step.desc}
              </div>
              {!step.done && (
                <Link to={step.link} style={{
                  color: '#00C566',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontFamily: 'Syne, sans-serif',
                }}>
                  {step.cta} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OnboardingBanner
