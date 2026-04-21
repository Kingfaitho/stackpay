import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const navItems = ['features', 'how-it-works', 'marketplace', 'pricing']

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 5%', height: '70px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(8,12,10,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <Link to="/" style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '1.4rem', color: '#F0F5F2', textDecoration: 'none',
        }}>
          Stack<span style={{ color: '#00C566' }}>Pay</span>
        </Link>

        <ul className="nav-links" style={{
          display: 'flex', gap: '2rem', listStyle: 'none', alignItems: 'center',
        }}>
          
          {navItems.map(id => (
            <li
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                color: '#8A9E92',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.2s',
                textTransform: 'capitalize'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#F0F5F2'}
              onMouseLeave={e => e.currentTarget.style.color = '#8A9E92'}
            >
              {id.replace('-', ' ')}
            </li>
          ))}

          <li>
            <Link to="/login" style={{ color: '#8A9E92', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}>
              Login
            </Link>
          </li>

          <li>
            <Link to="/signup" style={{
              background: '#00C566',
              color: '#080C0A',
              padding: '0.5rem 1.2rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              fontFamily: 'Syne, sans-serif',
              textDecoration: 'none',
            }}>
              Get Started Free
            </Link>
          </li>
        </ul>

        <button
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#F0F5F2',
            cursor: 'pointer',
            display: 'none'
          }}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

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
          {navItems.map(id => (
            <span
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                color: '#8A9E92',
                fontSize: '1rem',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {id.replace('-', ' ')}
            </span>
          ))}

          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            style={{ color: '#8A9E92', fontSize: '1rem', textDecoration: 'none' }}
          >
            Login
          </Link>

          <Link
            to="/signup"
            onClick={() => setMenuOpen(false)}
            style={{
              color: '#00C566',
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none'
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