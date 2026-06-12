import { useTheme } from '../context/ThemeContext'

const stats = [
  { number: '60s', label: 'To send your first invoice' },
  { number: '₦0', label: 'To start - no card needed' },
  { number: '90d', label: 'Cash flow forecast ahead' },
  { number: '1', label: 'Dashboard for everything' },
]

function StatsBar() {
  const { colors, isDark } = useTheme()

  return (
    <section style={{
      borderTop: `1px solid ${colors.border}`,
      borderBottom: `1px solid ${colors.border}`,
      background: colors.bgSecondary,
      padding: '50px 5%',
      transition: 'background 0.3s, border-color 0.3s',
      position: 'relative',
    }}>
      {/* Living hairline that sweeps along the top edge */}
      <div aria-hidden style={{
        position: 'absolute', top: '-1px', left: 0, right: 0, height: '1px',
        background: isDark
          ? 'linear-gradient(90deg, transparent, rgba(0,197,102,0.55), rgba(201,168,76,0.4), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(0,120,60,0.4), rgba(184,140,0,0.3), transparent)',
        backgroundSize: '200% auto',
        animation: 'shimmer 5s linear infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '2rem',
        textAlign: 'center',
      }}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(2rem, 3vw, 2.8rem)',
              color: colors.green,
              letterSpacing: '-1px',
              marginBottom: '0.3rem',
              transition: 'color 0.3s',
            }}>
              {s.number}
            </div>
            <div style={{
              color: colors.textSecondary,
              fontSize: '0.88rem',
              fontWeight: 400,
              transition: 'color 0.3s',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default StatsBar

