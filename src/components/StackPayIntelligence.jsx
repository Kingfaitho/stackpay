import { useState, useEffect } from 'react'

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

  // ─── Predictions Engine ───────────────────────────────────────────
  const generatePredictions = () => {
    const preds = []

    // Monthly income trend
    const monthlyIncome = {}
    invoices
      ?.filter(i => i.status === 'paid')
      .forEach(inv => {
        const month = new Date(inv.created_at).toLocaleString('en-NG', {
          month: 'short', year: '2-digit'
        })
        monthlyIncome[month] = (monthlyIncome[month] || 0) + Number(inv.total)
      })

    const months = Object.values(monthlyIncome)
    if (months.length >= 2) {
      const last = months[months.length - 1]
      const prev = months[months.length - 2]
      const change = ((last - prev) / prev) * 100

      if (change > 20) {
        preds.push({
          type: 'positive',
          icon: '📈',
          title: 'Revenue Growing Fast',
          body: `Your income grew ${change.toFixed(0)}% last month. Consider reinvesting in stock or marketing to keep this momentum.`,
          action: 'Review your best-selling services',
        })
      } else if (change < -20) {
        preds.push({
          type: 'warning',
          icon: '📉',
          title: 'Revenue Dropping',
          body: `Income fell ${Math.abs(change).toFixed(0)}% last month. This needs attention before it becomes a pattern.`,
          action: 'Follow up on unpaid invoices',
        })
      }
    }

    // Expense ratio prediction
    if (totalIncome > 0) {
      const ratio = totalExpenses / totalIncome
      if (ratio > 0.7) {
        preds.push({
          type: 'danger',
          icon: '⚠️',
          title: 'Expenses Eating Your Profit',
          body: `${(ratio * 100).toFixed(0)}% of your income is going to expenses. Healthy businesses keep this below 60%.`,
          action: 'Audit your top 3 expense categories',
        })
      }
    }

    // Unpaid invoice risk
    if (unpaidInvoices >= 3) {
      const unpaidValue = invoices
        ?.filter(i => i.status === 'unpaid')
        .reduce((sum, i) => sum + Number(i.total), 0) || 0

      preds.push({
        type: 'warning',
        icon: '🔔',
        title: 'Cash Stuck in Unpaid Invoices',
        body: `You have ${unpaidInvoices} unpaid invoices worth ₦${unpaidValue.toLocaleString()}. This money should be in your account.`,
        action: 'Send WhatsApp reminders today',
      })
    }

    // Client concentration risk
    const clientInvoiceCounts = {}
    invoices?.forEach(inv => {
      if (inv.client_id) {
        clientInvoiceCounts[inv.client_id] =
          (clientInvoiceCounts[inv.client_id] || 0) + Number(inv.total)
      }
    })

    const totalValue = Object.values(clientInvoiceCounts).reduce(
      (a, b) => a + b, 0
    )
    const topClientValue = Math.max(...Object.values(clientInvoiceCounts), 0)

    if (totalValue > 0 && topClientValue / totalValue > 0.6) {
      preds.push({
        type: 'warning',
        icon: '⚡',
        title: 'Over-Reliant on One Client',
        body: `One client makes up over 60% of your revenue. If they leave, your business takes a major hit.`,
        action: 'Actively acquire 2 new clients this month',
      })
    }

    // No prediction needed if doing well
    if (preds.length === 0 && totalIncome > 0) {
      preds.push({
        type: 'positive',
        icon: '🌟',
        title: 'Business is Healthy',
        body: `Your financial metrics look solid. Keep invoicing consistently and tracking every expense to maintain this momentum.`,
        action: 'Set a revenue goal for next month',
      })
    }

    if (preds.length === 0) {
      preds.push({
        type: 'info',
        icon: '💡',
        title: 'Start Tracking to See Predictions',
        body: `Add your first invoice and expense. StackPay Intelligence will start generating predictions as soon as it has data.`,
        action: 'Create your first invoice',
      })
    }

    setPredictions(preds)
  }

  // ─── Smart Alerts ─────────────────────────────────────────────────
  const generateAlerts = () => {
    const newAlerts = []

    // Overdue invoices
    const today = new Date()
    const overdueInvoices = invoices?.filter(inv => {
      if (inv.status !== 'unpaid' || !inv.due_date) return false
      return new Date(inv.due_date) < today
    }) || []

    if (overdueInvoices.length > 0) {
      const overdueTotal = overdueInvoices.reduce(
        (sum, i) => sum + Number(i.total), 0
      )
      newAlerts.push({
        level: 'high',
        icon: '🚨',
        text: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} — ₦${overdueTotal.toLocaleString()} past due date`,
      })
    }

    // Due soon (next 3 days)
    const dueSoon = invoices?.filter(inv => {
      if (inv.status !== 'unpaid' || !inv.due_date) return false
      const dueDate = new Date(inv.due_date)
      const diffDays = (dueDate - today) / (1000 * 60 * 60 * 24)
      return diffDays >= 0 && diffDays <= 3
    }) || []

    if (dueSoon.length > 0) {
      newAlerts.push({
        level: 'medium',
        icon: '⏰',
        text: `${dueSoon.length} invoice${dueSoon.length > 1 ? 's' : ''} due within 3 days`,
      })
    }

    // High expense month
    const thisMonth = new Date().getMonth()
    const thisMonthExpenses = expenses?.filter(exp =>
      new Date(exp.date).getMonth() === thisMonth
    ).reduce((sum, e) => sum + Number(e.amount), 0) || 0

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const lastMonthExpenses = expenses?.filter(exp =>
      new Date(exp.date).getMonth() === lastMonth
    ).reduce((sum, e) => sum + Number(e.amount), 0) || 0

    if (lastMonthExpenses > 0 && thisMonthExpenses > lastMonthExpenses * 1.3) {
      newAlerts.push({
        level: 'medium',
        icon: '💸',
        text: `Expenses up ${(((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100).toFixed(0)}% compared to last month`,
      })
    }

    setAlerts(newAlerts)
  }

  // ─── Business Credit Score ─────────────────────────────────────────
  const calculateCreditScore = () => {
    let score = 300
    const factors = []

    // Payment reliability (max +200)
    const paidCount = invoices?.filter(i => i.status === 'paid').length || 0
    const totalCount = invoices?.length || 0
    if (totalCount > 0) {
      const paymentRate = paidCount / totalCount
      const paymentPoints = Math.round(paymentRate * 200)
      score += paymentPoints
      factors.push({
        label: 'Payment Collection Rate',
        score: paymentPoints,
        max: 200,
        status: paymentRate > 0.8 ? 'good'
          : paymentRate > 0.5 ? 'fair'
          : 'poor',
      })
    } else {
      factors.push({
        label: 'Payment Collection Rate',
        score: 0,
        max: 200,
        status: 'none',
      })
    }

    // Revenue consistency (max +150)
    const monthlyIncome = {}
    invoices?.filter(i => i.status === 'paid').forEach(inv => {
      const month = new Date(inv.created_at).getMonth()
      monthlyIncome[month] = (monthlyIncome[month] || 0) + 1
    })
    const activeMonths = Object.keys(monthlyIncome).length
    const consistencyPoints = Math.min(activeMonths * 25, 150)
    score += consistencyPoints
    factors.push({
      label: 'Revenue Consistency',
      score: consistencyPoints,
      max: 150,
      status: activeMonths >= 4 ? 'good'
        : activeMonths >= 2 ? 'fair'
        : 'poor',
    })

    // Profit margin (max +150)
    if (totalIncome > 0) {
      const margin = (totalIncome - totalExpenses) / totalIncome
      const marginPoints = Math.round(Math.max(margin, 0) * 150)
      score += Math.min(marginPoints, 150)
      factors.push({
        label: 'Profit Margin',
        score: Math.min(marginPoints, 150),
        max: 150,
        status: margin > 0.4 ? 'good'
          : margin > 0.15 ? 'fair'
          : 'poor',
      })
    } else {
      factors.push({
        label: 'Profit Margin',
        score: 0,
        max: 150,
        status: 'none',
      })
    }

    // Client base (max +100)
    const clientPoints = Math.min(totalClients * 20, 100)
    score += clientPoints
    factors.push({
      label: 'Client Diversity',
      score: clientPoints,
      max: 100,
      status: totalClients >= 5 ? 'good'
        : totalClients >= 2 ? 'fair'
        : 'poor',
    })

    // Business activity (max +100)
    const activityPoints = Math.min(totalCount * 10, 100)
    score += activityPoints
    factors.push({
      label: 'Business Activity',
      score: activityPoints,
      max: 100,
      status: totalCount >= 10 ? 'good'
        : totalCount >= 5 ? 'fair'
        : 'poor',
    })

    const finalScore = Math.min(score, 1000)

    const getGrade = (s) => {
      if (s >= 800) return { grade: 'Excellent', color: '#00ff88', loan: '₦2,000,000' }
      if (s >= 650) return { grade: 'Good', color: '#00C566', loan: '₦1,000,000' }
      if (s >= 500) return { grade: 'Fair', color: '#f5a623', loan: '₦500,000' }
      if (s >= 350) return { grade: 'Building', color: '#7C6AF7', loan: '₦150,000' }
      return { grade: 'Starting', color: '#8A9E92', loan: '₦50,000' }
    }

    setCreditScore({
      score: finalScore,
      ...getGrade(finalScore),
      factors,
    })
  }

  // ─── AI Advisor ───────────────────────────────────────────────────
  const getAIAdvice = async () => {
    setLoadingAdvice(true)
    setAdvice('')

    const overdueCount = invoices?.filter(inv => {
      if (inv.status !== 'unpaid' || !inv.due_date) return false
      return new Date(inv.due_date) < new Date()
    }).length || 0

    const prompt = `You are a sharp financial advisor for Nigerian small businesses. 
Be direct, specific, and use Nigerian business context.

Business: ${businessName || 'Nigerian SME'}
Total Income: ₦${totalIncome.toLocaleString()}
Total Expenses: ₦${totalExpenses.toLocaleString()}
Net Profit: ₦${(totalIncome - totalExpenses).toLocaleString()}
Profit Margin: ${totalIncome > 0
      ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)
      : 0}%
Unpaid Invoices: ${unpaidInvoices}
Overdue Invoices: ${overdueCount}
Total Clients: ${totalClients}
Business Credit Score: ${creditScore?.score || 'Not yet calculated'}/1000

Give 3 specific, numbered actions this business should take THIS WEEK.
Each action should be 1-2 sentences max.
Reference specific numbers from their data.
End with one motivational sentence.
Keep total response under 120 words.`

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-3-mini',
          max_tokens: 300,
          messages: [
            {
              role: 'system',
              content: 'You are a concise, direct financial advisor for Nigerian SMEs. No fluff.',
            },
            { role: 'user', content: prompt },
          ],
        }),
      })

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content
      setAdvice(text || 'Unable to generate advice right now.')
    } catch {
      setAdvice('AI advisor is temporarily unavailable. Please try again.')
    } finally {
      setLoadingAdvice(false)
    }
  }

  // ─── UI Helpers ───────────────────────────────────────────────────
  const typeColors = {
    positive: { bg: 'rgba(0,197,102,0.06)', border: 'rgba(0,197,102,0.2)', text: '#00C566' },
    warning: { bg: 'rgba(245,166,35,0.06)', border: 'rgba(245,166,35,0.2)', text: '#f5a623' },
    danger: { bg: 'rgba(255,80,80,0.06)', border: 'rgba(255,80,80,0.2)', text: '#ff8080' },
    info: { bg: 'rgba(124,106,247,0.06)', border: 'rgba(124,106,247,0.2)', text: '#7C6AF7' },
  }

  const tabs = [
    { id: 'predictions', label: '🔮 Predictions', count: predictions.length },
    { id: 'alerts', label: '🚨 Alerts', count: alerts.length },
    { id: 'credit', label: '💳 Credit Score', count: null },
    { id: 'advisor', label: '🤖 AI Advisor', count: null },
  ]

  return (
    <div style={{
      background: '#111815',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '2rem',
    }}>

      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(135deg, rgba(0,197,102,0.04) 0%, rgba(124,106,247,0.04) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0,197,102,0.2), rgba(124,106,247,0.2))',
            border: '1px solid rgba(0,197,102,0.2)',
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
              color: '#EDF2EF',
              letterSpacing: '-0.3px',
            }}>
              StackPay Intelligence
            </div>
            <div style={{ color: '#4A6055', fontSize: '0.72rem', fontWeight: 500 }}>
              AI-powered insights for {businessName || 'your business'}
            </div>
          </div>
        </div>

        {/* Live badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(0,197,102,0.08)',
          border: '1px solid rgba(0,197,102,0.15)',
          borderRadius: '100px',
          padding: '0.25rem 0.75rem',
          fontSize: '0.72rem',
          color: '#00C566',
          fontWeight: 700,
          fontFamily: 'Syne, sans-serif',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00C566',
            animation: 'pulse 2s infinite',
          }} />
          LIVE DATA
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
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
                ? '2px solid #00C566'
                : '2px solid transparent',
              color: activeTab === tab.id ? '#00C566' : '#7A9485',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              fontSize: '0.8rem',
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
            {tab.count !== null && tab.count > 0 && (
              <span style={{
                background: activeTab === tab.id
                  ? 'rgba(0,197,102,0.15)'
                  : 'rgba(255,255,255,0.07)',
                color: activeTab === tab.id ? '#00C566' : '#7A9485',
                borderRadius: '100px',
                padding: '0.1rem 0.45rem',
                fontSize: '0.68rem',
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

        {/* ── PREDICTIONS TAB ── */}
        {activeTab === 'predictions' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            {predictions.map((pred, i) => {
              const colors = typeColors[pred.type] || typeColors.info
              return (
                <div key={i} style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '1rem 1.2rem',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>
                      {pred.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        color: '#EDF2EF',
                        marginBottom: '0.3rem',
                      }}>
                        {pred.title}
                      </div>
                      <div style={{
                        color: '#7A9485',
                        fontSize: '0.82rem',
                        lineHeight: 1.6,
                        marginBottom: '0.5rem',
                      }}>
                        {pred.body}
                      </div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: colors.text,
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

        {/* ── ALERTS TAB ── */}
        {activeTab === 'alerts' && (
          <div>
            {alerts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#7A9485',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p style={{ fontSize: '0.9rem' }}>
                  No active alerts. Your business is running clean!
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}>
                {alerts.map((alert, i) => {
                  const alertColors = {
                    high: { bg: 'rgba(255,80,80,0.06)', border: 'rgba(255,80,80,0.2)', dot: '#ff8080' },
                    medium: { bg: 'rgba(245,166,35,0.06)', border: 'rgba(245,166,35,0.2)', dot: '#f5a623' },
                    low: { bg: 'rgba(0,197,102,0.06)', border: 'rgba(0,197,102,0.2)', dot: '#00C566' },
                  }
                  const c = alertColors[alert.level]
                  return (
                    <div key={i} style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                        {alert.icon}
                      </span>
                      <span style={{
                        color: '#EDF2EF',
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

        {/* ── CREDIT SCORE TAB ── */}
        {activeTab === 'credit' && creditScore && (
          <div>
            {/* Score Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
            }}>
              {/* Circular Score */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg
                  width="110"
                  height="110"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <circle
                    cx="55" cy="55" r="48"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="55" cy="55" r="48"
                    fill="none"
                    stroke={creditScore.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={
                      2 * Math.PI * 48 * (1 - creditScore.score / 1000)
                    }
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
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
                    fontSize: '1.6rem',
                    color: creditScore.color,
                    lineHeight: 1,
                  }}>
                    {creditScore.score}
                  </div>
                  <div style={{
                    color: '#7A9485',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                  }}>
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
                  color: '#7A9485',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  marginBottom: '0.75rem',
                }}>
                  Based on your invoicing history, payment collection, and business activity
                </div>
                <div style={{
                  background: 'rgba(0,197,102,0.08)',
                  border: '1px solid rgba(0,197,102,0.2)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.85rem',
                  display: 'inline-block',
                }}>
                  <div style={{
                    color: '#4A6055',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    marginBottom: '0.1rem',
                  }}>
                    ESTIMATED LOAN ELIGIBILITY
                  </div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: '#00C566',
                  }}>
                    Up to {creditScore.loan}
                  </div>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              marginBottom: '1.2rem',
            }}>
              {creditScore.factors.map((factor, i) => {
                const pct = (factor.score / factor.max) * 100
                const barColor = factor.status === 'good'
                  ? '#00C566'
                  : factor.status === 'fair'
                  ? '#f5a623'
                  : factor.status === 'poor'
                  ? '#ff8080'
                  : '#4A6055'

                return (
                  <div key={i}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.3rem',
                    }}>
                      <span style={{
                        color: '#7A9485',
                        fontSize: '0.8rem',
                      }}>
                        {factor.label}
                      </span>
                      <span style={{
                        color: barColor,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        fontFamily: 'Syne, sans-serif',
                      }}>
                        {factor.score}/{factor.max}
                      </span>
                    </div>
                    <div style={{
                      height: '5px',
                      background: 'rgba(255,255,255,0.05)',
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

            {/* Coming Soon Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,197,102,0.06), rgba(124,106,247,0.06))',
              border: '1px solid rgba(0,197,102,0.15)',
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
                  color: '#EDF2EF',
                  marginBottom: '0.2rem',
                }}>
                  Business Loan Matching — Coming Soon
                </div>
                <div style={{
                  color: '#7A9485',
                  fontSize: '0.78rem',
                  lineHeight: 1.5,
                }}>
                  We're partnering with Nigerian microfinance banks.
                  Your StackPay score will unlock pre-approved loans
                  without going to a bank. Keep building your score.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI ADVISOR TAB ── */}
        {activeTab === 'advisor' && (
          <div>
            {!advice && !loadingAdvice && (
              <div style={{
                background: 'rgba(124,106,247,0.04)',
                border: '1px solid rgba(124,106,247,0.15)',
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
                    color: '#EDF2EF',
                    marginBottom: '0.4rem',
                    fontSize: '0.92rem',
                  }}>
                    Your Personal Business Advisor
                  </div>
                  <p style={{
                    color: '#7A9485',
                    fontSize: '0.85rem',
                    lineHeight: 1.7,
                  }}>
                    Click below and Grok AI will analyze your real business
                    numbers — invoices, expenses, unpaid bills, credit score —
                    and tell you exactly what to do this week to make more money.
                  </p>
                </div>
              </div>
            )}

            {loadingAdvice && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                padding: '0.5rem 0',
                marginBottom: '1rem',
              }}>
                <div style={{
                  color: '#7C6AF7',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '2px solid rgba(124,106,247,0.3)',
                    borderTopColor: '#7C6AF7',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  Analyzing your business data...
                </div>
                {[100, 80, 90, 65].map((w, i) => (
                  <div key={i} style={{
                    height: '10px',
                    borderRadius: '5px',
                    background: 'rgba(124,106,247,0.08)',
                    width: `${w}%`,
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`,
                  }} />
                ))}
              </div>
            )}

            {advice && !loadingAdvice && (
              <div style={{
                background: 'rgba(124,106,247,0.04)',
                border: '1px solid rgba(124,106,247,0.15)',
                borderRadius: '12px',
                padding: '1.2rem',
                marginBottom: '1rem',
              }}>
                <p style={{
                  color: '#C8D5CE',
                  fontSize: '0.9rem',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}>
                  {advice}
                </p>
                <div style={{
                  marginTop: '0.75rem',
                  color: '#4A6055',
                  fontSize: '0.7rem',
                }}>
                  ✦ Generated by Grok AI using your live business data
                </div>
              </div>
            )}

            <button
              onClick={getAIAdvice}
              disabled={loadingAdvice}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '10px',
                background: loadingAdvice
                  ? 'rgba(124,106,247,0.1)'
                  : 'rgba(124,106,247,0.15)',
                border: '1px solid rgba(124,106,247,0.3)',
                color: '#7C6AF7',
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
                  e.currentTarget.style.background = 'rgba(124,106,247,0.25)'
                }
              }}
              onMouseLeave={e => {
                if (!loadingAdvice) {
                  e.currentTarget.style.background = 'rgba(124,106,247,0.15)'
                }
              }}
            >
              {loadingAdvice ? (
                <>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '2px solid rgba(124,106,247,0.3)',
                    borderTopColor: '#7C6AF7',
                    animation: 'spin 0.8s linear infinite',
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default StackPayIntelligence