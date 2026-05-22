import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../supabaseClient'
import ThemeToggle from './ThemeToggle'
import GlobalSearch from './GlobalSearch'

const navItems = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard', minInvoices: 0 },
  { path: '/invoices', icon: '📄', label: 'Invoices', minInvoices: 0 },
  { path: '/clients', icon: '👥', label: 'Clients', minInvoices: 0 },
  { path: '/expenses', icon: '💸', label: 'Expenses', minInvoices: 1 },
  { path: '/cash-receipts', icon: '💵', label: 'Cash Receipts', minInvoices: 1 },
  { path: '/cashflow', icon: '💧', label: 'Cash Flow', minInvoices: 3 },
  { path: '/collections', icon: '🏃', label: 'Collections', minInvoices: 3 },
  { path: '/budget', icon: '🎯', label: 'Budget', minInvoices: 5 },
  { path: '/inventory', icon: '📦', label: 'Inventory', minInvoices: 1 },
  { path: '/pos', icon: '🏪', label: 'Point of Sale', minInvoices: 5 },
  { path: '/work-orders', icon: '⚡️', label: 'Work Orders', minInvoices: 1 },
  { path: '/reports', icon: '📊', label: 'Reports', minInvoices: 5 },
  { path: '/client-insights', icon: '🔍', label: 'Client Insights', minInvoices: 3 },
  { path: '/notes', icon: '📝', label: 'Notes & Tasks', minInvoices: 0 },
  { path: '/recurring', icon: '🔄', label: 'Recurring', minInvoices: 5 },
  { path: '/team', icon: '🤝', label: 'Team', minInvoices: 10 },
  { path: '/billing', icon: '💳', label: 'Billing', minInvoices: 0 },
  { path: '/help', icon: '🆘', label: 'Help', minInvoices: 0 },
  { path: '/profile', icon: '⚙️', label: 'Settings', minInvoices: 0 },
]

function AppLayout({ children }) {
  const { user, signOut } = useAuth()
  const { colors, isDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [invoiceCount, setInvoiceCount] = useState(0)

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('logo_url, business_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data))
    }
  }, [user])

  useEffect(() => {
    if (user) {
      supabase
        .from('invoices')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .then(({ count }) => setInvoiceCount(count || 0))
    }
  }, [user])

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

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
          {profile?.business_name || user?.email}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isLocked = invoiceCount < item.minInvoices
          return (
            <div key={item.path} style={{ position: 'relative' }}>
              <div
                onClick={() => {
                  if (isLocked) return
                  navigate(item.path)
                  setSidebarOpen(false)
                  setMobileOpen(false)
                }}
                title={isLocked
                  ? `Unlocks after ${item.minInvoices} invoice${item.minInvoices !== 1 ? 's' : ''}`
                  : item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.7rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '10px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  background: location.pathname === item.path && !isLocked
                    ? colors.sidebarActive
                    : 'transparent',
                  border: `1px solid ${location.pathname === item.path && !isLocked
                    ? colors.sidebarActiveBorder : 'transparent'}`,
                  color: isLocked
                    ? colors.textMuted
                    : location.pathname === item.path
                    ? colors.sidebarActiveText
                    : colors.sidebarText,
                  opacity: isLocked ? 0.45 : 1,
                  transition: 'all 0.15s',
                  marginBottom: '2px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  fontSize: '0.88rem',
                }}
                onMouseEnter={e => {
                  if (!isLocked && location.pathname !== item.path) {
                    e.currentTarget.style.background = isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.04)'
                    e.currentTarget.style.color = colors.textPrimary
                  }
                }}
                onMouseLeave={e => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = isLocked ? colors.textMuted : colors.sidebarText
                  }
                }}
              >
                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: location.pathname === item.path ? 700 : 500,
                  fontFamily: 'Syne, sans-serif',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </span>
                {isLocked && (
                  <span style={{
                    fontSize: '0.65rem',
                    color: colors.textMuted,
                    flexShrink: 0,
                  }}>
                    🔒
                  </span>
                )}
              </div>
            </div>
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
            {/* Search button */}
            <button
              onClick={() => setShowSearch(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.85rem',
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textMuted,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = colors.borderGreen
                e.currentTarget.style.color = colors.green
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.color = colors.textMuted
              }}
            >
              🔍
              <span className="search-shortcut">⌘K</span>
            </button>
            
            <ThemeToggle compact={true} />

            {/* Avatar — clickable, goes to profile */}
            <Link
              to="/profile"
              title="Go to Settings"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isDark
                  ? 'rgba(0,197,102,0.15)'
                  : 'rgba(201,168,76,0.15)',
                border: `1px solid ${isDark
                  ? 'rgba(0,197,102,0.3)'
                  : 'rgba(201,168,76,0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.green,
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.08)'
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.green}30`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {profile?.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt="Business logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                />
              ) : (
                user?.email?.[0]?.toUpperCase()
              )}
            </Link>
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

      {showSearch && (
        <GlobalSearch onClose={() => setShowSearch(false)} />
      )}

      <style>{`
        @media (max-width: 768px) {
          .search-shortcut { display: none; }
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