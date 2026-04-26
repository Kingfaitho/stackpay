import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

const DEFAULT_CATEGORIES = [
  'Data & Internet',
  'Transport',
  'Stock/Inventory',
  'Rent',
  'Salary',
  'Marketing',
  'Equipment',
  'Food & Welfare',
  'Utilities',
]

function Budget() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [budgets, setBudgets] = useState({})
  const [actuals, setActuals] = useState({})
  const [editing, setEditing] = useState({})
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [customCat, setCustomCat] = useState('')
  const [showAddCat, setShowAddCat] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('plan')
  const [history, setHistory] = useState([])
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [loadingAI, setLoadingAI] = useState(false)

  useEffect(() => {
    if (user) {
      loadBudgetData()
      loadHistory()
    }
  }, [user, selectedMonth])

  const loadBudgetData = async () => {
    setLoading(true)
    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', selectedMonth)

    const { data: expenseData } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)

    // Merge saved categories with defaults
    const savedCategories = budgetData?.map(b => b.category) || []
    const allCats = [...new Set([...DEFAULT_CATEGORIES, ...savedCategories])]
    setCategories(allCats)

    const budgetMap = {}
    budgetData?.forEach(b => { budgetMap[b.category] = b.budgeted })

    const actualMap = {}
    expenseData?.forEach(e => {
      actualMap[e.category] = (actualMap[e.category] || 0) + Number(e.amount)
    })

    // Include expense categories not in budget
    Object.keys(actualMap).forEach(cat => {
      if (!allCats.includes(cat)) {
        setCategories(prev => [...new Set([...prev, cat])])
      }
    })

    const editMap = {}
    allCats.forEach(cat => { editMap[cat] = budgetMap[cat] || '' })

    setBudgets(budgetMap)
    setActuals(actualMap)
    setEditing(editMap)
    setLoading(false)
  }

  const loadHistory = async () => {
    // Load last 3 months of expense data for trend analysis
    const months = []
    for (let i = 2; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)

      const totals = {}
      data?.forEach(e => {
        totals[e.category] = (totals[e.category] || 0) + Number(e.amount)
      })

      months.push({ month: key, totals })
    }
    setHistory(months)
  }

  const addCustomCategory = () => {
    const trimmed = customCat.trim()
    if (!trimmed) return
    if (categories.includes(trimmed)) {
      alert('This category already exists')
      return
    }
    setCategories(prev => [...prev, trimmed])
    setEditing(prev => ({ ...prev, [trimmed]: '' }))
    setCustomCat('')
    setShowAddCat(false)
  }

  const removeCategory = (cat) => {
    if (DEFAULT_CATEGORIES.includes(cat)) return
    setCategories(prev => prev.filter(c => c !== cat))
    const newEditing = { ...editing }
    delete newEditing[cat]
    setEditing(newEditing)
  }

  const saveBudgets = async () => {
    setSaving(true)
    const upserts = categories
      .filter(cat => editing[cat] !== '' && Number(editing[cat]) > 0)
      .map(cat => ({
        user_id: user.id,
        month: selectedMonth,
        category: cat,
        budgeted: Number(editing[cat]),
      }))

    if (upserts.length > 0) {
      await supabase
        .from('budgets')
        .upsert(upserts, { onConflict: 'user_id,month,category' })
    }

    await loadBudgetData()
    setSaving(false)
  }

  const getAISuggestions = async () => {
    setLoadingAI(true)
    const historyText = history.map(h =>
      `${h.month}: ${Object.entries(h.totals)
        .map(([k, v]) => `${k}: NGN ${v.toLocaleString()}`)
        .join(', ')}`
    ).join('\n')

    const totalBudget = Object.values(editing)
      .reduce((a, b) => a + Number(b || 0), 0)

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-3-mini',
          max_tokens: 400,
          messages: [
            {
              role: 'system',
              content: 'You are a Nigerian SME financial advisor. Be specific and practical.',
            },
            {
              role: 'user',
              content: `A Nigerian business owner is planning their budget for ${selectedMonth}.
Their expense history (last 3 months):
${historyText || 'No history yet'}

Their planned budget total: NGN ${totalBudget.toLocaleString()}

Give 3 specific budget recommendations as a JSON array like:
[{"category":"Transport","suggestion":"Reduce from NGN 30000 to NGN 20000 — your transport costs have been consistent but can be reduced by batching deliveries","priority":"medium"},...]

Only output valid JSON array, nothing else.`,
            },
          ],
        }),
      })
      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || '[]'
      try {
        const clean = text.replace(/```json|```/g, '').trim()
        setAiSuggestions(JSON.parse(clean))
      } catch {
        setAiSuggestions([])
      }
    } catch {
      setAiSuggestions([])
    }
    setLoadingAI(false)
  }

  const applySuggestion = (suggestion) => {
    const match = suggestion.suggestion.match(/NGN ([\d,]+)/)
    if (match) {
      const amount = match[1].replace(/,/g, '')
      setEditing(prev => ({
        ...prev,
        [suggestion.category]: amount,
      }))
    }
  }

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount || 0)

  const getStatus = (budgeted, actual) => {
    if (!budgeted || budgeted === 0) return 'unset'
    const pct = (actual / budgeted) * 100
    if (pct >= 100) return 'over'
    if (pct >= 80) return 'warning'
    return 'good'
  }

  const statusConfig = {
    good: { color: colors.green, label: 'On track' },
    warning: { color: colors.warning, label: 'Getting close' },
    over: { color: colors.danger, label: 'Over budget' },
    unset: { color: colors.textMuted, label: 'Not set' },
  }

  const totalBudgeted = categories.reduce((a, cat) =>
    a + Number(editing[cat] || budgets[cat] || 0), 0)
  const totalActual = Object.values(actuals).reduce((a, b) => a + b, 0)
  const overBudgetCats = categories.filter(cat => {
    const b = Number(budgets[cat] || 0)
    const a = Number(actuals[cat] || 0)
    return b > 0 && a > b
  })

  const monthLabel = new Date(selectedMonth + '-01')
    .toLocaleString('en-NG', { month: 'long', year: 'numeric' })

  const getTrend = (cat) => {
    if (history.length < 2) return null
    const prev = history[history.length - 2]?.totals[cat] || 0
    const latest = history[history.length - 1]?.totals[cat] || 0
    if (prev === 0) return null
    const change = ((latest - prev) / prev) * 100
    return change
  }

  const getAvgSpend = (cat) => {
    const total = history.reduce((a, h) => a + (h.totals[cat] || 0), 0)
    return history.length > 0 ? total / history.length : 0
  }

  const cardStyle = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '14px',
    padding: '1.25rem',
    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
  }

  return (
    <AppLayout>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
            color: colors.textPrimary,
            marginBottom: '0.25rem',
          }}>
            🎯 Budget & Planning
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
            Plan your spending. Track against actuals. Grow smarter.
          </p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            border: `1px solid ${colors.border}`,
            background: colors.bgCard,
            color: colors.textPrimary,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.9rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Alert for over-budget */}
      {overBudgetCats.length > 0 && (
        <div style={{
          background: isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)',
          border: `1px solid ${colors.danger}30`,
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🚨</span>
          <div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              color: colors.danger,
              fontSize: '0.88rem',
              marginBottom: '0.2rem',
            }}>
              Over budget in {overBudgetCats.length} categor{overBudgetCats.length > 1 ? 'ies' : 'y'}
            </div>
            <div style={{ color: colors.textSecondary, fontSize: '0.82rem' }}>
              {overBudgetCats.join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {[
          {
            label: 'Total Budgeted',
            value: formatNaira(totalBudgeted),
            color: colors.green,
            icon: '📋',
          },
          {
            label: 'Total Spent',
            value: formatNaira(totalActual),
            color: totalActual > totalBudgeted && totalBudgeted > 0
              ? colors.danger
              : colors.textPrimary,
            icon: '💸',
          },
          {
            label: 'Remaining',
            value: formatNaira(Math.max(totalBudgeted - totalActual, 0)),
            color: totalBudgeted > 0 && totalActual < totalBudgeted
              ? colors.green
              : colors.textMuted,
            icon: '✅',
          },
          {
            label: 'Over Budget',
            value: totalActual > totalBudgeted && totalBudgeted > 0
              ? formatNaira(totalActual - totalBudgeted)
              : '—',
            color: colors.danger,
            icon: '⚠️',
          },
        ].map((card, i) => (
          <div key={i} style={cardStyle}>
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
            }}>
              {card.icon}
            </div>
            <div style={{
              color: colors.textLabel,
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}>
              {card.label}
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: card.color,
              letterSpacing: '-0.3px',
            }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: `1px solid ${colors.border}`,
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {[
          { id: 'plan', label: '📋 Plan Budget' },
          { id: 'track', label: '📊 Track vs Actual' },
          { id: 'ai', label: '🤖 AI Suggestions' },
          { id: 'history', label: '📈 Spending History' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeView === tab.id
                ? `2px solid ${colors.accent}`
                : '2px solid transparent',
              color: activeView === tab.id
                ? colors.accent
                : colors.textMuted,
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PLAN TAB ── */}
      {activeView === 'plan' && (
        <div>
          <div style={cardStyle}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: colors.textPrimary,
              }}>
                Set Budget for {monthLabel}
              </h3>
              <button
                onClick={() => setShowAddCat(!showAddCat)}
                style={{
                  padding: '0.4rem 0.9rem',
                  background: isDark
                    ? 'rgba(0,197,102,0.08)'
                    : 'rgba(0,120,60,0.06)',
                  border: `1px solid ${colors.borderGreen}`,
                  color: colors.green,
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                + Add Category
              </button>
            </div>

            {/* Add custom category */}
            {showAddCat && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
              }}>
                <input
                  placeholder="Type custom category name..."
                  value={customCat}
                  onChange={e => setCustomCat(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
                  autoFocus
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '0.6rem 0.9rem',
                    borderRadius: '8px',
                    border: `1px solid ${colors.borderGreen}`,
                    background: colors.bgInput,
                    color: colors.textPrimary,
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={addCustomCategory}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: colors.accent,
                    color: colors.accentText,
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowAddCat(false); setCustomCat('') }}
                  style={{
                    padding: '0.6rem 0.9rem',
                    background: 'transparent',
                    color: colors.textMuted,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Category inputs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}>
              {categories.map(cat => {
                const avg = getAvgSpend(cat)
                const trend = getTrend(cat)
                const isCustom = !DEFAULT_CATEGORIES.includes(cat)

                return (
                  <div key={cat} style={{
                    background: colors.bgCard2,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    padding: '0.85rem',
                    position: 'relative',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}>
                      <label style={{
                        color: colors.textPrimary,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        fontFamily: 'Syne, sans-serif',
                      }}>
                        {cat}
                        {isCustom && (
                          <span style={{
                            marginLeft: '0.4rem',
                            color: colors.textMuted,
                            fontWeight: 400,
                            fontSize: '0.7rem',
                          }}>
                            custom
                          </span>
                        )}
                      </label>
                      {isCustom && (
                        <button
                          onClick={() => removeCategory(cat)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: colors.textMuted,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            padding: '0',
                            lineHeight: 1,
                          }}
                          title="Remove category"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <input
                      type="number"
                      min="0"
                      placeholder={avg > 0
                        ? `Avg: ${Math.round(avg).toLocaleString()}`
                        : 'Enter amount'}
                      value={editing[cat] || ''}
                      onChange={e => setEditing({ ...editing, [cat]: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        background: colors.bgInput,
                        color: colors.textPrimary,
                        fontSize: '0.9rem',
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 600,
                        outline: 'none',
                        textAlign: 'right',
                      }}
                    />

                    {/* AI hint — avg spend */}
                    {avg > 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.4rem',
                      }}>
                        <span style={{
                          color: colors.textMuted,
                          fontSize: '0.68rem',
                        }}>
                          3-mo avg: {formatNaira(avg)}
                        </span>
                        {trend !== null && (
                          <span style={{
                            fontSize: '0.68rem',
                            color: trend > 0 ? colors.danger : colors.green,
                            fontWeight: 600,
                          }}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quick set from avg */}
                    {avg > 0 && !editing[cat] && (
                      <button
                        onClick={() => setEditing({
                          ...editing,
                          [cat]: String(Math.round(avg)),
                        })}
                        style={{
                          marginTop: '0.35rem',
                          width: '100%',
                          padding: '0.3rem',
                          background: 'transparent',
                          border: `1px dashed ${colors.borderGreen}`,
                          color: colors.green,
                          borderRadius: '5px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif',
                          transition: 'all 0.2s',
                        }}
                      >
                        Use avg ({formatNaira(avg)})
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}>
              <button
                onClick={saveBudgets}
                disabled={saving}
                style={{
                  padding: '0.8rem 2rem',
                  background: saving ? colors.greenDark : colors.accent,
                  color: colors.accentText,
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : '✓ Save Budget Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TRACK TAB ── */}
      {activeView === 'track' && (
        <div style={cardStyle}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: colors.textPrimary,
            marginBottom: '1.25rem',
          }}>
            Budget vs Actual — {monthLabel}
          </h3>

          {loading ? (
            <div style={{ color: colors.textMuted, textAlign: 'center', padding: '2rem' }}>
              Loading...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {categories
                .filter(cat => budgets[cat] > 0 || actuals[cat] > 0)
                .map(cat => {
                  const budgeted = Number(budgets[cat] || 0)
                  const actual = Number(actuals[cat] || 0)
                  const status = getStatus(budgeted, actual)
                  const pct = budgeted > 0
                    ? Math.min((actual / budgeted) * 100, 100)
                    : 0
                  const overAmount = actual - budgeted

                  return (
                    <div key={cat}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.4rem',
                        flexWrap: 'wrap',
                        gap: '0.25rem',
                      }}>
                        <div>
                          <span style={{
                            color: colors.textPrimary,
                            fontWeight: 600,
                            fontSize: '0.88rem',
                          }}>
                            {cat}
                          </span>
                          {status === 'over' && (
                            <span style={{
                              marginLeft: '0.5rem',
                              color: colors.danger,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}>
                              Over by {formatNaira(overAmount)}
                            </span>
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.82rem',
                        }}>
                          <span style={{ color: colors.textMuted }}>
                            Spent: <strong style={{ color: colors.textPrimary }}>
                              {formatNaira(actual)}
                            </strong>
                          </span>
                          {budgeted > 0 && (
                            <span style={{ color: colors.textMuted }}>
                              of {formatNaira(budgeted)}
                            </span>
                          )}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '5px',
                            background: `${statusConfig[status].color}15`,
                            border: `1px solid ${statusConfig[status].color}30`,
                            color: statusConfig[status].color,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            fontFamily: 'Syne, sans-serif',
                          }}>
                            <div style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '1px',
                              background: statusConfig[status].color,
                            }} />
                            {statusConfig[status].label}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{
                        height: '8px',
                        background: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.06)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}>
                        <div style={{
                          height: '100%',
                          width: budgeted === 0 ? '100%' : `${pct}%`,
                          background: budgeted === 0
                            ? colors.textMuted
                            : statusConfig[status].color,
                          borderRadius: '4px',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>

                      {budgeted === 0 && (
                        <div style={{
                          color: colors.textMuted,
                          fontSize: '0.72rem',
                          marginTop: '0.2rem',
                        }}>
                          No budget set for this category
                        </div>
                      )}
                    </div>
                  )
                })}

              {categories.filter(cat =>
                budgets[cat] > 0 || actuals[cat] > 0
              ).length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: colors.textMuted,
                  padding: '2rem',
                  fontSize: '0.9rem',
                }}>
                  No budget or expenses recorded for {monthLabel}.
                  Go to "Plan Budget" to set your budget.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AI SUGGESTIONS TAB ── */}
      {activeView === 'ai' && (
        <div>
          <div style={{ ...cardStyle, marginBottom: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div>
                <h3 style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: colors.textPrimary,
                  marginBottom: '0.2rem',
                }}>
                  🤖 AI Budget Suggestions
                </h3>
                <p style={{
                  color: colors.textSecondary,
                  fontSize: '0.82rem',
                }}>
                  Based on your 3-month spending history
                </p>
              </div>
              <button
                onClick={getAISuggestions}
                disabled={loadingAI}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: isDark
                    ? 'rgba(124,106,247,0.1)'
                    : 'rgba(91,78,199,0.08)',
                  border: `1px solid ${isDark
                    ? 'rgba(124,106,247,0.3)'
                    : 'rgba(91,78,199,0.2)'}`,
                  color: colors.purple,
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: loadingAI ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {loadingAI ? (
                  <>
                    <span style={{
                      width: '12px', height: '12px',
                      borderRadius: '50%',
                      border: `2px solid ${colors.purple}40`,
                      borderTopColor: colors.purple,
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                    }} />
                    Analyzing...
                  </>
                ) : (
                  <>✦ {aiSuggestions.length > 0 ? 'Refresh' : 'Get Suggestions'}</>
                )}
              </button>
            </div>

            {aiSuggestions.length === 0 && !loadingAI && (
              <div style={{
                background: isDark
                  ? 'rgba(124,106,247,0.04)'
                  : 'rgba(91,78,199,0.03)',
                border: `1px solid ${isDark
                  ? 'rgba(124,106,247,0.1)'
                  : 'rgba(91,78,199,0.1)'}`,
                borderRadius: '10px',
                padding: '1.5rem',
                textAlign: 'center',
                color: colors.textMuted,
                fontSize: '0.88rem',
                lineHeight: 1.6,
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠</div>
                Click "Get Suggestions" and our AI will analyze your spending
                patterns and recommend smart budget amounts for each category.
              </div>
            )}

            {aiSuggestions.map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '1rem',
                background: isDark
                  ? 'rgba(124,106,247,0.04)'
                  : 'rgba(91,78,199,0.03)',
                border: `1px solid ${isDark
                  ? 'rgba(124,106,247,0.12)'
                  : 'rgba(91,78,199,0.1)'}`,
                borderRadius: '10px',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    color: colors.textPrimary,
                    fontSize: '0.88rem',
                    marginBottom: '0.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    {s.category}
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '100px',
                      background: s.priority === 'high'
                        ? `${colors.danger}15`
                        : s.priority === 'medium'
                        ? `${colors.warning}15`
                        : `${colors.green}15`,
                      color: s.priority === 'high'
                        ? colors.danger
                        : s.priority === 'medium'
                        ? colors.warning
                        : colors.green,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      {s.priority}
                    </span>
                  </div>
                  <p style={{
                    color: colors.textSecondary,
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                  }}>
                    {s.suggestion}
                  </p>
                </div>
                <button
                  onClick={() => applySuggestion(s)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    background: colors.accent,
                    color: colors.accentText,
                    border: 'none',
                    borderRadius: '7px',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Apply →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeView === 'history' && (
        <div style={cardStyle}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: colors.textPrimary,
            marginBottom: '1.25rem',
          }}>
            📈 3-Month Spending Breakdown
          </h3>

          {history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: colors.textMuted,
              padding: '2rem',
            }}>
              No expense history yet. Start logging expenses to see trends.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
              }}>
                <thead>
                  <tr>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.6rem 0.75rem',
                      color: colors.textLabel,
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      borderBottom: `1px solid ${colors.border}`,
                    }}>
                      Category
                    </th>
                    {history.map(h => (
                      <th key={h.month} style={{
                        textAlign: 'right',
                        padding: '0.6rem 0.75rem',
                        color: colors.textLabel,
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        borderBottom: `1px solid ${colors.border}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {new Date(h.month + '-01').toLocaleString('en-NG', {
                          month: 'short', year: '2-digit'
                        })}
                      </th>
                    ))}
                    <th style={{
                      textAlign: 'right',
                      padding: '0.6rem 0.75rem',
                      color: colors.textLabel,
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      borderBottom: `1px solid ${colors.border}`,
                    }}>
                      Avg/Month
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories
                    .filter(cat => history.some(h => h.totals[cat] > 0))
                    .map((cat, i) => {
                      const avg = getAvgSpend(cat)
                      const trend = getTrend(cat)
                      return (
                        <tr key={cat} style={{
                          background: i % 2 === 0
                            ? 'transparent'
                            : isDark
                            ? 'rgba(255,255,255,0.02)'
                            : 'rgba(0,0,0,0.02)',
                        }}>
                          <td style={{
                            padding: '0.7rem 0.75rem',
                            color: colors.textPrimary,
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}>
                            {cat}
                            {trend !== null && Math.abs(trend) > 5 && (
                              <span style={{
                                color: trend > 0 ? colors.danger : colors.green,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                              }}>
                                {trend > 0 ? '↑' : '↓'}{Math.abs(trend).toFixed(0)}%
                              </span>
                            )}
                          </td>
                          {history.map(h => (
                            <td key={h.month} style={{
                              padding: '0.7rem 0.75rem',
                              textAlign: 'right',
                              color: h.totals[cat]
                                ? colors.textPrimary
                                : colors.textMuted,
                              fontSize: '0.85rem',
                            }}>
                              {h.totals[cat]
                                ? formatNaira(h.totals[cat])
                                : '—'}
                            </td>
                          ))}
                          <td style={{
                            padding: '0.7rem 0.75rem',
                            textAlign: 'right',
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            color: colors.accent,
                            fontSize: '0.85rem',
                          }}>
                            {avg > 0 ? formatNaira(avg) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  )
}

export default Budget