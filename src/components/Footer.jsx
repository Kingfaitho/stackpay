import { X, Mail, Linkedin } from 'lucide-react';

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      padding: '60px 5% 40px',
      background: '#080C0A',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '3rem',
          marginBottom: '50px',
        }}>
          {/* Brand column */}
          <div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.4rem',
              color: '#F0F5F2',
              marginBottom: '1rem',
            }}>
              Stack<span style={{ color: '#00C566' }}>Pay</span>
            </div>
            <p style={{
              color: '#8A9E92',
              fontSize: '0.88rem',
              lineHeight: 1.7,
              maxWidth: '240px',
            }}>
              The all-in-one financial tool built for Nigerian business owners.
              Simple. Local. Powerful.
            </p>
            <div style={{
              display: 'flex',
              gap: '0.8rem',
              marginTop: '1.2rem',
            }}>
              {[X, Linkedin, Mail].map((Icon, i) => (
                <div
                  key={i}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8A9E92',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(0,197,102,0.4)';
                    e.currentTarget.style.color = '#00C566';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = '#8A9E92';
                  }}
                >
                  <Icon size={16} />
                </div>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#F0F5F2',
              marginBottom: '1.2rem',
              letterSpacing: '0.5px',
            }}>
              Product
            </h4>
            {['Features', 'Pricing', 'How it works', 'Roadmap'].map((item) => (
              <div key={item} style={{
                color: '#8A9E92',
                fontSize: '0.88rem',
                marginBottom: '0.7rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#00C566'}
                onMouseLeave={e => e.currentTarget.style.color = '#8A9E92'}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#F0F5F2',
              marginBottom: '1.2rem',
              letterSpacing: '0.5px',
            }}>
              Company
            </h4>
            {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
              <div key={item} style={{
                color: '#8A9E92',
                fontSize: '0.88rem',
                marginBottom: '0.7rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#00C566'}
                onMouseLeave={e => e.currentTarget.style.color = '#8A9E92'}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h4 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#F0F5F2',
              marginBottom: '1.2rem',
              letterSpacing: '0.5px',
            }}>
              Legal
            </h4>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <div key={item} style={{
                color: '#8A9E92',
                fontSize: '0.88rem',
                marginBottom: '0.7rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#00C566'}
                onMouseLeave={e => e.currentTarget.style.color = '#8A9E92'}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <p style={{ color: '#8A9E92', fontSize: '0.82rem' }}>
            © 2025 StackPay. Built with 💚 in Nigeria.
          </p>
          <p style={{ color: '#8A9E92', fontSize: '0.82rem' }}>
            Making Nigerian businesses unstoppable.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;