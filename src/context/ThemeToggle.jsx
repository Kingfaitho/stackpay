import { useTheme } from '../context/ThemeContext'

function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme, colors, isDark } = useTheme()

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          transition: 'all 0.2s',
          flexShrink: 0,
          color: colors.textSecondary,
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    )
  }

  return (
    <div
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 0.85rem',
        borderRadius: '12px',
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '0.5rem',
      }}
    >
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>
        {isDark ? '☀️' : '🌙'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '0.85rem',
          color: colors.textPrimary,
          marginBottom: '0.1rem',
        }}>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </div>
        <div style={{ fontSize: '0.72rem', color: colors.textMuted }}>
          {isDark ? 'Switch to white theme' : 'Switch to dark theme'}
        </div>
      </div>

      <div style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: isDark ? 'rgba(255,255,255,0.1)' : colors.accent,
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
