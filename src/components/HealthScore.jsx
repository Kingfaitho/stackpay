import { useEffect, useState } from 'react'

function HealthScore({ income, expenses, unpaidInvoices, totalClients }) {
  const [score, setScore] = useState(0)
  const [insights, setInsights] = useState([])
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    calculateScore()
  }, [income, expenses, unpaidInvoices, totalClients])

  useEffect(() => {
    if (score === 0) return
    let current = 0
    const increment = score / 40
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setAnimatedScore(score)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, 30)
    return () => clearInterval(timer)
  }, [score])

  const calculateScore = () => {
    let total = 0
    const tips = []

    // Profit margin check (30 points)
    if (income > 0) {
      const margin = ((income - expenses) / income) * 100
      if (margin >= 50) { total += 30; tips.push({ type: 'good', text: 'Excellent profit margin above 50%' }) }
      else if (margin >= 25) { total += 20; tips.push({ type: 'warn', text: 'Profit margin is fair — aim for 50%+' }) }
      else if (margin >= 0) { total += 10; tips.push({ type: 'bad', text: 'Low profit margin — review your expenses' }) }
      else { tips.push({ type: 'bad', text: 'You are spending more than you earn' }) }
    } else {
      tips.push({ type: 'bad', text: 'No paid invoices yet — start invoicing clients' })
    }

    // Unpaid invoices check (25 points)
    if (unpaidInvoices === 0) { total += 25; tips.push({ type: 'good', text: 'All invoices are paid — great cash flow!' }) }
    else if (unpaidInvoices <= 2) { total += 15; tips.push({ type: 'warn', text: `${unpaidInvoices} unpaid invoice(s) — follow up with clients` }) }
    else { total += 5; tips.push({ type: 'bad', text: `${unpaidInvoices} unpaid invoices — cash flow risk` }) }

    // Client diversity check (25 points)
    if (totalClients >= 5) { total += 25; tips.push({ type: 'good', text: 'Good client base — strong foundation' }) }
    else if (totalClients >= 2) { total += 15; tips.push({ type: 'warn', text: 'Grow your client list to reduce risk' }) }
    else { total += 5; tips.push({ type: 'bad', text: 'Add more clients — avoid single-client dependency' }) }

    // Expense control (20 points)
    if (income > 0 && expenses < income * 0.5) { total += 20; tips.push({ type: 'good', text: 'Expenses well controlled under 50% of income' }) }
    else if (income > 0 && expenses < income) { total += 10; tips.push({ type: 'warn', text: 'Expenses are high relative to income' }) }
    else if (expenses > 0) { total += 5 }

    setScore(Math.min(total, 100))
    setInsights(tips.slice(0, 3))
  }

  const getScoreColor = (s) => {
    if (s >= 75) return '#00C566'
    if (s >= 50) return '#f5a623'
    return '#ff6b6b'
  }

  const getScoreLabel = (s) => {
    if (s >= 75) return 'Healthy'
    if (s >= 50) return 'Fair'
    if (s >= 25) return 'Needs Work'
    return 'At Risk'
  }

  const color = getScoreColor(animatedScore)
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (animatedScore / 100) * circumference

  return (
    <div style={{
      background: '#141A16',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      padding: '1.5rem',
      marginBottom: '2rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.2rem',
      }}>
        <span style={{ fontSize: '1.1rem' }}>🤖</span>
        <h3 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '0.95rem',
          color: '#EDF2EF',
        }}>
          AI Business Health Score
        </h3>
        <span style={{
          marginLeft: 'auto',
          background: 'rgba(124,106,247,0.1)',
          border: '1px solid rgba(124,106,247,0.2)',
          color: '#7C6AF7',
          fontSize: '0.7rem',
          fontWeight: 700,
          padding: '0.2rem 0.5rem',
          borderRadius: '100px',
          fontFamily: 'Syne, sans-serif',
        }}>
          AI POWERED
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '1.5rem',
        alignItems: 'center',
      }}>
        {/* Circular score */}
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.8rem',
              color: color,
              lineHeight: 1,
            }}>
              {animatedScore}
            </div>
            <div style={{
              color: '#7A9485',
              fontSize: '0.7rem',
              fontWeight: 600,
              marginTop: '0.1rem',
            }}>
              / 100
            </div>
          </div>
        </div>

        {/* Insights */}
        <div>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            color: color,
            marginBottom: '0.75rem',
          }}>
            {getScoreLabel(animatedScore)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {insights.map((insight, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                fontSize: '0.82rem',
                color: insight.type === 'good' ? '#00C566'
                  : insight.type === 'warn' ? '#f5a623'
                  : '#ff8080',
                lineHeight: 1.4,
              }}>
                <span style={{ flexShrink: 0, marginTop: '1px' }}>
                  {insight.type === 'good' ? '✓' : insight.type === 'warn' ? '⚡️' : '✗'}
                </span>
                {insight.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HealthScore
