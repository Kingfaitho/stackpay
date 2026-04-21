import { useState, useEffect } from 'react'

const insights = [
  {
    icon: '🤖',
    title: 'AI Business Health Score',
    desc: 'StackPay AI analyzes your income, expenses and invoice patterns weekly to give your business a score out of 100 — with specific steps to improve.',
    tag: 'Coming Soon',
    color: '#00C566',
  },
  {
    icon: '📊',
    title: 'Smart Cash Flow Predictions',
    desc: 'Based on your history, our AI predicts your cash flow for the next 30 days so you never get caught off guard by a dry month.',
    tag: 'Coming Soon',
    color: '#7C6AF7',
  },
  {
    icon: '⚡️',
    title: 'Automated Invoice Reminders',
    desc: 'AI sends polite payment reminders to clients automatically on your behalf via WhatsApp or email — so you never have to chase money awkwardly.',
    tag: 'Coming Soon',
    color: '#f5a623',
  },
]

function AIInsights() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % insights.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  return (
    <section style={{
      padding: '100px 5%',
      background: 'linear-gradient(180deg, #060908 0%, #0D1410 50%, #060908 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative orb */}
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '-200px',
        transform: 'translateY(-50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(124,106,247,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '4rem',
          alignItems: 'center',
        }}>
          {/* Left — Text */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(124,106,247,0.1)',
              border: '1px solid rgba(124,106,247,0.25)',
              borderRadius: '100px',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              color: '#7C6AF7',
              fontWeight: 600,
              marginBottom: '1.5rem',
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.5px',
            }}>
              ✦ Powered by AI
            </div>

            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              letterSpacing: '-1px',
              lineHeight: 1.15,
              marginBottom: '1.2rem',
              color: '#EDF2EF',
            }}>
              Your business gets{' '}
              <span className="shimmer-text">smarter</span>{' '}
              every week
            </h2>

            <p style={{
              color: '#7A9485',
              fontSize: '1rem',
              lineHeight: 1.8,
              marginBottom: '2rem',
              maxWidth: '440px',
            }}>
              StackPay's AI studies your financial patterns and gives you
              personalized advice — like having a CFO in your pocket,
              at a fraction of the cost.
            </p>

            {/* Feature tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {insights.map((item, i) => (
                <div
                  key={i}
                  onClick={() => setActive(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1.2rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: active === i
                      ? 'rgba(0,197,102,0.08)'
                      : 'transparent',
                    border: active === i
                      ? '1px solid rgba(0,197,102,0.2)'
                      : '1px solid transparent',
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{
                    width: '4px',
                    height: '36px',
                    borderRadius: '2px',
                    background: active === i ? item.color : 'rgba(255,255,255,0.08)',
                    transition: 'background 0.3s',
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: active === i ? '#EDF2EF' : '#7A9485',
                      marginBottom: '0.15rem',
                      transition: 'color 0.3s',
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      color: '#4A6055',
                    }}>
                      {item.tag}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Active Card */}
          <div style={{
            background: '#111815',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '24px',
            padding: '2.5rem',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
          }}>
            {/* Top corner glow */}
            <div style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '200px',
              height: '200px',
              background: `radial-gradient(circle, ${insights[active].color}15 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <div style={{
              fontSize: '3rem',
              marginBottom: '1.5rem',
              animation: 'float 3s ease-in-out infinite',
              display: 'inline-block',
            }}>
              {insights[active].icon}
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: `${insights[active].color}15`,
              border: `1px solid ${insights[active].color}30`,
              borderRadius: '100px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.72rem',
              color: insights[active].color,
              fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.5px',
              marginBottom: '1rem',
              width: 'fit-content',
            }}>
              <span style={{
                width: '5px', height: '5px',
                borderRadius: '50%',
                background: insights[active].color,
                animation: 'pulse 2s infinite',
              }} />
              {insights[active].tag}
            </div>

            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.3rem',
              color: '#EDF2EF',
              marginBottom: '0.75rem',
              letterSpacing: '-0.5px',
            }}>
              {insights[active].title}
            </h3>

            <p style={{
              color: '#7A9485',
              fontSize: '0.92rem',
              lineHeight: 1.8,
            }}>
              {insights[active].desc}
            </p>

            {/* Progress dots */}
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              marginTop: '2rem',
            }}>
              {insights.map((_, i) => (
                <div key={i} style={{
                  width: active === i ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: active === i
                    ? insights[active].color
                    : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }} onClick={() => setActive(i)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AIInsights
