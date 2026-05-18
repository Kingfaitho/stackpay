import { useState, useEffect, useRef } from 'react'
import { ArrowRight, CheckCircle, Zap, Shield, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

// ── Animated floating card ────────────────────────────────────────────────────
function FloatingCard({ children, style, delay = 0 }) {
  return (
    <div style={{
      animation: `float ${3 + delay}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Animated number counter ───────────────────────────────────────────────────
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

// ── Particle dot ─────────────────────────────────────────────────────────────
function Particle({ x, y, size, color, duration, delay }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: color,
      opacity: 0.4,
      animation: `particleFloat ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      pointerEvents: 'none',
    }} />
  )
}

export default function Hero() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const navigate = useNavigate()
  const { colors, isDark } = useTheme()

  // Track mouse for parallax glow effect
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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  // Generate particles once
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    color: i % 3 === 0
      ? colors.green
      : i % 3 === 1
      ? colors.accent
      : colors.purple,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 3,
  }))

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
      padding: '120px 5% 80px',
      position: 'relative',
      overflow: 'hidden',
      background: colors.bgPrimary,
      transition: 'background 0.3s',
    }}>

      {/* ── Animated gradient background ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isDark
          ? `radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, rgba(0,197,102,0.12) 0%, transparent 50%),
             radial-gradient(ellipse at ${100 - mousePos.x}% ${100 - mousePos.y}%, rgba(124,106,247,0.08) 0%, transparent 50%)`
          : `radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, rgba(0,120,60,0.08) 0%, transparent 50%),
             radial-gradient(ellipse at ${100 - mousePos.x}% ${100 - mousePos.y}%, rgba(91,78,199,0.05) 0%, transparent 50%)`,
        transition: 'background 0.1s ease',
        pointerEvents: 'none',
      }} />

      {/* ── Grid pattern overlay ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: isDark
          ? `linear-gradient(rgba(0,197,102,0.04) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0,197,102,0.04) 1px, transparent 1px)`
          : `linear-gradient(rgba(0,120,60,0.03) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0,120,60,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
        maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
      }} />

      {/* ── Floating particles ── */}
      {particles.map(p => (
        <Particle key={p.id} {...p} />
      ))}

      {/* ── Floating UI preview cards ── */}
      {/* Left card — invoice preview */}
      <FloatingCard
        delay={0}
        style={{
          position: 'absolute',
          left: '3%',
          top: '25%',
          display: 'none',
        }}
      >
        <div className="hero-card-left" style={{
          background: colors.bgCard,
          border: `1px solid ${colors.borderGreen}`,
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          width: '200px',
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.5)'
            : '0 20px 60px rgba(0,0,0,0.12)',
          textAlign: 'left',
        }}>
          <div style={{
            fontSize: '0.65rem',
            color: colors.textMuted,
            fontWeight: 600,
            letterSpacing: '0.5px',
            marginBottom: '0.4rem',
            textTransform: 'uppercase',
          }}>
            Invoice Paid ✓
          </div>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.2rem',
            color: colors.green,
            marginBottom: '0.2rem',
          }}>
            ₦150,000
          </div>
          <div style={{ color: colors.textMuted, fontSize: '0.7rem' }}>
            Emeka — Logo Design
          </div>
          <div style={{
            marginTop: '0.6rem',
            height: '4px',
            borderRadius: '2px',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: '100%',
              background: colors.green,
              borderRadius: '2px',
              animation: 'fillBar 2s ease forwards',
            }} />
          </div>
        </div>
      </FloatingCard>

      {/* Right card — credit score */}
      <FloatingCard
        delay={1.5}
        style={{
          position: 'absolute',
          right: '3%',
          top: '30%',
          display: 'none',
        }}
      >
        <div className="hero-card-right" style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          width: '190px',
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.5)'
            : '0 20px 60px rgba(0,0,0,0.12)',
          textAlign: 'left',
        }}>
          <div style={{
            fontSize: '0.65rem',
            color: colors.textMuted,
            fontWeight: 600,
            letterSpacing: '0.5px',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
          }}>
            Credit Score
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.25rem',
            marginBottom: '0.5rem',
          }}>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.6rem',
              color: colors.purple,
            }}>
              720
            </span>
            <span style={{ color: colors.textMuted, fontSize: '0.7rem' }}>/1000</span>
          </div>
          <div style={{
            fontSize: '0.68rem',
            color: colors.green,
            fontWeight: 600,
          }}>
            Loan eligible: ₦1,000,000
          </div>
        </div>
      </FloatingCard>

      {/* Bottom card — runway */}
      <FloatingCard
        delay={0.8}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '12%',
          transform: 'translateX(-50%)',
          display: 'none',
        }}
      >
        <div className="hero-card-bottom" style={{
          background: colors.bgCard,
          border: `1px solid ${colors.borderGreen}`,
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.5)'
            : '0 20px 60px rgba(0,0,0,0.12)',
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: colors.green,
            animation: 'spi-pulse 2s infinite',
          }} />
          <span style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.82rem',
            color: colors.green,
          }}>
            Business Runway: 74 days
          </span>
        </div>
      </FloatingCard>

      {/* ── Main content ── */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '780px',
        width: '100%',
      }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: isDark
            ? 'rgba(0,197,102,0.1)'
            : 'rgba(0,120,60,0.08)',
          border: `1px solid ${isDark
            ? 'rgba(0,197,102,0.25)'
            : 'rgba(0,120,60,0.2)'}`,
          borderRadius: '100px',
          padding: '0.35rem 1rem 0.35rem 0.6rem',
          fontSize: '0.8rem',
          color: colors.green,
          fontWeight: 600,
          marginBottom: '2rem',
          fontFamily: 'Syne, sans-serif',
          animation: 'fadeSlideDown 0.6s ease forwards',
        }}>
          <span style={{
            background: colors.green,
            borderRadius: '100px',
            padding: '0.15rem 0.5rem',
            fontSize: '0.7rem',
            color: isDark ? '#060908' : '#fff',
            fontWeight: 700,
          }}>
            NEW
          </span>
          Financial brain for Nigerian businesses
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)',
          lineHeight: 1.08,
          letterSpacing: '-2px',
          marginBottom: '1.5rem',
          color: colors.textPrimary,
          animation: 'fadeSlideDown 0.6s ease 0.1s both',
        }}>
          Know your real profit.
          <br />
          <span style={{
            background: `linear-gradient(135deg, ${colors.green}, ${colors.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Get paid faster.
          </span>
          <br />
          Grow with clarity.
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          color: colors.textSecondary,
          maxWidth: '560px',
          margin: '0 auto 2.5rem',
          fontWeight: 400,
          lineHeight: 1.7,
          animation: 'fadeSlideDown 0.6s ease 0.2s both',
        }}>
          Ledga is the financial management platform built for Nigerian professionals
          and service businesses. Invoices, expenses, cash flow forecasting,
          and AI-powered insights — all in one place.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '2.5rem',
          animation: 'fadeSlideDown 0.6s ease 0.3s both',
        }}>
          <button
            onClick={() => navigate('/signup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: colors.green,
              color: '#fff',
              padding: '0.95rem 2rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              fontFamily: 'Syne, sans-serif',
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 4px 24px ${colors.green}40`,
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 8px 32px ${colors.green}50`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = `0 4px 24px ${colors.green}40`
            }}
          >
            Start Free — No Card Needed <ArrowRight size={18} />
          </button>

          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              color: colors.textPrimary,
              padding: '0.95rem 1.8rem',
              borderRadius: '12px',
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
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.color = colors.textPrimary
            }}
          >
            See How It Works
          </button>
        </div>

        {/* Animated mini dashboard */}
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          padding: '1.5rem',
          maxWidth: '520px',
          margin: '0 auto 2rem',
          boxShadow: isDark
            ? '0 40px 80px rgba(0,0,0,0.6)'
            : '0 40px 80px rgba(0,0,0,0.1)',
          animation: 'fadeSlideUp 0.8s ease 0.4s both',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Glow inside card */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle at 50% 50%, ${colors.green}08, transparent 60%)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: colors.textPrimary,
            }}>
              📊 This Month — Live Preview
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.68rem',
              color: colors.green,
              fontWeight: 600,
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: colors.green,
                animation: 'spi-pulse 2s infinite',
              }} />
              LIVE
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}>
            {mockStats.map((stat, i) => (
              <div key={i} style={{
                background: colors.bgCard2,
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                padding: '0.75rem',
                textAlign: 'left',
              }}>
                <div style={{
                  color: colors.textMuted,
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  marginBottom: '0.3rem',
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  color: i === 2 ? colors.warning : colors.textPrimary,
                  marginBottom: '0.2rem',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  color: stat.up ? colors.green : colors.warning,
                  fontWeight: 600,
                }}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          {/* Animated bar chart */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
              color: colors.textMuted,
              fontSize: '0.68rem',
              fontWeight: 600,
              marginBottom: '0.6rem',
              textAlign: 'left',
            }}>
              Revenue vs Expenses — 6 months
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              height: '60px',
            }}>
              {[
                { inc: 65, exp: 45 },
                { inc: 50, exp: 40 },
                { inc: 75, exp: 50 },
                { inc: 60, exp: 42 },
                { inc: 85, exp: 55 },
                { inc: 95, exp: 60 },
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
                    background: colors.green,
                    borderRadius: '3px 3px 0 0',
                    opacity: 0,
                    animation: `growBar 0.6s ease ${0.5 + i * 0.1}s forwards`,
                  }} />
                  <div style={{
                    flex: 1,
                    height: `${bar.exp}%`,
                    background: isDark
                      ? 'rgba(255,80,80,0.5)'
                      : 'rgba(204,34,0,0.4)',
                    borderRadius: '3px 3px 0 0',
                    opacity: 0,
                    animation: `growBar 0.6s ease ${0.6 + i * 0.1}s forwards`,
                  }} />
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '0.4rem',
              justifyContent: 'center',
            }}>
              {[
                { color: colors.green, label: 'Revenue' },
                { color: isDark ? 'rgba(255,80,80,0.5)' : 'rgba(204,34,0,0.4)', label: 'Expenses' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.62rem',
                  color: colors.textMuted,
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    background: item.color,
                  }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Runway bar */}
          <div style={{
            background: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.04)',
            border: `1px solid ${colors.borderGreen}`,
            borderRadius: '8px',
            padding: '0.6rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: '0.72rem',
              color: colors.textSecondary,
              fontWeight: 500,
            }}>
              💧 Business Runway
            </span>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '0.82rem',
              color: colors.green,
            }}>
              74 days safe
            </span>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          animation: 'fadeSlideDown 0.6s ease 0.5s both',
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

        {/* Waitlist form */}
        <div style={{
          marginTop: '2rem',
          animation: 'fadeSlideDown 0.6s ease 0.6s both',
        }}>
          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="email"
                placeholder="Enter your business email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  minWidth: '220px',
                  maxWidth: '300px',
                  padding: '0.8rem 1.1rem',
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bgInput,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.8rem 1.5rem',
                  background: 'transparent',
                  color: colors.green,
                  border: `1px solid ${colors.borderGreen}`,
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(0,197,102,0.1)'
                    : 'rgba(0,120,60,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Join Early Access
              </button>
            </form>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: colors.green,
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              background: isDark
                ? 'rgba(0,197,102,0.1)'
                : 'rgba(0,120,60,0.08)',
              padding: '0.8rem 1.5rem',
              borderRadius: '10px',
              border: `1px solid ${colors.borderGreen}`,
            }}>
              <CheckCircle size={18} /> You are in! We will reach out soon.
            </div>
          )}
          <p style={{
            color: colors.textMuted,
            fontSize: '0.75rem',
            marginTop: '0.75rem',
          }}>
            Free to start · No credit card · Nigerian-built
          </p>
        </div>
      </div>

      {/* ── Animated stats below fold ── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '1.5rem 5%',
        display: 'flex',
        justifyContent: 'center',
        gap: '3rem',
        flexWrap: 'wrap',
        borderTop: `1px solid ${colors.border}`,
        background: isDark
          ? 'rgba(6,9,8,0.8)'
          : 'rgba(248,246,241,0.8)',
        backdropFilter: 'blur(12px)',
      }}>
        {[
          { end: 39, suffix: 'M+', label: 'Nigerian SMEs need this' },
          { end: 0, prefix: '₦', suffix: '', label: 'Cost to get started' },
          { end: 90, suffix: ' days', label: 'Cash flow forecast' },
          { end: 1000, suffix: '', label: 'Max credit score' },
        ].map((item, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
              color: colors.green,
              letterSpacing: '-0.5px',
            }}>
              <CountUp
                end={item.end}
                prefix={item.prefix || ''}
                suffix={item.suffix}
              />
            </div>
            <div style={{
              color: colors.textMuted,
              fontSize: '0.78rem',
              marginTop: '0.2rem',
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          33% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          66% { transform: translateY(10px) translateX(-8px); opacity: 0.2; }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes growBar {
          from { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
          to { opacity: 1; transform: scaleY(1); transform-origin: bottom; }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes spi-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (min-width: 1024px) {
          .hero-card-left { display: block !important; }
          .hero-card-right { display: block !important; }
          .hero-card-bottom { display: flex !important; }
        }
      `}</style>
    </section>
  )
}