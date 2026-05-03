import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

function StackPayIntelligence({
  invoices,
  expenses,
  totalIncome,
  totalExpenses,
  unpaidInvoices,
  totalClients,
  businessName,
  profile,
}) {
  const { colors, isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('predictions')
  const [advice, setAdvice] = useState('')
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const [creditScore, setCreditScore] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    generatePredictions()
    generateAlerts()
    calculateCreditScore()
  }, [invoices, expenses, totalIncome, totalExpenses])

  // ─── Predictions ─────────────────────────────────────────────────────────
  const generatePredictions = () => {
    const preds = []

    const monthlyIncome = {}
    ;(invoices || [])
      .filter(i => i.status === 'paid')
      .forEach(inv => {
        const month = new Date(inv.created_at).toLocaleString('en-NG', {
          month: 'short', year: '2-digit',
        })
        monthlyIncome[month] = (monthlyIncome[month] || 0) + Number(inv.total)
      })

    const months = Object.values(monthlyIncome)
    if (months.length >= 2) {
      const last = months[months.length - 1]
      const prev = months[months.length - 2]
      if (prev > 0) {
        const change = ((last - prev) / prev) * 100
        if (change > 20) {
          preds.push({
            type: 'positive', icon: '📈',
            title: 'Revenue Growing Fast',
            body: `Income grew ${change.toFixed(0)}% last month. Consider reinvesting in marketing to sustain this.`,
            action: 'Review your best-selling services',
          })
        } else if (change < -20) {
          preds.push({
            type: 'warning', icon: '📉',
            title: 'Revenue Dropping',
            body: `Income fell ${Math.abs(change).toFixed(0)}% last month. This needs attention before it becomes a pattern.`,
            action: 'Follow up on unpaid invoices today',
          })
        }
      }
    }

    if (totalIncome > 0) {
      const ratio = totalExpenses / totalIncome
      if (ratio > 0.7) {
        preds.push({
          type: 'danger', icon: '⚠️',
          title: 'Expenses Eating Your Profit',
          body: `${(ratio * 100).toFixed(0)}% of income goes to expenses. Healthy businesses keep this below 60%.`,
          action: 'Audit your top 3 expense categories',
        })
      }
    }

    if (unpaidInvoices >= 3) {
      const unpaidValue = (invoices || [])
        .filter(i => i.status === 'unpaid')
        .reduce((sum, i) => sum + Number(i.total), 0)
      preds.push({
        type: 'warning', icon: '🔔',
        title: 'Cash Stuck in Unpaid Invoices',
        body: `${unpaidInvoices} unpaid invoices worth ₦${unpaidValue.toLocaleString()}. This money should be in your account.`,
        action: 'Send WhatsApp reminders today',
      })
    }

    const clientCounts = {}
    ;(invoices || []).forEach(inv => {
      if (inv.client_id) {
        clientCounts[inv.client_id] =
          (clientCounts[inv.client_id] || 0) + Number(inv.total)
      }
    })
    const totalVal = Object.values(clientCounts).reduce((a, b) => a + b, 0)
    const topVal = Math.max(...Object.values(clientCounts), 0)
    if (totalVal > 0 && topVal / totalVal > 0.6) {
      preds.push({
        type: 'warning', icon: '⚡',
        title: 'Over-Reliant on One Client',
        body: 'One client makes up over 60% of your revenue. If they leave, your business takes a major hit.',
        action: 'Actively acquire 2 new clients this month',
      })
    }

    if (preds.length === 0 && totalIncome > 0) {
      preds.push({
        type: 'positive', icon: '🌟',
        title: 'Business is Healthy',
        body: 'Your financial metrics look solid. Keep invoicing consistently and tracking every expense.',
        action: 'Set a revenue goal for next month',
      })
    }

    if (preds.length === 0) {
      preds.push({
        type: 'info', icon: '💡',
        title: 'Start Tracking to See Predictions',
        body: 'Add your first invoice and expense. Intelligence will generate predictions as soon as it has data.',
        action: 'Create your first invoice',
      })
    }

    setPredictions(preds)
  }

  // ─── Alerts ───────────────────────────────────────────────────────────────
  const generateAlerts = () => {
    const newAlerts = []
    const today = new Date()

    const overdueInvoices = (invoices || []).filter(inv => {
      if (inv.status !== 'unpaid' || !inv.due_date) return false
      return new Date(inv.due_date) < today
    })
    if (overdueInvoices.length > 0) {
      const overdueTotal = overdueInvoices.reduce((sum, i) => sum + Number(i.total), 0)
      newAlerts.push({
        level: 'high', icon: '🚨',
        text: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} — ₦${overdueTotal.toLocaleString()} past due`,
      })
    }

    const dueSoon = (invoices || []).filter(inv => {
      if (inv.status !== 'unpaid' || !inv.due_date) return false
      const diff = (new Date(inv.due_date) - today) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 3
    })
    if (dueSoon.length > 0) {
      newAlerts.push({
        level: 'medium', icon: '⏰',
        text: `${dueSoon.length} invoice${dueSoon.length > 1 ? 's' : ''} due within 3 days`,
      })
    }

    const thisMonth = today.getMonth()
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const thisMonthExp = (expenses || [])
      .filter(e => new Date(e.date || e.created_at).getMonth() === thisMonth)
      .reduce((sum, e) => sum + Number(e.amount), 0)
    const lastMonthExp = (expenses || [])
      .filter(e => new Date(e.date || e.created_at).getMonth() === lastMonth)
      .reduce((sum, e) => sum + Number(e.amount), 0)
    if (lastMonthExp > 0 && thisMonthExp > lastMonthExp * 1.3) {
      newAlerts.push({
        level: 'medium', icon: '💸',
        text: `Expenses up ${(((thisMonthExp - lastMonthExp) / lastMonthExp) * 100).toFixed(0)}% vs last month`,
      })
    }

    setAlerts(newAlerts)
  }

  // ─── Credit Score ─────────────────────────────────────────────────────────
  const calculateCreditScore = () => {
    let score = 300
    const factors = []

    const paidCount = (invoices || []).filter(i => i.status === 'paid').length
    const totalCount = (invoices || []).length
    if (totalCount > 0) {
      const rate = paidCount / totalCount
      const pts = Math.round(rate * 200)
      score += pts
      factors.push({
        label: 'Payment Collection Rate',
        score: pts, max: 200,
        status: rate > 0.8 ? 'good' : rate > 0.5 ? 'fair' : 'poor',
      })
    } else {
      factors.push({ label: 'Payment Collection Rate', score: 0, max: 200, status: 'none' })
    }

    const monthlyIncome = {}
    ;(invoices || []).filter(i => i.status === 'paid').forEach(inv => {
      const m = new Date(inv.created_at).getMonth()
      monthlyIncome[m] = (monthlyIncome[m] || 0) + 1
    })
    const activeMonths = Object.keys(monthlyIncome).length
    const consistencyPts = Math.min(activeMonths * 25, 150)
    score += consistencyPts
    factors.push({
      label: 'Revenue Consistency',
      score: consistencyPts, max: 150,
      status: activeMonths >= 4 ? 'good' : activeMonths >= 2 ? 'fair' : 'poor',
    })

    if (totalIncome > 0) {
      const margin = (totalIncome - totalExpenses) / totalIncome
      const marginPts = Math.min(Math.round(Math.max(margin, 0) * 150), 150)
      score += marginPts
      factors.push({
        label: 'Profit Margin',
        score: marginPts, max: 150,
        status: margin > 0.4 ? 'good' : margin > 0.15 ? 'fair' : 'poor',
      })
    } else {
      factors.push({ label: 'Profit Margin', score: 0, max: 150, status: 'none' })
    }

    const clientPts = Math.min(totalClients * 20, 100)
    score += clientPts
    factors.push({
      label: 'Client Diversity',
      score: clientPts, max: 100,
      status: totalClients >= 5 ? 'good' : totalClients >= 2 ? 'fair' : 'poor',
    })

    const activityPts = Math.min(totalCount * 10, 100)
    score += activityPts
    factors.push({
      label: 'Business Activity',
      score: activityPts, max: 100,
      status: totalCount >= 10 ? 'good' : totalCount >= 5 ? 'fair' : 'poor',
    })

    const finalScore = Math.min(score, 1000)
    const getGrade = s => {
      if (s >= 800) return { grade: 'Excellent', color: '#00C566', loan: '₦2,000,000' }
      if (s >= 650) return { grade: 'Good', color: '#00A855', loan: '₦1,000,000' }
      if (s >= 500) return { grade: 'Fair', color: '#f5a623', loan: '₦500,000' }
      if (s >= 350) return { grade: 'Building', color: '#7C6AF7', loan: '₦150,000' }
      return { grade: 'Starting', color: '#8A9E92', loan: '₦50,000' }
    }

    setCreditScore({ score: finalScore, ...getGrade(finalScore), factors })
  }

  // ─── AI Advisor — OpenRouter ──────────────────────────────────────────────
  const getAIAdvice = async () => {
    setLoadingAdvice(true)
    setAdvice('')

    const overdueCount = (invoices || []).filter(inv => {
      if (inv.status !== 'unpaid' || !inv.due_date) return false
      return new Date(inv.due_date) < new Date()
    }).length

    const prompt = `You are a sharp financial advisor for Nigerian small businesses. Be direct, specific, use Nigerian business context.

Business: ${businessName || 'Nigerian SME'}
Total Income: NGN ${totalIncome.toLocaleString()}
Total Expenses: NGN ${totalExpenses.toLocaleString()}
Net Profit: NGN ${(totalIncome - totalExpenses).toLocaleString()}
Profit Margin: ${totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%
Unpaid Invoices: ${unpaidInvoices}
Overdue Invoices: ${overdueCount}
Total Clients: ${totalClients}
Credit Score: ${creditScore?.score || 'Calculating'}/1000

Give 3 specific numbered actions this business should take THIS WEEK.
Each action: 1-2 sentences max. Reference their actual numbers.
End with one motivational sentence.
Total under 120 words.`

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY

      if (!apiKey) {
        setAdvice('OpenRouter API key not configured. Add VITE_OPENROUTER_API_KEY to your environment variables.')
        setLoadingAdvice(false)
        return
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'StackPay Intelligence',
        },
        body: JSON.stringify({
          model: 'openrouter/auto',

          max_tokens: 300,
          messages: [
            {
              role: 'system',
              content: 'You are a concise, direct financial advisor for Nigerian SMEs. No fluff. No markdown. Plain text only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('OpenRouter error:', response.status, errText)
        setAdvice(`AI request failed (${response.status}). Please check your OpenRouter API key in Vercel environment variables.`)
        setLoadingAdvice(false)
        return
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content
      setAdvice(text || 'No response from AI. Please try again.')
    } catch (err) {
      console.error('AI Advisor error:', err)
      setAdvice('Network error reaching AI service. Check your internet connection and try again.')
    }

    setLoadingAdvice(false)
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  const typeColors = {
    positive: {
      bg: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.05)',
      border: isDark ? 'rgba(0,197,102,0.2)' : 'rgba(0,120,60,0.15)',
      text: colors.green,
    },
    warning: {
      bg: isDark ? 'rgba(245,166,35,0.06)' : 'rgba(184,122,0,0.05)',
      border: isDark ? 'rgba(245,166,35,0.2)' : 'rgba(184,122,0,0.15)',
      text: colors.warning,
    },
    danger: {
      bg: isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.05)',
      border: isDark ? 'rgba(255,80,80,0.2)' : 'rgba(204,34,0,0.15)',
      text: colors.danger,
    },
    info: {
      bg: isDark ? 'rgba(124,106,247,0.06)' : 'rgba(91,78,199,0.05)',
      border: isDark ? 'rgba(124,106,247,0.2)' : 'rgba(91,78,199,0.15)',
      text: colors.purple,
    },
  }

  const tabs = [
    { id: 'predictions', label: '🔮 Predictions', count: predictions.length },
    { id: 'alerts', label: '🚨 Alerts', count: alerts.length },
    { id: 'credit', label: '💳 Credit Score' },
    { id: 'advisor', label: '🤖 AI Advisor' },
  ]

  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '2rem',
      boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
    }}>

      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: `1px solid ${colors.border}`,
        background: isDark
          ? 'linear-gradient(135deg, rgba(0,197,102,0.04), rgba(124,106,247,0.04))'
          : 'linear-gradient(135deg, rgba(0,120,60,0.03), rgba(91,78,199,0.03))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: isDark
              ? 'rgba(0,197,102,0.15)'
              : 'rgba(0,120,60,0.1)',
            border: `1px solid ${colors.borderGreen}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
          }}>
            ✦
          </div>
          <div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: colors.textPrimary,
              letterSpacing: '-0.3px',
            }}>
              StackPay Intelligence
            </div>
            <div style={{ color: colors.textMuted, fontSize: '0.72rem', fontWeight: 500 }}>
              AI-powered insights for {businessName || 'your business'}
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)',
          border: `1px solid ${colors.borderGreen}`,
          borderRadius: '100px',
          padding: '0.25rem 0.75rem',
          fontSize: '0.68rem',
          color: colors.green,
          fontWeight: 700,
          fontFamily: 'Syne, sans-serif',
        }}>
          <span style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: colors.green,
            animation: 'spi-pulse 2s infinite',
          }} />
          LIVE DATA
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${colors.border}`,
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.85rem 1.1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id
                ? `2px solid ${colors.green}`
                : '2px solid transparent',
              color: activeTab === tab.id ? colors.green : colors.textMuted,
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              flexShrink: 0,
            }}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span style={{
                background: activeTab === tab.id
                  ? isDark ? 'rgba(0,197,102,0.15)' : 'rgba(0,120,60,0.1)'
                  : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                color: activeTab === tab.id ? colors.green : colors.textMuted,
                borderRadius: '100px',
                padding: '0.1rem 0.45rem',
                fontSize: '0.65rem',
                fontWeight: 700,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1.25rem 1.5rem' }}>

        {/* PREDICTIONS */}
        {activeTab === 'predictions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {predictions.map((pred, i) => {
              const c = typeColors[pred.type] || typeColors.info
              return (
                <div key={i} style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: '12px',
                  padding: '1rem 1.2rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{pred.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        color: colors.textPrimary,
                        marginBottom: '0.3rem',
                      }}>
                        {pred.title}
                      </div>
                      <div style={{
                        color: colors.textSecondary,
                        fontSize: '0.82rem',
                        lineHeight: 1.6,
                        marginBottom: '0.5rem',
                      }}>
                        {pred.body}
                      </div>
                      <div style={{
                        color: c.text,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'Syne, sans-serif',
                      }}>
                        → {pred.action}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ALERTS */}
        {activeTab === 'alerts' && (
          <div>
            {alerts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: colors.textMuted,
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p style={{ fontSize: '0.9rem' }}>No active alerts. Business is running clean!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {alerts.map((alert, i) => {
                  const alertColors = {
                    high: {
                      bg: isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.05)',
                      border: isDark ? 'rgba(255,80,80,0.2)' : 'rgba(204,34,0,0.15)',
                    },
                    medium: {
                      bg: isDark ? 'rgba(245,166,35,0.06)' : 'rgba(184,122,0,0.05)',
                      border: isDark ? 'rgba(245,166,35,0.2)' : 'rgba(184,122,0,0.15)',
                    },
                  }
                  const ac = alertColors[alert.level] || alertColors.medium
                  return (
                    <div key={i} style={{
                      background: ac.bg,
                      border: `1px solid ${ac.border}`,
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{alert.icon}</span>
                      <span style={{
                        color: colors.textPrimary,
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                      }}>
                        {alert.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* CREDIT SCORE */}
        {activeTab === 'credit' && creditScore && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
            }}>
              {/* Circular gauge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="55" cy="55" r="48" fill="none"
                    stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}
                    strokeWidth="8"
                  />
                  <circle cx="55" cy="55" r="48" fill="none"
                    stroke={creditScore.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - creditScore.score / 1000)}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    color: creditScore.color,
                    lineHeight: 1,
                  }}>
                    {creditScore.score}
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: '0.62rem', fontWeight: 600 }}>
                    / 1000
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  color: creditScore.color,
                  marginBottom: '0.25rem',
                }}>
                  {creditScore.grade}
                </div>
                <div style={{
                  color: colors.textSecondary,
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  marginBottom: '0.75rem',
                }}>
                  Based on your invoicing history, payment collection, and business activity
                </div>
                <div style={{
                  background: isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)',
                  border: `1px solid ${colors.borderGreen}`,
                  borderRadius: '10px',
                  padding: '0.6rem 0.85rem',
                  display: 'inline-block',
                }}>
                  <div style={{ color: colors.textMuted, fontSize: '0.65rem', fontWeight: 600, marginBottom: '0.1rem' }}>
                    ESTIMATED LOAN ELIGIBILITY
                  </div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: colors.green,
                  }}>
                    Up to {creditScore.loan}
                  </div>
                </div>
              </div>
            </div>

            {/* Factor bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
              {creditScore.factors.map((factor, i) => {
                const pct = (factor.score / factor.max) * 100
                const barColor = factor.status === 'good'
                  ? colors.green
                  : factor.status === 'fair'
                  ? colors.warning
                  : factor.status === 'poor'
                  ? colors.danger
                  : colors.textMuted
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ color: colors.textSecondary, fontSize: '0.8rem' }}>
                        {factor.label}
                      </span>
                      <span style={{ color: barColor, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
                        {factor.score}/{factor.max}
                      </span>
                    </div>
                    <div style={{
                      height: '5px',
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: barColor,
                        borderRadius: '3px',
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Coming soon */}
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(0,197,102,0.06), rgba(124,106,247,0.06))'
                : 'linear-gradient(135deg, rgba(0,120,60,0.04), rgba(91,78,199,0.04))',
              border: `1px solid ${colors.borderGreen}`,
              borderRadius: '12px',
              padding: '1rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>🏦</span>
              <div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: colors.textPrimary,
                  marginBottom: '0.2rem',
                }}>
                  Business Loan Matching — Coming Soon
                </div>
                <div style={{ color: colors.textSecondary, fontSize: '0.78rem', lineHeight: 1.5 }}>
                  We're partnering with Nigerian microfinance banks.
                  Your StackPay score will unlock pre-approved loans without going to a bank.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI ADVISOR */}
        {activeTab === 'advisor' && (
          <div>
            {!advice && !loadingAdvice && (
              <div style={{
                background: isDark ? 'rgba(124,106,247,0.04)' : 'rgba(91,78,199,0.03)',
                border: `1px solid ${isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.12)'}`,
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
              }}>
                <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>🤖</div>
                <div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    color: colors.textPrimary,
                    marginBottom: '0.4rem',
                    fontSize: '0.92rem',
                  }}>
                    Your Personal Business Advisor
                  </div>
                  <p style={{ color: colors.textSecondary, fontSize: '0.85rem', lineHeight: 1.7 }}>
                    AI will analyze your real income, expenses, unpaid invoices, and credit score
                    to give you 3 specific actions to take this week.
                  </p>
                </div>
              </div>
            )}

            {loadingAdvice && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  color: colors.purple,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}>
                  <span style={{
                    width: '14px', height: '14px',
                    borderRadius: '50%',
                    border: `2px solid ${colors.purple}40`,
                    borderTopColor: colors.purple,
                    animation: 'spi-spin 0.8s linear infinite',
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  Analyzing your business data...
                </div>
                {[100, 80, 90, 65].map((w, i) => (
                  <div key={i} style={{
                    height: '10px',
                    borderRadius: '5px',
                    background: isDark ? 'rgba(124,106,247,0.08)' : 'rgba(91,78,199,0.06)',
                    width: `${w}%`,
                    marginBottom: '0.5rem',
                    animation: 'spi-pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`,
                  }} />
                ))}
              </div>
            )}

            {advice && !loadingAdvice && (
              <div style={{
                background: isDark ? 'rgba(124,106,247,0.04)' : 'rgba(91,78,199,0.03)',
                border: `1px solid ${isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.12)'}`,
                borderRadius: '12px',
                padding: '1.2rem',
                marginBottom: '1rem',
              }}>
                <p style={{
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}>
                  {advice}
                </p>
                <div style={{ marginTop: '0.75rem', color: colors.textMuted, fontSize: '0.68rem' }}>
                  ✦ Generated by AI using your live business data
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={getAIAdvice}
              disabled={loadingAdvice}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '10px',
                background: loadingAdvice
                  ? isDark ? 'rgba(124,106,247,0.08)' : 'rgba(91,78,199,0.06)'
                  : isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.08)',
                border: `1px solid ${isDark ? 'rgba(124,106,247,0.3)' : 'rgba(91,78,199,0.2)'}`,
                color: colors.purple,
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: loadingAdvice ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!loadingAdvice) {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(124,106,247,0.22)'
                    : 'rgba(91,78,199,0.12)'
                }
              }}
              onMouseLeave={e => {
                if (!loadingAdvice) {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(124,106,247,0.15)'
                    : 'rgba(91,78,199,0.08)'
                }
              }}
            >
              {loadingAdvice ? (
                <>
                  <span style={{
                    width: '14px', height: '14px',
                    borderRadius: '50%',
                    border: `2px solid ${colors.purple}40`,
                    borderTopColor: colors.purple,
                    animation: 'spi-spin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  Analyzing...
                </>
              ) : (
                <>{advice ? '↻ Get New Advice' : '✦ Analyze My Business Now'}</>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spi-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spi-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default StackPayIntelligence