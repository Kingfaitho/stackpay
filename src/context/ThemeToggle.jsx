import { useTheme } from '../context/ThemeContext'

function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.06)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = isDark
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(0,0,0,0.1)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.06)'
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: '12px',
      background: isDark
        ? 'rgba(255,255,255,0.03)'
        : 'rgba(0,0,0,0.03)',
      border: isDark
        ? '1px solid rgba(255,255,255,0.07)'
        : '1px solid rgba(0,0,0,0.08)',
      cursor: 'pointer',
    }}
      onClick={toggleTheme}
    >
      <span style={{ fontSize: '1rem' }}>
        {isDark ? '☀️' : '🌙'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '0.85rem',
          color: isDark ? '#EDF2EF' : '#1a1a1a',
          marginBottom: '0.1rem',
        }}>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </div>
        <div style={{
          fontSize: '0.72rem',
          color: isDark ? '#7A9485' : '#666',
        }}>
          {isDark ? 'Switch to white theme' : 'Switch to dark theme'}
        </div>
      </div>

      {/* Toggle pill */}
      <div style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: isDark ? 'rgba(255,255,255,0.1)' : '#C9A84C',
        position: 'relative',
        transition: 'background 0.3s',
        flexShrink: 0,
      }}>
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: '3px',
          left: isDark ? '3px' : '23px',
          transition: 'left 0.3s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  )
}

export default ThemeToggle
