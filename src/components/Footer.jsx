import { useTheme } from '../context/ThemeContext'

function Footer() {
  const { colors, isDark } = useTheme()

  const linkStyle = {
    color: colors.textSecondary,
    fontSize: '0.88rem',
    display: 'block',
    marginBottom: '0.7rem',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.2s',
  }

  const headingStyle = {
    fontFamily: 'Syne, sans-serif',
    fontWeight: 700,
    fontSize: '0.9rem',
    color: colors.textPrimary,
    marginBottom: '1.2rem',
    letterSpacing: '0.5px',
    transition: 'color 0.3s',
  }

  return (
    <footer style={{
      borderTop: `1px solid ${colors.border}`,
      padding: '60px 5% 40px',
      background: colors.footerBg,
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '3rem',
          marginBottom: '50px',
        }}>

          {/* Brand */}
          <div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.4rem',
              color: colors.textPrimary,
              marginBottom: '1rem',
              transition: 'color 0.3s',
            }}>
              Stack<span style={{ color: colors.green }}>Pay</span>
            </div>
            <p style={{
              color: colors.textSecondary,
              fontSize: '0.88rem',
              lineHeight: 1.7,
              maxWidth: '240px',
              transition: 'color 0.3s',
            }}>
              The all-in-one financial tool built for Nigerian business owners.
              Simple. Local. Powerful.
            </p>

            {/* Social icons */}
            <div style={{
              display: 'flex',
              gap: '0.8rem',
              marginTop: '1.2rem',
            }}>
              {[
                { label: '𝕏', href: '#' },
                { label: 'in', href: '#' },
                { label: '✉️', href: '#' },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.textSecondary,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: colors.bgCard,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = colors.borderGreen
                    e.currentTarget.style.color = colors.green
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.color = colors.textSecondary
                  }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 style={headingStyle}>Product</h4>
            {['Features', 'Pricing', 'How it works', 'Roadmap'].map(item => (
              <a
                key={item}
                href="#"
                style={linkStyle}
                onMouseEnter={e => e.currentTarget.style.color = colors.green}
                onMouseLeave={e => e.currentTarget.style.color = colors.textSecondary}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={headingStyle}>Company</h4>
            {['About', 'Blog', 'Careers', 'Contact'].map(item => (
              <a
                key={item}
                href="#"
                style={linkStyle}
                onMouseEnter={e => e.currentTarget.style.color = colors.green}
                onMouseLeave={e => e.currentTarget.style.color = colors.textSecondary}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h4 style={headingStyle}>Legal</h4>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Cookie Policy', href: '/privacy' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                style={linkStyle}
                onMouseEnter={e => e.currentTarget.style.color = colors.green}
                onMouseLeave={e => e.currentTarget.style.color = colors.textSecondary}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: `1px solid ${colors.border}`,
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          transition: 'border-color 0.3s',
        }}>
          <p style={{
            color: colors.textMuted,
            fontSize: '0.82rem',
            transition: 'color 0.3s',
          }}>
            © 2025 StackPay. Built with 💚 in Nigeria.
          </p>
          <p style={{
            color: colors.textMuted,
            fontSize: '0.82rem',
            transition: 'color 0.3s',
          }}>
            Making Nigerian businesses unstoppable.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
