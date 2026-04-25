import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/invoices', icon: '📄', label: 'Invoices' },
  { path: '/clients', icon: '👥', label: 'Clients' },
  { path: '/expenses', icon: '💸', label: 'Expenses' },
  { path: '/reports', icon: '📊', label: 'Reports' },
  { path: '/budget', icon: '🎯', label: 'Budget' },
  { path: '/recurring', icon: '🔄', label: 'Recurring' },
  { path: '/team', icon: '🤝', label: 'Team' },
  { path: '/billing', icon: '💳', label: 'Billing' },
  { path: '/profile', icon: '⚙️', label: 'Settings' },
]

function AppLayout({ children }) {
  const { user, signOut } = useAuth()
  const { colors, isDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const SidebarContent = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: colors.bgSidebar,
      borderRight: `1px solid ${colors.border}`,
      transition: 'background 0.3s',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.5rem',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '1.4rem',
          color: colors.textPrimary,
          marginBottom: '0.15rem',
        }}>
          Stack<span style={{ color: colors.green }}>Pay</span>
        </div>
        <div style={{
          color: colors.textMuted,
          fontSize: '0.72rem',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {user?.email}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
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
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                marginBottom: '0.2rem',
                background: active
                  ? colors.sidebarActive
                  : 'transparent',
                color: active
                  ? colors.sidebarActiveText
                  : colors.sidebarText,
                fontWeight: active ? 600 : 400,
                fontSize: '0.88rem',
                textDecoration: 'none',
                transition: 'all 0.2s',
                border: active
                  ? `1px solid ${colors.sidebarActiveBorder}`
                  : '1px solid transparent',
                fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.04)'
                  e.currentTarget.style.color = colors.textPrimary
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = colors.sidebarText
                }
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: '0.75rem',
        borderTop: `1px solid ${colors.border}`,
      }}>
        <ThemeToggle />

        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            background: 'transparent',
            color: colors.textMuted,
            fontSize: '0.88rem',
            border: '1px solid transparent',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            transition: 'all 0.2s',
            marginTop: '0.25rem',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = colors.danger
            e.currentTarget.style.background = isDark
              ? 'rgba(255,80,80,0.06)'
              : 'rgba(204,34,0,0.06)'
            e.currentTarget.style.borderColor = isDark
              ? 'rgba(255,80,80,0.15)'
              : 'rgba(204,34,0,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = colors.textMuted
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
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
      background: colors.bgPrimary,
      transition: 'background 0.3s',
    }}>

      {/* Desktop Sidebar */}
      <div
        className="desktop-sidebar"
        style={{ width: '240px', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}
      >
        <SidebarContent />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 199,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className="mobile-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 0 : '-260px',
          width: '240px',
          height: '100vh',
          zIndex: 200,
          transition: 'left 0.3s ease',
        }}
      >
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Top Bar */}
        <div style={{
          height: '60px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          background: colors.bgTopbar,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'background 0.3s',
          backdropFilter: 'blur(12px)',
        }}>

          {/* Hamburger */}
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textPrimary,
              fontSize: '1.3rem',
              cursor: 'pointer',
              display: 'none',
              padding: '0.25rem',
            }}
          >
            ☰
          </button>

          {/* Date */}
          <div style={{
            color: colors.textSecondary,
            fontSize: '0.85rem',
          }}>
            {new Date().toLocaleDateString('en-NG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          {/* Right cluster */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}>
            <ThemeToggle compact={true} />

            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: isDark
                ? 'rgba(0,197,102,0.15)'
                : 'rgba(201,168,76,0.15)',
              border: isDark
                ? '1px solid rgba(0,197,102,0.3)'
                : '1px solid rgba(201,168,76,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.green,
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{
          flex: 1,
          padding: '1.5rem',
          background: colors.bgPrimary,
          transition: 'background 0.3s',
          overflowX: 'hidden',
        }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default AppLayout
