import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/invoices', icon: '📄', label: 'Invoices' },
  { path: '/clients', icon: '👥', label: 'Clients' },
  { path: '/expenses', icon: '💸', label: 'Expenses' },
  { path: '/reports', icon: '📊', label: 'Reports' },
  { path: '/team', icon: '🤝', label: 'Team' },
  { path: '/billing', icon: '💳', label: 'Billing' },
  { path: '/profile', icon: '⚙️', label: 'Settings' },
]

function AppLayout({ children }) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const Sidebar = () => (
    <div style={{
      width: '240px',
      minHeight: '100vh',
      background: '#0F1510',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0',
      position: 'fixed',
      top: 0,
      left: sidebarOpen ? 0 : '-240px',
      zIndex: 200,
      transition: 'left 0.3s ease',
    }}
      className="sidebar"
    >
      {/* Logo */}
      <div style={{
        padding: '0 1.5rem',
        marginBottom: '2.5rem',
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '1.4rem',
          color: '#F0F5F2',
        }}>
          Stack<span style={{ color: '#00C566' }}>Pay</span>
        </div>
        <div style={{
          color: '#8A9E92',
          fontSize: '0.78rem',
          marginTop: '0.2rem',
          fontWeight: 500,
        }}>
          {user?.email}
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '0 0.75rem' }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0.85rem',
                borderRadius: '10px',
                marginBottom: '0.25rem',
                background: active ? 'rgba(0,197,102,0.1)' : 'transparent',
                color: active ? '#00C566' : '#8A9E92',
                fontWeight: active ? 600 : 400,
                fontSize: '0.92rem',
                textDecoration: 'none',
                transition: 'all 0.2s',
                border: active
                  ? '1px solid rgba(0,197,102,0.2)'
                  : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div style={{ padding: '0 0.75rem' }}>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 0.85rem',
            borderRadius: '10px',
            background: 'transparent',
            color: '#8A9E92',
            fontSize: '0.92rem',
            border: '1px solid transparent',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#ff8080'
            e.currentTarget.style.background = 'rgba(255,80,80,0.05)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#8A9E92'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#080C0A',
    }}>
      {/* Desktop sidebar always visible */}
      <div className="desktop-sidebar" style={{
        width: '240px',
        flexShrink: 0,
      }}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 199,
          }}
        />
      )}

      {/* Mobile sidebar */}
      <div className="mobile-sidebar">
        <Sidebar />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: '60px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          background: '#080C0A',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F0F5F2',
              fontSize: '1.3rem',
              cursor: 'pointer',
              display: 'none',
            }}
          >
            ☰
          </button>
          <div style={{
            color: '#8A9E92',
            fontSize: '0.88rem',
          }}>
            {new Date().toLocaleDateString('en-NG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'rgba(0,197,102,0.15)',
            border: '1px solid rgba(0,197,102,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00C566',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '2rem 1.5rem' }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .hamburger { display: flex !important; }
          .mobile-sidebar .sidebar { left: ${sidebarOpen ? '0' : '-240px'}; }
        }
        @media (min-width: 769px) {
          .mobile-sidebar { display: none; }
          .sidebar { left: 0 !important; }
        }
      `}</style>
    </div>
  )
}

export default AppLayout
