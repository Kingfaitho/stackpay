import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../supabaseClient'

// ─── Prediction card — outside to avoid hooks violation ──────────────────────
function PredictionCard({ pred, colors, isDark }) {
  const typeStyles = {
    positive: {
      bg: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.04)',
      border: isDark ? 'rgba(0,197,102,0.2)' : 'rgba(0,120,60,0.15)',
      text: colors.green,
    },
    warning: {
      bg: isDark ? 'rgba(245,166,35,0.06)' : 'rgba(184,122,0,0.04)',
      border: isDark ? 'rgba(245,166,35,0.2)' : 'rgba(184,122,0,0.15)',
      text: colors.warning,
    },
    danger: {
      bg: isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)',
      border: isDark ? 'rgba(255,80,80,0.2)' : 'rgba(204,34,0,0.15)',
      text: colors.danger,
    },
    info: {
      bg: isDark ? 'rgba(124,106,247,0.06)' : 'rgba(91,78,199,0.04)',
      border: isDark ? 'rgba(124,106,247,0.2)' : 'rgba(91,78,199,0.15)',
      text: colors.purple,
    },
  }
  const s = typeStyles[pred.type] || typeStyles.info

  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: '12px',
      padding: '1rem 1.2rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
      }}>
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
            color: s.text,
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
}

// ─── Factor bar — outside to avoid hooks violation ────────────────────────────
function FactorBar({ factor, colors, isDark }) {
  const pct = (factor.score / factor.max) * 100
  const barColor = factor.status === 'good'
    ? colors.green
    : factor.status === 'fair'
    ? colors.warning
    : factor.status === 'poor'
    ? colors.danger
    : colors.textMuted

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.3rem',
      }}>
        <span style={{ color: colors.textSecondary, fontSize: '0.8rem' }}>
          {factor.label}
        </span>
        <span style={{
          color: barColor,
          fontSize: '0.75rem',
          fontWeight: 700,
          fontFamily: 'Syne, sans-serif',
        }}>
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
}

