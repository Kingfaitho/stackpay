import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: '0 5%',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(8, 12, 10, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  logo: {
    fontFamily: 'Syne, sans-serif',
    fontWeight: 800,
    fontSize: '1.4rem',
    color: '#F0F5F2',
    letterSpacing: '-0.5px',
  },
  logoSpan: {
    color: '#00C566',
  },
  links: {
    display: 'flex',
    gap: '2rem',
    listStyle: 'none',
    alignItems: 'center',
  },
  link: {
    color: '#8A9E92',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'color 0.2s',
    cursor: 'pointer',
  },
  ctaBtn: {
    background: '#00C566',
    color: '#080C0A',
    padding: '0.5rem 1.2rem',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.9rem',
    fontFamily: 'Syne, sans-serif',
    transition: 'background 0.2s',
  },
  mobileMenu: {
    display: 'none',
    background: 'transparent',
    color: '#F0F5F2',
    padding: '4px',
  },
};

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          Stack<span style={styles.logoSpan}>Pay</span>
        </div>

        <ul style={styles.links} className="nav-links">
          <li style={styles.link} onClick={() => scrollTo('features')}>Features</li>
          <li style={styles.link} onClick={() => scrollTo('how-it-works')}>How it works</li>
          <li style={styles.link} onClick={() => scrollTo('pricing')}>Pricing</li>
          <li>
            <button
              style={styles.ctaBtn}
              onClick={() => scrollTo('waitlist')}
              onMouseEnter={e => e.target.style.background = '#00A855'}
              onMouseLeave={e => e.target.style.background = '#00C566'}
            >
              Join Waitlist
            </button>
          </li>
        </ul>

        <button
          style={{ ...styles.mobileMenu, display: 'none' }}
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: 0,
          right: 0,
          background: '#0F1510',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '1.5rem 5%',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
        }}>
          {['features', 'how-it-works', 'pricing', 'waitlist'].map((item) => (
            <span
              key={item}
              onClick={() => scrollTo(item)}
              style={{ color: '#8A9E92', fontSize: '1rem', cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {item.replace('-', ' ')}
            </span>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}

export default Navbar;
