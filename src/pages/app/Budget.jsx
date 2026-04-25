import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

const CATEGORIES = [
  'Data & Internet',
  'Transport',
  'Stock/Inventory',
  'Rent',
  'Salary',
  'Marketing',
  'Equipment',
  'Food & Welfare',
  'Utilities',
  'Other',
]

function Budget() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [budgets, setBudgets] = useState([])
  const [actuals, setActuals] = useState({})
  const [editing, setEditing] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalBudget, setTotalBudget] = useState(0)
  const [totalActual, setTotalActual] = useState(0)
  const [showTip, setShowTip] = useState(true)

  useEffect(() => {
    if (user) loadBudgetData()
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

    const budgetMap = {}
    budgetData?.forEach(b => {
      budgetMap[b.category] = b.budgeted
    })

    const actualMap = {}
    expenseData?.forEach(e => {
      actualMap[e.category] = (actualMap[e.category] || 0) + Number(e.amount)
    })

    const editMap = {}
    CATEGORIES.forEach(cat => {
      editMap[cat] = budgetMap[cat] || ''
    })

    setBudgets(budgetMap)
    setActuals(actualMap)
    setEditing(editMap)

    const tb = Object.values(budgetMap).reduce((a, b) => a + Number(b), 0)
    const ta = Object.values(actualMap).reduce((a, b) => a + Number(b), 0)
    setTotalBudget(tb)
    setTotalActual(ta)
    setLoading(false)
  }

  const saveBudgets = async () => {
    setSaving(true)
    const upserts = CATEGORIES
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
        .upsert(upserts, {
          onConflict: 'user_id,month,category',
        })
    }

    await loadBudgetData()
    setSaving(false)
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
    good: {
      color: colors.green,
      bg: isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)',
      label: 'On track',
    },
    warning: {
      color: colors.warning,
      bg: isDark ? 'rgba(245,166,35,0.08)' : 'rgba(184,122,0,0.06)',
      label: 'Getting close',
    },
    over: {
      color: colors.danger,
      bg: isDark ? 'rgba(255,80,80,0.08)' : 'rgba(204,34,0,0.06)',
      label: 'Over budget',
    },
    unset: {
      color: colors.textMuted,
      bg: 'transparent',
      label: 'No budget set',
    },
  }

  const monthLabel = new Date(selectedMonth + '-01')
    .toLocaleString('en-NG', { month: 'long', year: 'numeric' })

  const overallPct = totalBudget > 0
    ? Math.min((totalActual / totalBudget) * 100, 100)
    : 0

  const overallStatus = totalBudget === 0
    ? 'unset'
    : totalActual > totalBudget
    ? 'over'
    : totalActual > totalBudget * 0.8
    ? 'warning'
    : 'good'

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
            marginBottom: '0.3rem',
          }}>
            Budget Planner
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
            Set spending limits and track them against actual expenses
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

      {/* Tip Banner */}
      {showTip && (
        <div style={{
          background: isDark
            ? 'rgba(124,106,247,0.06)'
            : 'rgba(91,78,199,0.05)',
          border: `1px solid ${isDark
            ? 'rgba(124,106,247,0.2)'
            : 'rgba(91,78,199,0.15)'}`,
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>💡</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              color: colors.textPrimary,
              fontSize: '0.88rem',
              marginBottom: '0.2rem',
            }}>
              How Budget Planner works
            </div>
            <p style={{
              color: colors.textSecondary,
              fontSize: '0.82rem',
              lineHeight: 1.6,
            }}>
              Set a spending limit for each category. As you log expenses,
              StackPay tracks them against your budget in real time and alerts
              you when you're getting close or over.
            </p>
          </div>
          <button
            onClick={() => setShowTip(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textMuted,
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Overall Summary Card */}
      <div style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div>
            <div style={{
              color: colors.textLabel,
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}>
              {monthLabel} — Overall Budget
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.6rem',
              color: colors.textPrimary,
              letterSpacing: '-0.5px',
            }}>
              {formatNaira(totalActual)}
              <span style={{
                color: colors.textMuted,
                fontSize: '1rem',
                fontWeight: 400,
              }}>
                {' '}/ {formatNaira(totalBudget)}
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            background: statusConfig[overallStatus].bg,
            border: `1px solid ${statusConfig[overallStatus].color}30`,
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              background: statusConfig[overallStatus].color,
            }} />
            <span style={{
              color: statusConfig[overallStatus].color,
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.82rem',
            }}>
              {overallStatus === 'over'
                ? `Over by ${formatNaira(totalActual - totalBudget)}`
                : overallStatus === 'warning'
                ? `${(100 - overallPct).toFixed(0)}% remaining`
                : overallStatus === 'good'
                ? `${(100 - overallPct).toFixed(0)}% remaining`
                : 'No budget set'}
            </span>
          </div>
        </div>

        {/* Overall progress bar */}
        {totalBudget > 0 && (
          <div>
            <div style={{
              height: '10px',
              background: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.06)',
              borderRadius: '5px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${overallPct}%`,
                background: statusConfig[overallStatus].color,
                borderRadius: '5px',
                transition: 'width 0.8s ease',
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.4rem',
            }}>
              <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                {overallPct.toFixed(0)}% used
              </span>
              <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                {formatNaira(Math.max(totalBudget - totalActual, 0))} left
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Category Budget Table */}
      <div style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: '1.5rem',
      }}>

        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 130px 130px 120px',
          gap: '0.5rem',
          padding: '0.85rem 1.5rem',
          borderBottom: `1px solid ${colors.border}`,
          background: isDark
            ? 'rgba(255,255,255,0.02)'
            : 'rgba(0,0,0,0.02)',
        }}>
          {['Category', 'Budgeted (₦)', 'Actual (₦)', 'Status'].map((h, i) => (
            <div key={i} style={{
              color: colors.textLabel,
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              textAlign: i > 0 ? 'right' : 'left',
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Category Rows */}
        {loading ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: colors.textMuted,
          }}>
            Loading budget data...
          </div>
        ) : (
          CATEGORIES.map((cat, i) => {
            const budgeted = Number(budgets[cat] || 0)
            const actual = Number(actuals[cat] || 0)
            const status = getStatus(budgeted, actual)
            const pct = budgeted > 0
              ? Math.min((actual / budgeted) * 100, 100)
              : 0

            return (
              <div
                key={cat}
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: i < CATEGORIES.length - 1
                    ? `1px solid ${colors.border}`
                    : 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(0,0,0,0.02)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 130px 130px 120px',
                  gap: '0.5rem',
                  alignItems: 'center',
                  marginBottom: budgeted > 0 ? '0.5rem' : 0,
                }}>

                  {/* Category name */}
                  <div style={{
                    color: colors.textPrimary,
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}>
                    {cat}
                  </div>

                  {/* Budget input */}
                  <div style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={editing[cat] || ''}
                      onChange={e => setEditing({
                        ...editing,
                        [cat]: e.target.value,
                      })}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        background: colors.bgInput,
                        color: colors.textPrimary,
                        fontSize: '0.85rem',
                        fontFamily: 'DM Sans, sans-serif',
                        outline: 'none',
                        textAlign: 'right',
                      }}
                    />
                  </div>

                  {/* Actual amount */}
                  <div style={{
                    textAlign: 'right',
                    color: actual > 0 ? colors.textPrimary : colors.textMuted,
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: actual > 0 ? 700 : 400,
                    fontSize: '0.88rem',
                  }}>
                    {actual > 0 ? formatNaira(actual) : '—'}
                  </div>

                  {/* Status badge */}
                  <div style={{ textAlign: 'right' }}>
                    {budgeted > 0 ? (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        background: statusConfig[status].bg,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily: 'Syne, sans-serif',
                        color: statusConfig[status].color,
                        border: `1px solid ${statusConfig[status].color}30`,
                      }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '2px',
                          background: statusConfig[status].color,
                        }} />
                        {status === 'over'
                          ? `+${formatNaira(actual - budgeted)}`
                          : statusConfig[status].label}
                      </div>
                    ) : (
                      <span style={{
                        color: colors.textMuted,
                        fontSize: '0.75rem',
                      }}>
                        Not set
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {budgeted > 0 && (
                  <div style={{
                    height: '4px',
                    background: isDark
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.06)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: statusConfig[status].color,
                      borderRadius: '2px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Save Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <p style={{
          color: colors.textMuted,
          fontSize: '0.82rem',
          alignSelf: 'center',
          flex: 1,
        }}>
          Changes are saved per month. Switch months to plan ahead.
        </p>
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
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            if (!saving) e.currentTarget.style.opacity = '0.9'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          {saving ? 'Saving...' : '✓ Save Budget'}
        </button>
      </div>

    </AppLayout>
  )
}

export default Budget