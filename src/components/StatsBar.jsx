import { useTheme } from '../context/ThemeContext'

const stats = [
  { number: '39M+', label: 'Nigerian SMEs need this' },
  { number: '₦0', label: 'Cost to join waitlist' },
  { number: '1', label: 'Dashboard for everything' },
  { number: '500', label: 'Free early access spots' },
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
    }}>
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
