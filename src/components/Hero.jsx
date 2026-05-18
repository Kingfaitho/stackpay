import { useState, useEffect, useRef } from 'react'
import { ArrowRight, CheckCircle, Zap, Shield, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function CountUp({ end, prefix = '', suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const startTime = Date.now()
        const tick = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * end))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

export default function Hero() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 40 })
  const navigate = useNavigate()
  const { colors, isDark } = useTheme()

  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const mockStats = [
    { label: 'Revenue', value: '₦847,000', change: '+23%', up: true },
    { label: 'Profit', value: '₦312,400', change: '+18%', up: true },
    { label: 'Unpaid', value: '₦45,000', change: '2 invoices', up: false },
  ]

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '120px 5% 140px',
      position: 'relative',
      overflow: 'hidden',
      background: colors.bgPrimary,
    }}>

      {/* ── BACKGROUND LAYER 1: Mouse-reactive radial glow ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isDark
          ? `radial-gradient(ellipse 70% 60% at ${mousePos.x}% ${mousePos.y}%,
              rgba(0,197,102,0.13) 0%,
              rgba(0,197,102,0.04) 40%,
              transparent 70%),
             radial-gradient(ellipse 50% 50% at ${100 - mousePos.x}% ${100 - mousePos.y}%,
              rgba(124,106,247,0.10) 0%,
              transparent 60%)`
          : `radial-gradient(ellipse 70% 60% at ${mousePos.x}% ${mousePos.y}%,
              rgba(0,120,60,0.09) 0%,
              rgba(0,120,60,0.03) 40%,
              transparent 70%),
             radial-gradient(ellipse 50% 50% at ${100 - mousePos.x}% ${100 - mousePos.y}%,
              rgba(91,78,199,0.07) 0%,
              transparent 60%)`,
        transition: 'background 0.08s linear',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── BACKGROUND LAYER 2: Conic sweep ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isDark
          ? `conic-gradient(from 180deg at 50% 50%,
              rgba(0,197,102,0) 0deg,
              rgba(0,197,102,0.04) 60deg,
              rgba(0,197,102,0) 120deg,
              rgba(124,106,247,0.03) 200deg,
              rgba(0,197,102,0) 280deg,
              rgba(201,168,76,0.03) 330deg,
              rgba(0,197,102,0) 360deg)`
          : `conic-gradient(from 180deg at 50% 50%,
              rgba(0,0,0,0) 0deg,
              rgba(0,120,60,0.03) 60deg,
              rgba(0,0,0,0) 120deg,
              rgba(91,78,199,0.02) 200deg,
              rgba(0,0,0,0) 280deg,
              rgba(184,140,0,0.02) 330deg,
              rgba(0,0,0,0) 360deg)`,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── BACKGROUND LAYER 3: Fine grid ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: isDark
          ? `linear-gradient(rgba(0,197,102,0.06) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0,197,102,0.06) 1px, transparent 1px)`
          : `linear-gradient(rgba(0,120,60,0.04) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0,120,60,0.04) 1px, transparent 1px)`,
        backgroundSize: '55px 55px',
        maskImage: 'radial-gradient(ellipse 85% 85% at 50% 45%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 45%, black 20%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── BACKGROUND LAYER 4: Floating orbs ── */}
      {/* Orb 1 — green top left */}
      <div style={{
        position: 'absolute',
        top: '8%',
        left: '5%',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(0,197,102,0.12) 0%, rgba(0,197,102,0.02) 60%, transparent 100%)'
          : 'radial-gradient(circle, rgba(0,120,60,0.08) 0%, transparent 70%)',
        animation: 'orbMove1 9s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Orb 2 — purple bottom right */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(124,106,247,0.12) 0%, rgba(124,106,247,0.02) 60%, transparent 100%)'
          : 'radial-gradient(circle, rgba(91,78,199,0.07) 0%, transparent 70%)',
        animation: 'orbMove2 11s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Orb 3 — gold center pulse */}
      <div style={{
        position: 'absolute',
        top: '45%',
        left: '45%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 65%)'
          : 'radial-gradient(circle, rgba(184,140,0,0.04) 0%, transparent 65%)',
        transform: 'translate(-50%, -50%)',
        animation: 'orbPulse 7s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Orb 4 — green bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '8%',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(0,197,102,0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(0,120,60,0.05) 0%, transparent 70%)',
        animation: 'orbMove3 13s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── BACKGROUND LAYER 5: Floating particles ── */}
      {Array.from({ length: 18 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 17 + 7) % 95}%`,
          top: `${(i * 23 + 11) % 88}%`,
          width: `${(i % 3) + 2}px`,
          height: `${(i % 3) + 2}px`,
          borderRadius: '50%',
          background: i % 3 === 0
            ? colors.green
            : i % 3 === 1
            ? colors.purple
            : colors.accent,
          opacity: 0.35,
          animation: `particleDrift ${5 + (i % 4)}s ease-in-out infinite`,
          animationDelay: `${(i * 0.4) % 4}s`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      ))}

      {/* ── FLOATING UI CARDS (desktop only) ── */}

      {/* Left card — invoice paid */}
      <div className="hero-float-left" style={{
        display: 'none',
        position: 'absolute',
        left: '2%',
        top: '28%',
        zIndex: 2,
        animation: 'floatCard1 4s ease-in-out infinite',
      }}>
        <div style={{
          background: isDark ? 'rgba(15,20,17,0.95)' : 'rgba(255,255,255,0.95)',
          border: `1px solid ${isDark ? 'rgba(0,197,102,0.3)' : 'rgba(0,120,60,0.2)'}`,
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          width: '195px',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,197,102,0.1)'
            : '0 20px 60px rgba(0,0,0,0.15)',
        }}>
          <div style={{
            fontSize: '0.62rem',
            color: colors.textMuted,
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}>
            Invoice Paid ✓
          </div>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.3rem',
            color: colors.green,
            marginBottom: '0.15rem',
          }}>
            ₦150,000
          </div>
          <div style={{ color: colors.textMuted, fontSize: '0.68rem' }}>
            Emeka · Logo Design
          </div>
          <div style={{
            marginTop: '0.65rem',
            height: '4px',
            borderRadius: '2px',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: '100%',
              background: `linear-gradient(90deg, ${colors.green}, ${colors.accent})`,
              borderRadius: '2px',
            }} />
          </div>
        </div>
      </div>

      {/* Right card — credit score */}
      <div className="hero-float-right" style={{
        display: 'none',
        position: 'absolute',
        right: '2%',
        top: '24%',
        zIndex: 2,
        animation: 'floatCard2 5s ease-in-out infinite',
        animationDelay: '1s',
      }}>
        <div style={{
          background: isDark ? 'rgba(15,20,17,0.95)' : 'rgba(255,255,255,0.95)',
          border: `1px solid ${isDark ? 'rgba(124,106,247,0.3)' : 'rgba(91,78,199,0.2)'}`,
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          width: '185px',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.6)'
            : '0 20px 60px rgba(0,0,0,0.15)',
        }}>
          <div style={{
            fontSize: '0.62rem',
            color: colors.textMuted,
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>
            Credit Score
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.25rem',
            marginBottom: '0.4rem',
          }}>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 900,
              fontSize: '1.8rem',
              color: colors.purple,
              lineHeight: 1,
            }}>
              720
            </span>
            <span style={{ color: colors.textMuted, fontSize: '0.68rem' }}>
              /1000
            </span>
          </div>
          <div style={{
            fontSize: '0.68rem',
            color: colors.green,
            fontWeight: 700,
          }}>
            Loan eligible: ₦1M+
          </div>
          <div style={{
            marginTop: '0.5rem',
            height: '3px',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: '72%',
              background: colors.purple,
              borderRadius: '2px',
            }} />
          </div>
        </div>
      </div>

      {/* Bottom floating pill — runway */}
      <div className="hero-float-bottom" style={{
        display: 'none',
        position: 'absolute',
        bottom: '14%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        animation: 'floatCard1 3.5s ease-in-out infinite',
        animationDelay: '0.5s',
      }}>
        <div style={{
          background: isDark ? 'rgba(15,20,17,0.95)' : 'rgba(255,255,255,0.95)',
          border: `1px solid ${isDark ? 'rgba(0,197,102,0.35)' : 'rgba(0,120,60,0.25)'}`,
          borderRadius: '100px',
          padding: '0.6rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark
            ? '0 12px 40px rgba(0,0,0,0.5)'
            : '0 12px 40px rgba(0,0,0,0.12)',
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: colors.green,
            animation: 'livePulse 1.5s infinite',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.82rem',
            color: colors.green,
          }}>
            Business Runway: 74 days safe
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '800px',
        width: '100%',
      }}>

        {/* NEW badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: isDark
            ? 'rgba(0,197,102,0.12)'
            : 'rgba(0,120,60,0.08)',
          border: `1px solid ${isDark ? 'rgba(0,197,102,0.3)' : 'rgba(0,120,60,0.2)'}`,
          borderRadius: '100px',
          padding: '0.35rem 1rem 0.35rem 0.5rem',
          marginBottom: '2rem',
          animation: 'fadeDown 0.5s ease both',
        }}>
          <span style={{
            background: colors.green,
            color: '#fff',
            borderRadius: '100px',
            padding: '0.12rem 0.55rem',
            fontSize: '0.65rem',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
          }}>
            NEW
          </span>
          <span style={{
            fontSize: '0.78rem',
            color: colors.green,
            fontWeight: 600,
            fontFamily: 'Syne, sans-serif',
          }}>
            Financial brain for Nigerian businesses
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)',
          lineHeight: 1.05,
          letterSpacing: '-2.5px',
          marginBottom: '1.5rem',
          color: colors.textPrimary,
          animation: 'fadeDown 0.5s ease 0.1s both',
        }}>
          Know your real profit.
          <br />

          {/* Gradient text — GPU forced, works in ALL themes */}
          <span style={{
            display: 'inline-block',
            color: 'transparent',
            backgroundImage: isDark
              ? 'linear-gradient(135deg, #00C566 0%, #C9A84C 50%, #7C6AF7 100%)'
              : 'linear-gradient(135deg, #007A3D 0%, #B8860B 50%, #5B4EC7 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            backgroundSize: '200% 200%',
            animation: 'gradientShift 4s ease infinite',
          }}>
            Get paid faster.
          </span>
          <br />
          Grow with clarity.
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          color: colors.textSecondary,
          maxWidth: '560px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.75,
          animation: 'fadeDown 0.5s ease 0.2s both',
        }}>
          Ledga is the financial management platform built for Nigerian professionals
          and service businesses. Invoices, expenses, cash flow forecasting,
          and AI-powered insights - all in one place.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '2.5rem',
          animation: 'fadeDown 0.5s ease 0.3s both',
        }}>
          <button
            onClick={() => navigate('/signup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: colors.green,
              color: '#fff',
              padding: '1rem 2.25rem',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '1rem',
              fontFamily: 'Syne, sans-serif',
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 6px 30px ${colors.green}50`,
              transition: 'all 0.25s',
              letterSpacing: '-0.3px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = `0 12px 40px ${colors.green}60`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = `0 6px 30px ${colors.green}50`
            }}
          >
            Start Free - No Card Needed <ArrowRight size={18} />
          </button>

          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              color: colors.textPrimary,
              padding: '1rem 1.8rem',
              borderRadius: '14px',
              fontWeight: 600,
              fontSize: '1rem',
              fontFamily: 'Syne, sans-serif',
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = colors.borderGreen
              e.currentTarget.style.color = colors.green
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.color = colors.textPrimary
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            See How It Works
          </button>
        </div>

        {/* Mini dashboard preview */}
        <div style={{
          background: isDark
            ? 'rgba(10,16,12,0.9)'
            : 'rgba(255,255,255,0.92)',
          border: `1px solid ${isDark ? 'rgba(0,197,102,0.2)' : 'rgba(0,120,60,0.15)'}`,
          borderRadius: '20px',
          padding: '1.5rem',
          maxWidth: '520px',
          margin: '0 auto 2rem',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark
            ? '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(0,197,102,0.1)'
            : '0 40px 100px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
          animation: 'fadeUp 0.8s ease 0.4s both',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle inner glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${colors.green}40, transparent)`,
          }} />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.1rem',
          }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: colors.textPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              <span>📊</span> Live Dashboard Preview
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.65rem',
              color: colors.green,
              fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: colors.green,
                animation: 'livePulse 1.5s infinite',
              }} />
              LIVE
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.6rem',
            marginBottom: '1.1rem',
          }}>
            {mockStats.map((stat, i) => (
              <div key={i} style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                borderRadius: '10px',
                padding: '0.7rem 0.6rem',
              }}>
                <div style={{
                  color: colors.textMuted,
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '0.3rem',
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  color: i === 2 ? colors.warning : colors.textPrimary,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.6rem',
                  color: stat.up ? colors.green : colors.warning,
                  fontWeight: 700,
                  marginTop: '0.15rem',
                }}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          {/* Animated bar chart */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{
              fontSize: '0.62rem',
              color: colors.textMuted,
              fontWeight: 600,
              marginBottom: '0.5rem',
              textAlign: 'left',
            }}>
              Revenue vs Expenses — 6 months
            </div>
            <div style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'flex-end',
              height: '56px',
            }}>
              {[
                { inc: 55, exp: 40 },
                { inc: 45, exp: 38 },
                { inc: 70, exp: 48 },
                { inc: 58, exp: 40 },
                { inc: 80, exp: 52 },
                { inc: 92, exp: 56 },
              ].map((bar, i) => (
                <div key={i} style={{
                  flex: 1,
                  display: 'flex',
                  gap: '2px',
                  alignItems: 'flex-end',
                }}>
                  <div style={{
                    flex: 1,
                    height: `${bar.inc}%`,
                    background: `linear-gradient(180deg, ${colors.green} 0%, ${colors.accent}80 100%)`,
                    borderRadius: '3px 3px 0 0',
                    opacity: 0,
                    animation: `growBar 0.6s ease ${0.5 + i * 0.08}s forwards`,
                  }} />
                  <div style={{
                    flex: 1,
                    height: `${bar.exp}%`,
                    background: isDark
                      ? 'rgba(255,80,80,0.4)'
                      : 'rgba(204,34,0,0.3)',
                    borderRadius: '3px 3px 0 0',
                    opacity: 0,
                    animation: `growBar 0.6s ease ${0.58 + i * 0.08}s forwards`,
                  }} />
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.25rem',
              marginTop: '0.4rem',
            }}>
              {[
                { color: colors.green, label: 'Revenue' },
                { color: isDark ? 'rgba(255,80,80,0.5)' : 'rgba(204,34,0,0.4)', label: 'Expenses' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.6rem',
                  color: colors.textMuted,
                }}>
                  <div style={{
                    width: '8px',
                    height: '4px',
                    borderRadius: '2px',
                    background: item.color,
                  }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Runway indicator */}
          <div style={{
            background: isDark
              ? 'rgba(0,197,102,0.08)'
              : 'rgba(0,120,60,0.06)',
            border: `1px solid ${isDark ? 'rgba(0,197,102,0.2)' : 'rgba(0,120,60,0.15)'}`,
            borderRadius: '8px',
            padding: '0.55rem 0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '0.7rem',
              color: colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              💧 Business Runway
            </span>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '0.82rem',
              color: colors.green,
            }}>
              74 days safe ✓
            </span>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
          animation: 'fadeDown 0.5s ease 0.5s both',
        }}>
          {[
            { icon: <Shield size={14} />, text: 'Bank-grade security' },
            { icon: <Zap size={14} />, text: 'Paystack integrated' },
            { icon: <TrendingUp size={14} />, text: 'AI-powered insights' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: colors.textMuted,
              fontSize: '0.8rem',
            }}>
              <span style={{ color: colors.green }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS BOTTOM BAR ── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '0.85rem 5%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'clamp(1rem, 4vw, 3rem)',
        flexWrap: 'wrap',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        background: isDark
          ? 'rgba(6,9,8,0.85)'
          : 'rgba(248,246,241,0.9)',
        backdropFilter: 'blur(20px)',
        zIndex: 3,
      }}>
        {[
          { end: 39, suffix: 'M+', label: 'Nigerian SMEs' },
          { end: 0, prefix: '₦', suffix: '', label: 'Free to start' },
          { end: 90, suffix: 'd', label: 'Cash forecast' },
          { end: 1000, suffix: '', label: 'Credit score' },
        ].map((item, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
              color: colors.green,
              lineHeight: 1.1,
            }}>
              <CountUp end={item.end} prefix={item.prefix || ''} suffix={item.suffix} />
            </div>
            <div style={{
              color: colors.textMuted,
              fontSize: 'clamp(0.6rem, 1.2vw, 0.7rem)',
              marginTop: '0.1rem',
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── ALL ANIMATIONS ── */}
      <style>{`
        @keyframes orbMove1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          25% { transform: translate(35px, -25px) scale(1.08); }
          50% { transform: translate(15px, 30px) scale(0.96); }
          75% { transform: translate(-20px, 10px) scale(1.04); }
        }
        @keyframes orbMove2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          30% { transform: translate(-30px, 35px) scale(1.06); }
          60% { transform: translate(20px, -15px) scale(0.94); }
        }
        @keyframes orbMove3 {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(25px, -35px); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
        }
        @keyframes particleDrift {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          33% { transform: translateY(-18px) translateX(8px); opacity: 0.6; }
          66% { transform: translateY(10px) translateX(-6px); opacity: 0.2; }
        }
        @keyframes floatCard1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatCard2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes growBar {
          from { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
          to { opacity: 1; transform: scaleY(1); transform-origin: bottom; }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes spi-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (min-width: 1024px) {
          .hero-float-left { display: block !important; }
          .hero-float-right { display: block !important; }
          .hero-float-bottom { display: block !important; }
        }
      `}</style>
    </section>
  )
}