// ─── Main component ───────────────────────────────────────────────────────────
function StackPayIntelligence({
  invoices = [],
  expenses = [],
  totalIncome = 0,
  totalExpenses = 0,
  unpaidInvoices = 0,
  totalClients = 0,
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
  const [scoreHistory, setScoreHistory] = useState([])

  // ─── Derived values ─────────────────────────────────────────────────────
  const unpaidTotal = (invoices || [])
    .filter(i => i.status === 'unpaid')
    .reduce((sum, i) => sum + Number(i.total), 0)

  const overdueCount = (invoices || []).filter(inv => {
    if (inv.status !== 'unpaid' || !inv.due_date) return false
    return new Date(inv.due_date) < new Date()
  }).length

  const netCash = totalIncome - totalExpenses

  // Emergency = dangerously low cash position or many overdue invoices
  const isEmergency = (
    overdueCount >= 3 ||
    unpaidInvoices >= 5 ||
    (totalIncome > 0 && netCash < totalExpenses * 0.15)
  )

  useEffect(() => {
    generatePredictions()
    generateAlerts()
    calculateCreditScore()
  }, [invoices, expenses, totalIncome, totalExpenses, unpaidInvoices, totalClients])

  // ─── Predictions Engine ─────────────────────────────────────────────────
  const generatePredictions = useCallback(() => {
    const preds = []

    // Monthly revenue trend
    const monthlyMap = {}
    ;(invoices || [])
      .filter(i => i.status === 'paid')
      .forEach(inv => {
        const key = new Date(inv.created_at).toLocaleString('en-NG', {
          month: 'short', year: '2-digit',
        })
        monthlyMap[key] = (monthlyMap[key] || 0) + Number(inv.total)
      })

    const months = Object.values(monthlyMap)
    if (months.length >= 2) {
      const last = months[months.length - 1]
      const prev = months[months.length - 2]
      if (prev > 0) {
        const change = ((last - prev) / prev) * 100
        if (change > 20) {
          preds.push({
            type: 'positive', icon: '📈',
            title: `Revenue Up ${change.toFixed(0)}% Last Month`,
            body: `Strong growth signal. This is the time to reinvest — restock inventory, increase your marketing, or approach clients about larger retainers.`,
            action: 'Review your best-performing service and double down on it',
          })
        } else if (change < -20) {
          preds.push({
            type: 'danger', icon: '📉',
            title: `Revenue Dropped ${Math.abs(change).toFixed(0)}% Last Month`,
            body: `Two consecutive months of decline is a pattern. One month can be seasonal — two months is a signal that needs your attention today.`,
            action: 'Identify your last 3 paying clients and ask for new work or referrals',
          })
        } else if (change > 0) {
          preds.push({
            type: 'positive', icon: '📊',
            title: 'Revenue Trending Up',
            body: `Income grew ${change.toFixed(0)}% last month. Steady growth is healthy. Keep this momentum by maintaining consistent invoicing.`,
            action: 'Create at least 2 new invoices this week to keep the pipeline active',
          })
        }
      }
    }

    // Expense ratio
    if (totalIncome > 0) {
      const ratio = totalExpenses / totalIncome
      if (ratio > 0.8) {
        preds.push({
          type: 'danger', icon: '🔥',
          title: 'Critical: Expenses Are Consuming Your Revenue',
          body: `${(ratio * 100).toFixed(0)}% of your income is going to costs. You are essentially working to break even. This is the financial pattern that kills businesses silently.`,
          action: 'List every expense this month and cut or defer anything not essential to delivering your service',
        })
      } else if (ratio > 0.6) {
        preds.push({
          type: 'warning', icon: '⚠️',
          title: 'Expenses Eating Into Profit',
          body: `${(ratio * 100).toFixed(0)}% of income goes to expenses. Healthy businesses keep this below 60%. You have room to improve.`,
          action: 'Identify your top 3 expense categories and negotiate better rates or find alternatives',
        })
      } else if (ratio < 0.4) {
        preds.push({
          type: 'positive', icon: '💚',
          title: 'Excellent Profit Margin',
          body: `You are keeping ${(100 - ratio * 100).toFixed(0)}% of your income as profit. This is strong financial discipline. The next step is to grow revenue without proportionally growing expenses.`,
          action: 'Consider investing 20% of this month\'s profit back into the business',
        })
      }
    }

    // Unpaid invoice risk
    if (unpaidInvoices >= 3) {
      preds.push({
        type: 'warning', icon: '🔔',
        title: `₦${unpaidTotal.toLocaleString()} Stuck in Unpaid Invoices`,
        body: `${unpaidInvoices} invoices are unpaid. This money should be in your account working for your business, not sitting in someone else's intentions.`,
        action: 'Go to Collections and send WhatsApp reminders to every overdue client today',
      })
    }

    // Client concentration risk
    const clientTotals = {}
    ;(invoices || []).forEach(inv => {
      if (inv.client_id) {
        clientTotals[inv.client_id] =
          (clientTotals[inv.client_id] || 0) + Number(inv.total)
      }
    })
    const allVal = Object.values(clientTotals).reduce((a, b) => a + b, 0)
    const topVal = Math.max(...Object.values(clientTotals), 0)
    if (allVal > 0 && topVal / allVal > 0.6) {
      preds.push({
        type: 'warning', icon: '⚡',
        title: 'One Client = 60%+ of Your Revenue',
        body: `Your business depends too heavily on one client. If they leave, reduce orders, or delay payment, your entire business feels it immediately. This is fragile.`,
        action: 'Commit to finding 2 new clients this month to reduce dependency',
      })
    }

    // Overdue invoices specific warning
    if (overdueCount > 0) {
      preds.push({
        type: overdueCount >= 3 ? 'danger' : 'warning',
        icon: '📅',
        title: `${overdueCount} Invoice${overdueCount > 1 ? 's' : ''} Past Due Date`,
        body: `Overdue invoices are the biggest cash flow killer for Nigerian SMEs. Every day they sit unpaid, your business absorbs that cost. The longer you wait to chase, the harder it becomes.`,
        action: `Open Collections and send the ${overdueCount > 1 ? 'Urgent' : 'Firm'} tone reminder to overdue clients now`,
      })
    }

    // Low client count
    if (totalClients < 3 && totalIncome > 0) {
      preds.push({
        type: 'info', icon: '👥',
        title: 'Build Your Client Base',
        body: `With ${totalClients} client${totalClients !== 1 ? 's' : ''}, your business is vulnerable. More clients means more stable revenue and less pressure from any single relationship.`,
        action: 'Ask your existing clients to refer one person who might need your service',
      })
    }

    // Positive default
    if (preds.length === 0 && totalIncome > 0) {
      preds.push({
        type: 'positive', icon: '🌟',
        title: 'Business Metrics Look Healthy',
        body: `Your income, expenses, and client relationships are in good shape. Use this stable period to build your cash buffer and prepare for the next growth phase.`,
        action: 'Set a revenue target for next month that is 20% higher than this month',
      })
    }

    // No data state
    if (preds.length === 0) {
      preds.push({
        type: 'info', icon: '💡',
        title: 'Start Tracking to Unlock Intelligence',
        body: `Ledga needs your financial data to generate predictions. Add your first invoice, log your first expense, and Ledga will begin building your financial picture.`,
        action: 'Create your first invoice to get started',
      })
    }

    setPredictions(preds)
  }, [invoices, expenses, totalIncome, totalExpenses, unpaidInvoices, totalClients, unpaidTotal, overdueCount])

  // ─── Alerts Engine ──────────────────────────────────────────────────────
  const generateAlerts = useCallback(() => {
    const newAlerts = []
    const today = new Date()

    // Overdue
    const overdueInvs = (invoices || []).filter(inv => {
      if (inv.status !== 'unpaid' || !inv.due_date) return false
      return new Date(inv.due_date) < today
    })
    if (overdueInvs.length > 0) {
      const overdueAmt = overdueInvs.reduce((s, i) => s + Number(i.total), 0)
      newAlerts.push({
        level: 'high', icon: '🚨',
        text: `${overdueInvs.length} overdue invoice${overdueInvs.length > 1 ? 's' : ''} — ₦${overdueAmt.toLocaleString()} past due date`,
      })
    }

    // Due soon (3 days)
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

    // Expense spike this month
    const thisMonth = today.getMonth()
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const thisMonthExp = (expenses || [])
      .filter(e => new Date(e.date || e.created_at).getMonth() === thisMonth)
      .reduce((s, e) => s + Number(e.amount), 0)
    const lastMonthExp = (expenses || [])
      .filter(e => new Date(e.date || e.created_at).getMonth() === lastMonth)
      .reduce((s, e) => s + Number(e.amount), 0)
    if (lastMonthExp > 0 && thisMonthExp > lastMonthExp * 1.3) {
      newAlerts.push({
        level: 'medium', icon: '💸',
        text: `Expenses up ${(((thisMonthExp - lastMonthExp) / lastMonthExp) * 100).toFixed(0)}% compared to last month`,
      })
    }

    // Emergency cash alert
    if (isEmergency) {
      newAlerts.unshift({
        level: 'critical', icon: '🆘',
        text: `Emergency signal detected — ${overdueCount} overdue invoices, ₦${unpaidTotal.toLocaleString()} uncollected. Take action now.`,
      })
    }

    // No expenses logged warning
    if ((expenses || []).length === 0 && totalIncome > 0) {
      newAlerts.push({
        level: 'info', icon: '📝',
        text: 'No expenses logged yet. Your profit calculation is incomplete without expenses.',
      })
    }

    setAlerts(newAlerts)
  }, [invoices, expenses, totalIncome, isEmergency, overdueCount, unpaidTotal])

  // ─── Credit Score Engine ────────────────────────────────────────────────
  const calculateCreditScore = useCallback(() => {
    let score = 300
    const factors = []

    // Payment collection rate (max 200)
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

    // Revenue consistency (max 150)
    const monthlyMap = {}
    ;(invoices || []).filter(i => i.status === 'paid').forEach(inv => {
      const m = new Date(inv.created_at).getMonth()
      monthlyMap[m] = (monthlyMap[m] || 0) + 1
    })
    const activeMonths = Object.keys(monthlyMap).length
    const consistencyPts = Math.min(activeMonths * 25, 150)
    score += consistencyPts
    factors.push({
      label: 'Revenue Consistency',
      score: consistencyPts, max: 150,
      status: activeMonths >= 4 ? 'good' : activeMonths >= 2 ? 'fair' : 'poor',
    })

    // Profit margin (max 150)
    if (totalIncome > 0) {
      const margin = (totalIncome - totalExpenses) / totalIncome
      const pts = Math.min(Math.round(Math.max(margin, 0) * 150), 150)
      score += pts
      factors.push({
        label: 'Profit Margin',
        score: pts, max: 150,
        status: margin > 0.4 ? 'good' : margin > 0.15 ? 'fair' : 'poor',
      })
    } else {
      factors.push({ label: 'Profit Margin', score: 0, max: 150, status: 'none' })
    }

    // Client diversity (max 100)
    const clientPts = Math.min(totalClients * 20, 100)
    score += clientPts
    factors.push({
      label: 'Client Diversity',
      score: clientPts, max: 100,
      status: totalClients >= 5 ? 'good' : totalClients >= 2 ? 'fair' : 'poor',
    })

    // Business activity (max 100)
    const activityPts = Math.min(totalCount * 10, 100)
    score += activityPts
    factors.push({
      label: 'Business Activity',
      score: activityPts, max: 100,
      status: totalCount >= 10 ? 'good' : totalCount >= 5 ? 'fair' : 'poor',
    })

    // Overdue penalty (max -100)
    const overduePenalty = Math.min(overdueCount * 20, 100)
    score -= overduePenalty
    if (overdueCount > 0) {
      factors.push({
        label: 'Overdue Invoice Penalty',
        score: -overduePenalty, max: 0,
        status: overdueCount === 0 ? 'good' : overdueCount <= 2 ? 'fair' : 'poor',
      })
    }

    const finalScore = Math.min(Math.max(score, 300), 1000)

    const getGrade = s => {
      if (s >= 850) return { grade: 'Excellent', color: '#00C566', loan: '₦2,000,000', emoji: '🏆' }
      if (s >= 700) return { grade: 'Good', color: '#00A855', loan: '₦1,000,000', emoji: '✅' }
      if (s >= 550) return { grade: 'Fair', color: '#f5a623', loan: '₦500,000', emoji: '📈' }
      if (s >= 400) return { grade: 'Building', color: '#7C6AF7', loan: '₦150,000', emoji: '🔨' }
      return { grade: 'Starting', color: '#8A9E92', loan: '₦50,000', emoji: '🌱' }
    }

    const gradeData = getGrade(finalScore)
    setCreditScore({ score: finalScore, factors, ...gradeData })

    // Store score in history (in memory — not persisted)
    setScoreHistory(prev => {
      const today = new Date().toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
      const already = prev.find(p => p.date === today)
      if (already) return prev
      return [...prev.slice(-6), { date: today, score: finalScore }]
    })
  }, [invoices, expenses, totalIncome, totalExpenses, totalClients, overdueCount])

  // ─── AI Advisor ─────────────────────────────────────────────────────────
const getAIAdvice = async () => {
  setLoadingAdvice(true)
  setAdvice('')

  const emergencyPrompt = `EMERGENCY MODE. Nigerian business in financial distress.
Net cash position: NGN ${netCash.toLocaleString()}
Overdue invoices: ${overdueCount} worth NGN ${unpaidTotal.toLocaleString()}
Total unpaid: ${unpaidInvoices} invoices
Profit margin: ${totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%

Give exactly 3 emergency actions. No introduction. No fluff.
Each action is one sentence starting with a verb.
Format as numbered list 1. 2. 3.
End with ONE sentence of belief.`

  const normalPrompt = `You are a sharp financial advisor for Nigerian small businesses.
Business: ${businessName || 'Nigerian SME'}
Total Income: NGN ${totalIncome.toLocaleString()}
Total Expenses: NGN ${totalExpenses.toLocaleString()}
Net Profit: NGN ${netCash.toLocaleString()}
Profit Margin: ${totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%
Unpaid Invoices: ${unpaidInvoices} worth NGN ${unpaidTotal.toLocaleString()}
Overdue: ${overdueCount}
Total Clients: ${totalClients}
Credit Score: ${creditScore?.score || 'Calculating'}/1000

Give 3 specific numbered actions for THIS WEEK.
Each action 1-2 sentences. Reference actual numbers.
End with one motivational sentence. Under 120 words total.`

  try {
    const { data, error } = await supabase.functions.invoke('ai-advisor', {
      body: {
        prompt: isEmergency ? emergencyPrompt : normalPrompt,
        isEmergency,
      },
    })

    if (error) {
      console.error('Edge function error:', error)
      setAdvice('AI service temporarily unavailable. Please try again in a moment.')
      setLoadingAdvice(false)
      return
    }

    setAdvice(data?.advice || 'No advice generated. Please try again.')
  } catch (err) {
    console.error('AI call error:', err)
    setAdvice('Network error. Check your connection and try again.')
  }

  setLoadingAdvice(false)
}


  // ─── Tabs config ────────────────────────────────────────────────────────
  const tabs = [
    { id: 'predictions', label: '🔮 Predictions', count: predictions.length },
    {
      id: 'alerts',
      label: '🚨 Alerts',
      count: alerts.length,
      urgent: alerts.some(a => a.level === 'critical' || a.level === 'high'),
    },
    { id: 'credit', label: '💳 Credit Score' },
    { id: 'advisor', label: isEmergency ? '🆘 Emergency AI' : '🤖 AI Advisor' },
  ]

  const alertLevelStyles = {
    critical: {
      bg: isDark ? 'rgba(255,80,80,0.1)' : 'rgba(204,34,0,0.07)',
      border: isDark ? 'rgba(255,80,80,0.3)' : 'rgba(204,34,0,0.2)',
    },
    high: {
      bg: isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)',
      border: isDark ? 'rgba(255,80,80,0.2)' : 'rgba(204,34,0,0.15)',
    },
    medium: {
      bg: isDark ? 'rgba(245,166,35,0.06)' : 'rgba(184,122,0,0.04)',
      border: isDark ? 'rgba(245,166,35,0.2)' : 'rgba(184,122,0,0.15)',
    },
    info: {
      bg: isDark ? 'rgba(124,106,247,0.06)' : 'rgba(91,78,199,0.04)',
      border: isDark ? 'rgba(124,106,247,0.2)' : 'rgba(91,78,199,0.15)',
    },
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${isEmergency ? colors.danger + '50' : colors.border}`,
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '2rem',
      boxShadow: isEmergency
        ? `0 0 0 2px ${colors.danger}20`
        : isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
      transition: 'border-color 0.3s, box-shadow 0.3s',
    }}>

      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: `1px solid ${colors.border}`,
        background: isEmergency
          ? isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.03)'
          : isDark
          ? 'linear-gradient(135deg, rgba(0,197,102,0.04), rgba(124,106,247,0.04))'
          : 'linear-gradient(135deg, rgba(0,120,60,0.03), rgba(91,78,199,0.03))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        transition: 'background 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isEmergency
              ? isDark ? 'rgba(255,80,80,0.15)' : 'rgba(204,34,0,0.1)'
              : isDark ? 'rgba(0,197,102,0.15)' : 'rgba(0,120,60,0.1)',
            border: `1px solid ${isEmergency ? colors.danger + '40' : colors.borderGreen}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            transition: 'all 0.3s',
          }}>
            {isEmergency ? '🆘' : '✦'}
          </div>
          <div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: colors.textPrimary,
              letterSpacing: '-0.3px',
            }}>
              {isEmergency ? 'Ledga Intelligence — Emergency Mode' : 'Ledga Intelligence'}
            </div>
            <div style={{
              color: isEmergency ? colors.danger : colors.textMuted,
              fontSize: '0.72rem',
              fontWeight: 500,
            }}>
              {isEmergency
                ? 'Action required — your business needs attention now'
                : `AI-powered insights for ${businessName || 'your business'}`}
            </div>
          </div>
        </div>

        {/* Live / Emergency badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: isEmergency
            ? isDark ? 'rgba(255,80,80,0.12)' : 'rgba(204,34,0,0.08)'
            : isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)',
          border: `1px solid ${isEmergency ? colors.danger + '40' : colors.borderGreen}`,
          borderRadius: '100px',
          padding: '0.25rem 0.75rem',
          fontSize: '0.68rem',
          color: isEmergency ? colors.danger : colors.green,
          fontWeight: 700,
          fontFamily: 'Syne, sans-serif',
          transition: 'all 0.3s',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isEmergency ? colors.danger : colors.green,
            animation: 'spi-pulse 2s infinite',
          }} />
          {isEmergency ? 'EMERGENCY' : 'LIVE DATA'}
        </div>
      </div>

      {/* Emergency Banner */}
      {isEmergency && (
        <div style={{
          padding: '0.85rem 1.5rem',
          background: isDark ? 'rgba(255,80,80,0.08)' : 'rgba(204,34,0,0.05)',
          borderBottom: `1px solid ${colors.danger}30`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: colors.danger,
            }}>
              Emergency signals detected:
            </span>
            <span style={{
              color: colors.textSecondary,
              fontSize: '0.82rem',
              marginLeft: '0.4rem',
            }}>
              {overdueCount > 0 && `${overdueCount} overdue invoice${overdueCount > 1 ? 's' : ''}`}
              {overdueCount > 0 && unpaidInvoices > 0 && ' · '}
              {unpaidInvoices > 0 && `₦${unpaidTotal.toLocaleString()} uncollected`}
            </span>
          </div>
          <button
            onClick={() => {
              setActiveTab('advisor')
              setTimeout(getAIAdvice, 100)
            }}
            style={{
              padding: '0.4rem 0.85rem',
              background: colors.danger,
              color: '#fff',
              border: 'none',
              borderRadius: '7px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Get Help Now
          </button>
        </div>
      )}

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
                ? `2px solid ${tab.id === 'advisor' && isEmergency ? colors.danger : colors.green}`
                : '2px solid transparent',
              color: activeTab === tab.id
                ? (tab.id === 'advisor' && isEmergency ? colors.danger : colors.green)
                : colors.textMuted,
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
                background: tab.urgent
                  ? isDark ? 'rgba(255,80,80,0.15)' : 'rgba(204,34,0,0.1)'
                  : activeTab === tab.id
                  ? isDark ? 'rgba(0,197,102,0.15)' : 'rgba(0,120,60,0.1)'
                  : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                color: tab.urgent
                  ? colors.danger
                  : activeTab === tab.id ? colors.green : colors.textMuted,
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

        {/* PREDICTIONS TAB */}
        {activeTab === 'predictions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {predictions.map((pred, i) => (
              <PredictionCard
                key={i}
                pred={pred}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div>
            {alerts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: colors.textMuted,
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                  No active alerts. Business is running clean.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {alerts.map((alert, i) => {
                  const as = alertLevelStyles[alert.level] || alertLevelStyles.info
                  return (
                    <div key={i} style={{
                      background: as.bg,
                      border: `1px solid ${as.border}`,
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                    }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                        {alert.icon}
                      </span>
                      <span style={{
                        color: alert.level === 'critical' || alert.level === 'high'
                          ? colors.danger
                          : alert.level === 'medium'
                          ? colors.warning
                          : colors.textSecondary,
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        fontWeight: alert.level === 'critical' ? 600 : 400,
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

        {/* CREDIT SCORE TAB */}
        {activeTab === 'credit' && creditScore && (
          <div>
            {/* Score display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
            }}>
              {/* Circle */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="55" cy="55" r="48"
                    fill="none"
                    stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}
                    strokeWidth="8"
                  />
                  <circle
                    cx="55" cy="55" r="48"
                    fill="none"
                    stroke={creditScore.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - creditScore.score / 1000)}
                    style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s' }}
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
                  <div style={{ fontSize: '1.1rem', lineHeight: 1 }}>
                    {creditScore.emoji}
                  </div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    color: creditScore.color,
                    lineHeight: 1,
                    marginTop: '0.15rem',
                  }}>
                    {creditScore.score}
                  </div>
                  <div style={{
                    color: colors.textMuted,
                    fontSize: '0.6rem',
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

                {/* Score trend */}
                {scoreHistory.length > 1 && (
                  <div style={{
                    color: colors.textMuted,
                    fontSize: '0.72rem',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}>
                    {scoreHistory.map((s, i) => (
                      <span key={i} style={{
                        color: i === scoreHistory.length - 1
                          ? creditScore.color
                          : colors.textMuted,
                        fontWeight: i === scoreHistory.length - 1 ? 700 : 400,
                      }}>
                        {s.score}
                        {i < scoreHistory.length - 1 && ' →'}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{
                  color: colors.textSecondary,
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  marginBottom: '0.75rem',
                }}>
                  Based on payment collection, revenue consistency, profit margin, client diversity, and business activity
                </div>

                {/* Loan eligibility */}
                <div style={{
                  background: isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)',
                  border: `1px solid ${colors.borderGreen}`,
                  borderRadius: '10px',
                  padding: '0.6rem 0.85rem',
                  display: 'inline-block',
                }}>
                  <div style={{
                    color: colors.textMuted,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    marginBottom: '0.1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>
                    Estimated Loan Eligibility
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              marginBottom: '1.25rem',
            }}>
              {creditScore.factors.map((factor, i) => (
                <FactorBar key={i} factor={factor} colors={colors} isDark={isDark} />
              ))}
            </div>

            {/* How to improve */}
            <div style={{
              background: isDark ? 'rgba(124,106,247,0.05)' : 'rgba(91,78,199,0.03)',
              border: `1px solid ${isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.12)'}`,
              borderRadius: '12px',
              padding: '1rem 1.2rem',
              marginBottom: '1rem',
            }}>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: colors.purple,
                marginBottom: '0.5rem',
              }}>
                How to improve your score
              </div>
              <div style={{
                color: colors.textSecondary,
                fontSize: '0.8rem',
                lineHeight: 1.7,
              }}>
                {creditScore.score < 500
                  ? '1. Collect your overdue invoices — each one paid improves your collection rate. 2. Log expenses consistently so your profit margin is visible. 3. Add more clients to reduce concentration risk.'
                  : creditScore.score < 700
                  ? '1. Invoice regularly every month to build consistency. 2. Keep expenses below 60% of income to improve your margin score. 3. Expand your client base beyond 3 clients.'
                  : '1. Maintain your invoicing consistency. 2. Keep collecting overdue payments quickly. 3. Continue diversifying your client base. Your score reflects excellent financial discipline.'}
              </div>
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
                <div style={{
                  color: colors.textSecondary,
                  fontSize: '0.78rem',
                  lineHeight: 1.5,
                }}>
                  Ledga is partnering with Nigerian microfinance institutions.
                  Your score will unlock pre-approved business loans without paperwork.
                  Keep building.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI ADVISOR TAB */}
        {activeTab === 'advisor' && (
          <div>
            {/* Context summary before advice */}
            {!advice && !loadingAdvice && (
              <div style={{
                background: isEmergency
                  ? isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)'
                  : isDark ? 'rgba(124,106,247,0.04)' : 'rgba(91,78,199,0.03)',
                border: `1px solid ${isEmergency
                  ? colors.danger + '30'
                  : isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.12)'}`,
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1rem',
              }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: isEmergency ? colors.danger : colors.textPrimary,
                  marginBottom: '0.75rem',
                }}>
                  {isEmergency
                    ? '🆘 Emergency Financial Situation Detected'
                    : '🤖 Your Personal Business Advisor'}
                </div>

                {/* Data being analyzed */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}>
                  {[
                    {
                      label: 'Net Cash',
                      value: `₦${Math.abs(netCash).toLocaleString()}`,
                      color: netCash >= 0 ? colors.green : colors.danger,
                      prefix: netCash < 0 ? '-' : '+',
                    },
                    {
                      label: 'Unpaid',
                      value: `₦${unpaidTotal.toLocaleString()}`,
                      color: colors.warning,
                    },
                    {
                      label: 'Overdue',
                      value: `${overdueCount} invoice${overdueCount !== 1 ? 's' : ''}`,
                      color: overdueCount > 0 ? colors.danger : colors.green,
                    },
                    {
                      label: 'Credit Score',
                      value: `${creditScore?.score || '—'}/1000`,
                      color: creditScore?.color || colors.textMuted,
                    },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: colors.bgCard2,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                    }}>
                      <div style={{
                        color: colors.textMuted,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        marginBottom: '0.2rem',
                      }}>
                        {item.label}
                      </div>
                      <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        color: item.color,
                      }}>
                        {item.prefix}{item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{
                  color: colors.textSecondary,
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                }}>
                  {isEmergency
                    ? 'Your business data shows urgent signals. Click below for emergency financial advice specific to your numbers.'
                    : 'AI will read your actual income, expenses, unpaid invoices, and credit score to give you 3 specific actions for this week.'}
                </p>
              </div>
            )}

            {/* Loading skeleton */}
            {loadingAdvice && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  color: isEmergency ? colors.danger : colors.purple,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: `2px solid ${isEmergency ? colors.danger : colors.purple}40`,
                    borderTopColor: isEmergency ? colors.danger : colors.purple,
                    animation: 'spi-spin 0.8s linear infinite',
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  {isEmergency
                    ? 'Analyzing emergency situation...'
                    : 'Analyzing your business data...'}
                </div>
                {[100, 82, 94, 68].map((w, i) => (
                  <div key={i} style={{
                    height: '10px',
                    borderRadius: '5px',
                    background: isDark
                      ? isEmergency ? 'rgba(255,80,80,0.08)' : 'rgba(124,106,247,0.08)'
                      : isEmergency ? 'rgba(204,34,0,0.06)' : 'rgba(91,78,199,0.06)',
                    width: `${w}%`,
                    marginBottom: '0.5rem',
                    animation: 'spi-pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`,
                  }} />
                ))}
              </div>
            )}

            {/* Advice result */}
            {advice && !loadingAdvice && (
              <div style={{
                background: isEmergency
                  ? isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)'
                  : isDark ? 'rgba(124,106,247,0.04)' : 'rgba(91,78,199,0.03)',
                border: `1px solid ${isEmergency
                  ? colors.danger + '30'
                  : isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.12)'}`,
                borderRadius: '12px',
                padding: '1.2rem',
                marginBottom: '1rem',
              }}>
                <p style={{
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  lineHeight: 1.85,
                  whiteSpace: 'pre-wrap',
                }}>
                  {advice}
                </p>
                <div style={{
                  marginTop: '0.75rem',
                  color: colors.textMuted,
                  fontSize: '0.68rem',
                }}>
                  ✦ Generated using your live Ledga business data ·{' '}
                  {isEmergency ? 'Emergency Mode' : 'Standard Mode'}
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              type="button"
              onClick={getAIAdvice}
              disabled={loadingAdvice}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '10px',
                background: loadingAdvice
                  ? isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
                  : isEmergency
                  ? isDark ? 'rgba(255,80,80,0.15)' : 'rgba(204,34,0,0.08)'
                  : isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.08)',
                border: `1px solid ${loadingAdvice
                  ? colors.border
                  : isEmergency
                  ? colors.danger + '40'
                  : isDark ? 'rgba(124,106,247,0.3)' : 'rgba(91,78,199,0.2)'}`,
                color: loadingAdvice
                  ? colors.textMuted
                  : isEmergency ? colors.danger : colors.purple,
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
                  e.currentTarget.style.opacity = '0.85'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              {loadingAdvice ? (
                <>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: `2px solid ${colors.textMuted}40`,
                    borderTopColor: colors.textMuted,
                    animation: 'spi-spin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  Analyzing...
                </>
              ) : isEmergency ? (
                <>🆘 {advice ? 'Get New Emergency Advice' : 'Get Emergency Advice Now'}</>
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