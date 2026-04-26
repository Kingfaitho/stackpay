import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from './ThemeToggle'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { colors, isDark } = useTheme()

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <>
      <nav style={{
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
        background: colors.bgNav,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.border}`,
        transition: 'background 0.3s, border-color 0.3s',
      }}>

        {/* Logo */}
        <Link to="/" style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '1.4rem',
          color: colors.textPrimary,
          textDecoration: 'none',
          letterSpacing: '-0.5px',
          transition: 'color 0.3s',
        }}>
          Stack<span style={{ color: colors.green }}>Pay</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="nav-links" style={{
          display: 'flex',
          gap: '1.5rem',
          listStyle: 'none',
          alignItems: 'center',
        }}>
          {['features', 'how-it-works', 'marketplace', 'pricing'].map(id => (
            <li
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                color: colors.textSecondary,
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.2s',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.color = colors.textPrimary}
              onMouseLeave={e => e.currentTarget.style.color = colors.textSecondary}
            >
              {id.replace('-', ' ')}
            </li>
          ))}

          <li>
            <ThemeToggle compact={true} />
          </li>

          <li>
            <Link
              to="/login"
              style={{
                color: colors.textSecondary,
                fontSize: '0.9rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Login
            </Link>
          </li>

          <li>
            <Link
              to="/signup"
              style={{
                background: colors.accent,
                color: colors.accentText,
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                fontFamily: 'Syne, sans-serif',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Get Started Free
            </Link>
          </li>
        </ul>

        {/* Mobile Hamburger */}
        <button
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.textPrimary,
            cursor: 'pointer',
            display: 'none',
            padding: '4px',
          }}
        >
          {menuOpen
            ? <X size={24} />
            : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: 0,
          right: 0,
          background: colors.bgCard,
          borderBottom: `1px solid ${colors.border}`,
          padding: '1.5rem 5%',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          {['features', 'how-it-works', 'marketplace', 'pricing'].map(id => (
            <span
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                color: colors.textSecondary,
                fontSize: '1rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {id.replace('-', ' ')}
            </span>
          ))}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              color: colors.textSecondary,
              fontSize: '0.9rem',
            }}>
              {isDark ? 'Switch to Light' : 'Switch to Dark'}
            </span>
            <ThemeToggle compact={true} />
          </div>

          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            style={{
              color: colors.textSecondary,
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            Login
          </Link>

          <Link
            to="/signup"
            onClick={() => setMenuOpen(false)}
            style={{
              color: colors.green,
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Get Started Free →
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  )
}

export default Navbar
