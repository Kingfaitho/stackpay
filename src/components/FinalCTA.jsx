import { ArrowRight, ShieldCheck, Zap, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function FinalCTA() {
  const navigate = useNavigate()
  const { colors, isDark } = useTheme()

  return (
    <section style={{
      padding: '100px 5%',
      position: 'relative',
      overflow: 'hidden',
      background: colors.bgPrimary,
      transition: 'background 0.3s',
    }}>
      <div style={{
        maxWidth: '880px',
        margin: '0 auto',
        position: 'relative',
        borderRadius: '28px',
        padding: '1px',
        background: isDark
          ? 'linear-gradient(135deg, rgba(0,197,102,0.45), rgba(201,168,76,0.35) 50%, rgba(124,106,247,0.3))'
          : 'linear-gradient(135deg, rgba(0,120,60,0.3), rgba(184,140,0,0.3) 50%, rgba(91,78,199,0.25))',
      }}>
        <div style={{
          borderRadius: '27px',
          padding: 'clamp(2.5rem, 6vw, 4.5rem) clamp(1.5rem, 5vw, 4rem)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: isDark
            ? 'linear-gradient(160deg, #0B1F13 0%, #071209 60%, #0C1A10 100%)'
            : 'linear-gradient(160deg, #FFFFFF 0%, #F7F4EC 100%)',
        }}>
          {/* Glow accents - slow ambient drift */}
          <div style={{
            position: 'absolute', top: '-120px', left: '-80px',
            width: '360px', height: '360px', borderRadius: '50%',
            background: isDark ? 'rgba(0,197,102,0.10)' : 'rgba(0,120,60,0.06)',
            filter: 'blur(80px)', pointerEvents: 'none',
            animation: 'driftA 14s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '-120px', right: '-80px',
            width: '320px', height: '320px', borderRadius: '50%',
            background: isDark ? 'rgba(201,168,76,0.08)' : 'rgba(184,140,0,0.05)',
            filter: 'blur(70px)', pointerEvents: 'none',
            animation: 'driftB 17s ease-in-out infinite',
          }} />

          <span style={{
            color: isDark ? '#C9A84C' : '#B8860B',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.78rem',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '1.2rem',
            position: 'relative',
          }}>
            Start tonight, not someday
          </span>

          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            letterSpacing: '-1px',
            color: isDark ? '#F2F6F3' : colors.textPrimary,
            lineHeight: 1.2,
            marginBottom: '1.2rem',
            position: 'relative',
            transition: 'color 0.3s',
          }}>
            Your business deserves better than WhatsApp notes and scattered receipts
          </h2>
          <p style={{
            color: isDark ? 'rgba(237,242,239,0.6)' : colors.textSecondary,
            fontSize: '1rem',
            marginBottom: '2.5rem',
            lineHeight: 1.7,
            maxWidth: '520px',
            margin: '0 auto 2.5rem',
            position: 'relative',
            transition: 'color 0.3s',
          }}>
            Send your first invoice in the next 60 seconds and know your real
            profit by morning. Free to start - no card, no paperwork.
          </p>

          <button
            onClick={() => navigate('/signup')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: colors.green,
              color: '#fff',
              padding: '1.05rem 2.5rem',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '1.05rem',
              fontFamily: 'Syne, sans-serif',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '-0.3px',
              boxShadow: `0 8px 36px ${colors.green}50`,
              transition: 'transform 0.25s, box-shadow 0.25s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = `0 14px 44px ${colors.green}60`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = `0 8px 36px ${colors.green}50`
            }}
          >
            <span aria-hidden style={{
              position: 'absolute', top: 0, bottom: 0, width: '45%', left: '-60%',
              background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.35), transparent)',
              animation: 'ctaSheen 3.8s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            Start Free - Send Your First Invoice <ArrowRight size={18} />
          </button>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            marginTop: '1.75rem',
            position: 'relative',
          }}>
            {[
              { icon: <Clock size={13} />, text: 'Ready in 60 seconds' },
              { icon: <ShieldCheck size={13} />, text: 'Bank-grade security' },
              { icon: <Zap size={13} />, text: 'Paystack payments' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: isDark ? 'rgba(237,242,239,0.45)' : colors.textMuted,
                fontSize: '0.78rem',
              }}>
                <span style={{ color: colors.green, display: 'flex' }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA
