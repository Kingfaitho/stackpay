import { useState, useEffect } from 'react'

function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed this session
    const wasDismissed = sessionStorage.getItem('pwa_dismissed')
    if (wasDismissed) return

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      // Show after 30 seconds so it's not intrusive
      setTimeout(() => setVisible(true), 30000)
    }

    const installedHandler = () => {
      setInstalled(true)
      setVisible(false)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setVisible(false)
  }

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    sessionStorage.setItem('pwa_dismissed', 'true')
  }

  if (!visible || installed || dismissed) return null

  return (
    <>
      {/* Backdrop blur on mobile */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 998,
          backdropFilter: 'blur(2px)',
        }}
      />

      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
        width: 'calc(100% - 2rem)',
        maxWidth: '400px',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}>
        <div style={{
          background: '#111815',
          border: '1px solid rgba(0,197,102,0.3)',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,197,102,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Green glow top */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(0,197,102,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: '#8A9E92',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
            }}
          >
            ✕
          </button>

          {/* Content */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.2rem',
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(0,197,102,0.1)',
              border: '1px solid rgba(0,197,102,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0,
            }}>
              📱
            </div>
            <div>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                color: '#F0F5F2',
                fontSize: '1rem',
                marginBottom: '0.2rem',
              }}>
                Install StackPay
              </div>
              <div style={{
                color: '#7A9485',
                fontSize: '0.82rem',
                lineHeight: 1.4,
              }}>
                Add to your home screen for instant access — works offline too
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            marginBottom: '1.2rem',
          }}>
            {[
              '⚡️ Opens instantly like a native app',
              '📶 Works even with poor internet',
              '🔔 Get payment notifications',
            ].map((benefit, i) => (
              <div key={i} style={{
                color: '#7A9485',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}>
                {benefit}
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleInstall}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#00C566',
                color: '#080C0A',
                borderRadius: '12px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.92rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#00A855'}
              onMouseLeave={e => e.currentTarget.style.background = '#00C566'}
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              style={{
                padding: '0.75rem 1.2rem',
                background: 'transparent',
                color: '#8A9E92',
                borderRadius: '12px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '0.88rem',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  )
}

export default InstallPrompt
