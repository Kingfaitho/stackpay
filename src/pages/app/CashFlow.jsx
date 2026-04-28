import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts'

// ─── Mini stat card — must be OUTSIDE CashFlow to avoid hooks-in-map error ───
function MiniStatCard({ icon, label, value, short, color, colors, isDark }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${hovered ? colors.borderGreen : colors.border}`,
        borderRadius: '14px',
        padding: '1.1rem',
        boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'border-color 0.2s',
        position: 'relative',
        cursor: 'default',
        overflow: 'visible',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{icon}</div>
      <div style={{
        color: colors.textLabel,
        fontSize: '0.68rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: '0.3rem',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: '1rem',
        color,
      }}>
        {hovered ? value : short}
      </div>
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: colors.bgCard2,
          border: `1px solid ${colors.borderGreen}`,
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          zIndex: 20,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
            color,
          }}>
            {value}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Custom chart tooltip ────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, colors, formatNaira }) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0]?.payload
  return (
    <div style={{
      background: colors.bgCard2,
      border: `1px solid ${colors.borderGreen}`,
      borderRadius: '10px',
      padding: '0.85rem 1rem',
      fontSize: '0.82rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      pointerEvents: 'none',
    }}>
      <div style={{
        color: colors.textMuted,
        marginBottom: '0.4rem',
        fontWeight: 600,
      }}>
        {label} · Day {data?.day}
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: '1rem',
        color: data?.isCritical ? colors.danger : colors.green,
        marginBottom: '0.2rem',
      }}>
        {formatNaira(data?.balance)}
      </div>
      {data?.inflow > 0 && (
        <div style={{ color: colors.green, fontSize: '0.75rem' }}>
          + {formatNaira(data?.inflow)} expected
        </div>
      )}
      {data?.isCritical && (
        <div style={{
          color: colors.danger,
          fontWeight: 700,
          marginTop: '0.3rem',
          fontSize: '0.75rem',
        }}>
          ⚠️ Below buffer
        </div>
      )}
    </div>
  )
}

// ─── Main CashFlow component ─────────────────────────────────────────────────
function CashFlow() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()

  const [loading, setLoading] = useState(true)
  const [constraints, setConstraints] = useState(null)
  const [showSetup, setShowSetup] = useState(false)
  const [setupForm, setSetupForm] = useState({
    minimum_cash_buffer: '',
    risk_tolerance: 'moderate',
    monthly_fixed_costs: [],
  })
  const [newFixedCost, setNewFixedCost] = useState({ label: '', amount: '' })
  const [forecast, setForecast] = useState(null)
  const [savingSetup, setSavingSetup] = useState(false)
  const [currentCash, setCurrentCash] = useState(0)
  const [whatIfAmount, setWhatIfAmount] = useState('')
  const [whatIfResult, setWhatIfResult] = useState(null)
  const [activeView, setActiveView] = useState('chart')
  const [aiAdvice, setAiAdvice] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  // ─── Load all data ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: constraintData },
        { data: invoices },
        { data: expenses },
        { data: clientBehavior },
      ] = await Promise.all([
        supabase.from('business_constraints').select('*').eq('user_id', user.id).single(),
        supabase.from('invoices').select('*, clients(id, name)').eq('user_id', user.id),
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('client_payment_behavior').select('*').eq('user_id', user.id),
      ])

      if (constraintData) {
        setConstraints(constraintData)
        setSetupForm({
          minimum_cash_buffer: constraintData.minimum_cash_buffer || '',
          risk_tolerance: constraintData.risk_tolerance || 'moderate',
          monthly_fixed_costs: constraintData.monthly_fixed_costs || [],
        })
        setShowSetup(false)
      } else {
        setConstraints(null)
        setShowSetup(true)
      }

      const totalPaid = (invoices || [])
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.total), 0)
      const totalExpenses = (expenses || [])
        .reduce((sum, e) => sum + Number(e.amount), 0)
      const cashPosition = totalPaid - totalExpenses
      setCurrentCash(cashPosition)

      if (constraintData) {
        buildForecast(
          invoices || [],
          expenses || [],
          constraintData,
          clientBehavior || [],
          cashPosition
        )
      }
    } catch (err) {
      console.error('CashFlow loadData error:', err)
      setShowSetup(true)
    }
    setLoading(false)
  }, [user])

  // ─── Build 90-day forecast ──────────────────────────────────────────────
  const buildForecast = (invoices, expenses, con, clientBehavior, cashPosition) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const delayMap = {}
    clientBehavior.forEach(cb => {
      delayMap[cb.client_id] = cb.average_payment_delay_days || 0
    })

    const unpaidInvoices = invoices.filter(i => i.status === 'unpaid')
    const fixedMonthly = (con.monthly_fixed_costs || [])
      .reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const fixedDaily = fixedMonthly / 30
    const minimumBuffer = Number(con.minimum_cash_buffer || 0)

    let runningBalance = cashPosition
    let runwayDays = null
    const allDays = []
    const chartData = []

    for (let d = 0; d <= 90; d++) {
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      const dateStr = date.toISOString().split('T')[0]

      let dayInflow = 0
      const inflows = []

      unpaidInvoices.forEach(inv => {
        const dueDate = inv.due_date
          ? new Date(inv.due_date)
          : new Date(inv.created_at)
        const delay = delayMap[inv.client_id] || 0
        const expectedDate = new Date(dueDate)
        expectedDate.setDate(expectedDate.getDate() + delay)
        expectedDate.setHours(0, 0, 0, 0)

        if (expectedDate.toISOString().split('T')[0] === dateStr) {
          dayInflow += Number(inv.total)
          inflows.push({
            label: inv.clients?.name || 'Client',
            amount: Number(inv.total),
            invoiceNum: inv.invoice_number,
          })
        }
      })

      runningBalance = runningBalance + dayInflow - fixedDaily

      if (runningBalance <= minimumBuffer && runwayDays === null && d > 0) {
        runwayDays = d
      }

      // Chart every 3 days
      if (d % 3 === 0 || inflows.length > 0 || d === 90) {
        chartData.push({
          day: d,
          date: date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
          balance: Math.round(runningBalance),
          inflow: Math.round(dayInflow),
          buffer: minimumBuffer,
          isCritical: minimumBuffer > 0 && runningBalance <= minimumBuffer,
        })
      }

      // Timeline key dates
      const isKey = d === 0 || d === 7 || d === 14 || d === 30 ||
        d === 60 || d === 90 || inflows.length > 0 ||
        (minimumBuffer > 0 && runningBalance <= minimumBuffer * 1.3)

      if (isKey) {
        allDays.push({
          day: d,
          date: dateStr,
          balance: runningBalance,
          inflow: dayInflow,
          inflows,
          isCritical: minimumBuffer > 0 && runningBalance <= minimumBuffer,
          isWarning: minimumBuffer > 0 && runningBalance <= minimumBuffer * 1.5,
        })
      }
    }

    setForecast({
      days: allDays,
      chartData,
      runwayDays,
      minimumBuffer,
      unpaidCount: unpaidInvoices.length,
      unpaidTotal: unpaidInvoices.reduce((s, i) => s + Number(i.total), 0),
      expectedIn30: allDays
        .filter(d => d.day <= 30)
        .reduce((s, d) => s + d.inflow, 0),
    })
  }

  // ─── What-If simulation ──────────────────────────────────────────────────
  const runWhatIf = () => {
    if (!whatIfAmount || !forecast) return
    const extra = Number(whatIfAmount)
    const con = constraints || { minimum_cash_buffer: 0, monthly_fixed_costs: [] }
    const fixedMonthly = (con.monthly_fixed_costs || [])
      .reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const fixedDaily = fixedMonthly / 30
    const minimumBuffer = Number(con.minimum_cash_buffer || 0)

    let balance = currentCash + extra
    let newRunway = null
    for (let d = 1; d <= 90; d++) {
      balance -= fixedDaily
      if (balance <= minimumBuffer && newRunway === null) {
        newRunway = d
        break
      }
    }

    const oldRunway = forecast.runwayDays
    const diff = (newRunway === null ? 90 : newRunway) - (oldRunway === null ? 90 : oldRunway)

    setWhatIfResult({
      extra,
      newRunway,
      oldRunway,
      improvement: diff,
    })
  }

  // ─── AI Cash Flow Advice (OpenRouter — browser safe) ─────────────────────
  const getAIAdvice = async () => {
    if (!forecast) return
    setLoadingAI(true)
    setAiAdvice('')

    const prompt = `You are a financial advisor for Nigerian small businesses. Be direct and specific.

Business cash position: NGN ${currentCash.toLocaleString()}
Runway: ${forecast.runwayDays === null ? '90+ days' : `${forecast.runwayDays} days`}
Unpaid invoices: ${forecast.unpaidCount} worth NGN ${forecast.unpaidTotal.toLocaleString()}
Expected in 30 days: NGN ${forecast.expectedIn30.toLocaleString()}
Minimum buffer: NGN ${forecast.minimumBuffer.toLocaleString()}

Give 3 specific actions this business owner should take THIS WEEK about their cash flow.
Each action max 2 sentences. Reference their actual numbers.
End with one sentence of encouragement.
Total under 120 words.`

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'StackPay',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content
      setAiAdvice(text || 'Unable to generate advice. Please try again.')
    } catch (err) {
      console.error('AI advice error:', err)
      setAiAdvice('AI advisor is temporarily unavailable. Please try again in a moment.')
    }
    setLoadingAI(false)
  }

  // ─── Save constraints ────────────────────────────────────────────────────
  const saveConstraints = async () => {
    setSavingSetup(true)
    try {
      const { error } = await supabase
        .from('business_constraints')
        .upsert({
          user_id: user.id,
          minimum_cash_buffer: Number(setupForm.minimum_cash_buffer) || 0,
          risk_tolerance: setupForm.risk_tolerance,
          monthly_fixed_costs: setupForm.monthly_fixed_costs,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Save constraints error:', error)
        alert(`Failed to save: ${error.message}. Please try again.`)
      } else {
        setShowSetup(false)
        await loadData()
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('An unexpected error occurred. Please try again.')
    }
    setSavingSetup(false)
  }

  // ─── Fixed cost helpers ──────────────────────────────────────────────────
  const addFixedCost = () => {
    if (!newFixedCost.label || !newFixedCost.amount) return
    setSetupForm(prev => ({
      ...prev,
      monthly_fixed_costs: [
        ...prev.monthly_fixed_costs,
        { label: newFixedCost.label, amount: Number(newFixedCost.amount) },
      ],
    }))
    setNewFixedCost({ label: '', amount: '' })
  }

  const removeFixedCost = (index) => {
    setSetupForm(prev => ({
      ...prev,
      monthly_fixed_costs: prev.monthly_fixed_costs.filter((_, i) => i !== index),
    }))
  }

  // ─── Formatters ──────────────────────────────────────────────────────────
  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount || 0)

  const formatShort = (amount) => {
    const n = Math.abs(Number(amount || 0))
    if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
    return `₦${n.toLocaleString()}`
  }

  // ─── Shared styles ───────────────────────────────────────────────────────
  const card = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: '1.25rem',
  }

  const inp = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    background: colors.bgInput,
    color: colors.textPrimary,
    fontSize: '0.9rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '0.75rem',
    boxSizing: 'border-box',
  }

  const lbl = {
    color: colors.textLabel,
    fontSize: '0.78rem',
    fontWeight: 600,
    display: 'block',
    marginBottom: '0.4rem',
    letterSpacing: '0.3px',
  }

  const runwayColor = !forecast
    ? colors.green
    : forecast.runwayDays === null
    ? colors.green
    : forecast.runwayDays <= 30
    ? colors.danger
    : forecast.runwayDays <= 60
    ? colors.warning
    : colors.green

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <AppLayout>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
          color: colors.textPrimary,
          marginBottom: '0.3rem',
        }}>
          💧 Cash Flow & Runway
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
          Know exactly how long your business can survive — and what money is coming next.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          ...card,
          textAlign: 'center',
          padding: '3rem',
          color: colors.textMuted,
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: `3px solid ${colors.borderGreen}`,
            borderTopColor: colors.green,
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          Calculating your cash flow...
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}

      {/* Setup prompt — no constraints configured yet */}
      {!constraints && !loading && !showSetup && (
        <div style={{
          ...card,
          background: isDark ? 'rgba(0,197,102,0.04)' : 'rgba(0,120,60,0.03)',
          border: `1px solid ${colors.borderGreen}`,
          textAlign: 'center',
          padding: '2.5rem',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.2rem',
            color: colors.textPrimary,
            marginBottom: '0.75rem',
          }}>
            Set up your Financial Constraints
          </h2>
          <p style={{
            color: colors.textSecondary,
            fontSize: '0.9rem',
            lineHeight: 1.7,
            maxWidth: '420px',
            margin: '0 auto 1.5rem',
          }}>
            Tell StackPay your minimum cash buffer and fixed monthly costs.
            This is what makes forecasting accurate — not generic.
          </p>
          <button
            onClick={() => setShowSetup(true)}
            style={{
              padding: '0.85rem 2rem',
              background: colors.accent,
              color: colors.accentText,
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Configure Now →
          </button>
        </div>
      )}

      {/* Setup form */}
      {showSetup && !loading && (
        <div style={{ ...card, border: `1px solid ${colors.borderGreen}` }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              color: colors.textPrimary,
            }}>
              ⚙️ Financial Constraints
            </h3>
            {constraints && (
              <button
                onClick={() => setShowSetup(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Minimum buffer */}
          <label style={lbl}>MINIMUM CASH BUFFER (NGN)</label>
          <input
            id="min-buffer"
            name="min-buffer"
            type="number"
            placeholder="e.g. 200000 — your safety net"
            value={setupForm.minimum_cash_buffer}
            onChange={e => setSetupForm(prev => ({
              ...prev,
              minimum_cash_buffer: e.target.value,
            }))}
            style={inp}
          />
          <p style={{
            color: colors.textMuted,
            fontSize: '0.75rem',
            marginTop: '-0.5rem',
            marginBottom: '1rem',
          }}>
            StackPay alerts you before cash drops below this amount.
          </p>

          {/* Risk tolerance */}
          <label style={lbl}>RISK TOLERANCE</label>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
          }}>
            {[
              { value: 'conservative', label: '🛡️ Conservative', desc: 'Extra cautious' },
              { value: 'moderate', label: '⚖️ Moderate', desc: 'Balanced' },
              { value: 'aggressive', label: '🚀 Aggressive', desc: 'Growth focused' },
            ].map(r => (
              <div
                key={r.value}
                onClick={() => setSetupForm(prev => ({
                  ...prev, risk_tolerance: r.value,
                }))}
                style={{
                  flex: 1,
                  minWidth: '110px',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: `1px solid ${setupForm.risk_tolerance === r.value
                    ? colors.borderGreen
                    : colors.border}`,
                  background: setupForm.risk_tolerance === r.value
                    ? isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.05)'
                    : colors.bgCard2,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '1rem', color: colors.textPrimary, marginBottom: '0.2rem' }}>
                  {r.label}
                </div>
                <div style={{ color: colors.textMuted, fontSize: '0.7rem' }}>
                  {r.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Fixed monthly costs */}
          <label style={lbl}>FIXED MONTHLY COSTS</label>

          {setupForm.monthly_fixed_costs.map((cost, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.65rem 1rem',
              background: colors.bgCard2,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              marginBottom: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  color: colors.textPrimary,
                  fontWeight: 600,
                  fontSize: '0.88rem',
                }}>
                  {cost.label}
                </span>
                <span style={{
                  color: colors.green,
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}>
                  {formatNaira(cost.amount)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFixedCost(i)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.danger,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            </div>
          ))}

          {/* Add cost row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            alignItems: 'start',
          }}>
            <input
              id="cost-label"
              name="cost-label"
              type="text"
              placeholder="e.g. Office Rent"
              value={newFixedCost.label}
              onChange={e => setNewFixedCost(prev => ({ ...prev, label: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addFixedCost()}
              style={{ ...inp, marginBottom: 0 }}
            />
            <input
              id="cost-amount"
              name="cost-amount"
              type="number"
              placeholder="Amount (NGN)"
              value={newFixedCost.amount}
              onChange={e => setNewFixedCost(prev => ({ ...prev, amount: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addFixedCost()}
              style={{ ...inp, marginBottom: 0 }}
            />
            <button
              type="button"
              onClick={addFixedCost}
              style={{
                padding: '0.75rem 1rem',
                background: colors.accent,
                color: colors.accentText,
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                height: '44px',
              }}
            >
              + Add
            </button>
          </div>

          <button
            type="button"
            onClick={saveConstraints}
            disabled={savingSetup}
            style={{
              width: '100%',
              padding: '0.9rem',
              background: savingSetup ? colors.greenDark : colors.accent,
              color: colors.accentText,
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: savingSetup ? 'not-allowed' : 'pointer',
              opacity: savingSetup ? 0.7 : 1,
            }}
          >
            {savingSetup ? 'Saving...' : '✓ Save & Generate Forecast'}
          </button>
        </div>
      )}

      {/* Forecast display */}
      {forecast && !showSetup && !loading && (
        <>
          {/* Runway hero card */}
          <div style={{
            ...card,
            background: forecast.runwayDays !== null && forecast.runwayDays <= 30
              ? isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)'
              : forecast.runwayDays !== null && forecast.runwayDays <= 60
              ? isDark ? 'rgba(245,166,35,0.06)' : 'rgba(184,122,0,0.04)'
              : isDark ? 'rgba(0,197,102,0.04)' : 'rgba(0,120,60,0.03)',
            border: `1px solid ${runwayColor}40`,
            padding: '2rem',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: '1.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>

              {/* Circular gauge */}
              <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
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
                    stroke={runwayColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={
                      2 * Math.PI * 48 * (
                        1 - Math.min(
                          (forecast.runwayDays === null ? 90 : forecast.runwayDays) / 90,
                          1
                        )
                      )
                    }
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
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: forecast.runwayDays === null ? '1.2rem' : '1.7rem',
                    color: runwayColor,
                    lineHeight: 1,
                  }}>
                    {forecast.runwayDays === null ? '90+' : forecast.runwayDays}
                  </div>
                  <div style={{
                    color: colors.textMuted,
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginTop: '2px',
                  }}>
                    days
                  </div>
                </div>
              </div>

              {/* Text */}
              <div>
                <div style={{
                  color: colors.textLabel,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem',
                }}>
                  Business Runway
                </div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
                  color: runwayColor,
                  letterSpacing: '-0.5px',
                  lineHeight: 1.15,
                  marginBottom: '0.4rem',
                }}>
                  {forecast.runwayDays === null
                    ? 'No cash crunch in 90 days'
                    : `Buffer breached in ${forecast.runwayDays} days`}
                </div>
                <div style={{ color: colors.textSecondary, fontSize: '0.82rem' }}>
                  {forecast.runwayDays === null
                    ? 'Your business is financially healthy for the next 90 days.'
                    : `Your ₦${Number(forecast.minimumBuffer).toLocaleString()} safety buffer is at risk. Take action now.`}
                </div>
                {forecast.runwayDays !== null && forecast.runwayDays <= 30 && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.6rem 1rem',
                    background: `${colors.danger}10`,
                    border: `1px solid ${colors.danger}25`,
                    borderRadius: '8px',
                    color: colors.danger,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}>
                    🚨 Chase unpaid invoices or reduce expenses immediately.
                  </div>
                )}
              </div>

              {/* Current position */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  color: colors.textLabel,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  marginBottom: '0.3rem',
                }}>
                  Current Position
                </div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  color: currentCash >= 0 ? colors.green : colors.danger,
                }}>
                  {formatShort(currentCash)}
                </div>
                <div style={{
                  color: colors.textMuted,
                  fontSize: '0.68rem',
                  marginTop: '0.15rem',
                }}>
                  {formatNaira(currentCash)}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSetup(true)}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.textMuted,
                    borderRadius: '7px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 600,
                    display: 'block',
                    width: '100%',
                  }}
                >
                  ⚙️ Edit
                </button>
              </div>
            </div>
          </div>

          {/* Mini stat cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1.25rem',
          }}>
            {[
              {
                icon: '📥',
                label: 'Expected (30d)',
                value: formatNaira(forecast.expectedIn30),
                short: formatShort(forecast.expectedIn30),
                color: colors.green,
              },
              {
                icon: '⏳',
                label: 'Unpaid Value',
                value: formatNaira(forecast.unpaidTotal),
                short: formatShort(forecast.unpaidTotal),
                color: colors.warning,
              },
              {
                icon: '📋',
                label: 'Awaiting',
                value: `${forecast.unpaidCount} invoice${forecast.unpaidCount !== 1 ? 's' : ''}`,
                short: `${forecast.unpaidCount}`,
                color: colors.textPrimary,
              },
              {
                icon: '🛡️',
                label: 'Min Buffer',
                value: formatNaira(forecast.minimumBuffer),
                short: formatShort(forecast.minimumBuffer),
                color: colors.purple,
              },
            ].map((item, i) => (
              <MiniStatCard
                key={i}
                {...item}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </div>

          {/* View tabs */}
          <div style={{
            display: 'flex',
            gap: 0,
            marginBottom: '1.25rem',
            background: colors.bgCard2,
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            padding: '4px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}>
            {[
              { id: 'chart', label: '📈 Chart' },
              { id: 'timeline', label: '📅 Timeline' },
              { id: 'whatif', label: '🔮 What-If' },
              { id: 'ai', label: '🤖 AI Advice' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeView === tab.id
                    ? colors.bgCard
                    : 'transparent',
                  color: activeView === tab.id
                    ? colors.textPrimary
                    : colors.textMuted,
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: activeView === tab.id ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  boxShadow: activeView === tab.id && !isDark
                    ? '0 1px 4px rgba(0,0,0,0.08)'
                    : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* CHART TAB */}
          {activeView === 'chart' && (
            <div style={card}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: colors.textPrimary,
                marginBottom: '0.3rem',
              }}>
                90-Day Cash Balance Projection
              </h3>
              <p style={{
                color: colors.textMuted,
                fontSize: '0.78rem',
                marginBottom: '1.25rem',
              }}>
                The curve shows your projected cash balance. Red dashed line = your minimum buffer.
              </p>

              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={forecast.chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={colors.green}
                        stopOpacity={isDark ? 0.2 : 0.12}
                      />
                      <stop offset="95%" stopColor={colors.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'DM Sans' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: colors.textMuted, fontSize: 10, fontFamily: 'DM Sans' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => formatShort(v)}
                    width={52}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        colors={colors}
                        formatNaira={formatNaira}
                      />
                    }
                  />
                  {forecast.minimumBuffer > 0 && (
                    <ReferenceLine
                      y={forecast.minimumBuffer}
                      stroke={colors.danger}
                      strokeDasharray="6 3"
                      strokeWidth={1.5}
                      label={{
                        value: `Buffer ₦${formatShort(forecast.minimumBuffer)}`,
                        fill: colors.danger,
                        fontSize: 9,
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        position: 'right',
                      }}
                    />
                  )}
                  <ReferenceLine
                    y={0}
                    stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}
                    strokeWidth={1}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={colors.green}
                    strokeWidth={2.5}
                    fill="url(#cashGrad)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: colors.green,
                      stroke: colors.bgCard,
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div style={{
                display: 'flex',
                gap: '1.25rem',
                justifyContent: 'center',
                marginTop: '0.75rem',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.72rem',
                  color: colors.textMuted,
                }}>
                  <div style={{
                    width: '16px',
                    height: '3px',
                    background: colors.green,
                    borderRadius: '2px',
                  }} />
                  Cash Balance
                </div>
                {forecast.minimumBuffer > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.72rem',
                    color: colors.textMuted,
                  }}>
                    <div style={{
                      width: '16px',
                      height: '0',
                      borderTop: `2px dashed ${colors.danger}`,
                    }} />
                    Min Buffer
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeView === 'timeline' && (
            <div style={card}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: colors.textPrimary,
                marginBottom: '1.25rem',
              }}>
                Key Events Timeline
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {forecast.days.slice(0, 15).map((day, i) => {
                  const isToday = day.day === 0
                  const hasInflow = day.inflow > 0

                  return (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: day.isCritical
                        ? isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)'
                        : day.isWarning
                        ? isDark ? 'rgba(245,166,35,0.06)' : 'rgba(184,122,0,0.04)'
                        : isToday
                        ? isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.04)'
                        : 'transparent',
                      border: `1px solid ${
                        day.isCritical ? `${colors.danger}30`
                        : day.isWarning ? `${colors.warning}30`
                        : isToday ? colors.borderGreen
                        : colors.border}`,
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ width: '58px', flexShrink: 0 }}>
                        <div style={{
                          fontFamily: 'Syne, sans-serif',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          color: isToday ? colors.green : colors.textMuted,
                        }}>
                          {isToday ? 'TODAY' : `Day ${day.day}`}
                        </div>
                        <div style={{ color: colors.textMuted, fontSize: '0.62rem' }}>
                          {new Date(day.date).toLocaleDateString('en-NG', {
                            month: 'short', day: 'numeric',
                          })}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'Syne, sans-serif',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          color: day.isCritical
                            ? colors.danger
                            : day.balance >= 0
                            ? colors.textPrimary
                            : colors.danger,
                          marginBottom: hasInflow ? '0.15rem' : 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {formatNaira(day.balance)}
                        </div>
                        {hasInflow && (
                          <div style={{
                            color: colors.green,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            + {formatNaira(day.inflow)} expected
                            {day.inflows.slice(0, 2).map(inf => ` (${inf.label})`).join('')}
                          </div>
                        )}
                        {day.isCritical && (
                          <div style={{ color: colors.danger, fontSize: '0.7rem', fontWeight: 700 }}>
                            ⚠️ Below minimum buffer
                          </div>
                        )}
                      </div>

                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: day.isCritical
                          ? colors.danger
                          : day.isWarning
                          ? colors.warning
                          : colors.green,
                        flexShrink: 0,
                      }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* WHAT-IF TAB */}
          {activeView === 'whatif' && (
            <div style={card}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: colors.textPrimary,
                marginBottom: '0.3rem',
              }}>
                🔮 What-If Simulator
              </h3>
              <p style={{
                color: colors.textMuted,
                fontSize: '0.78rem',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}>
                See how collecting a payment today changes your runway instantly.
              </p>

              <label style={lbl}>IF I COLLECT THIS AMOUNT TODAY (NGN)</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  id="whatif-amount"
                  name="whatif-amount"
                  type="number"
                  placeholder="e.g. 500000"
                  value={whatIfAmount}
                  onChange={e => {
                    setWhatIfAmount(e.target.value)
                    setWhatIfResult(null)
                  }}
                  onKeyDown={e => e.key === 'Enter' && runWhatIf()}
                  style={{ ...inp, flex: 1, minWidth: '180px', marginBottom: 0 }}
                />
                <button
                  type="button"
                  onClick={runWhatIf}
                  disabled={!whatIfAmount}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: whatIfAmount ? colors.accent : colors.bgInput,
                    color: whatIfAmount ? colors.accentText : colors.textMuted,
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: whatIfAmount ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  Simulate →
                </button>
              </div>

              {/* Quick amounts */}
              <div style={{
                display: 'flex',
                gap: '0.4rem',
                flexWrap: 'wrap',
                marginBottom: '1.25rem',
                alignItems: 'center',
              }}>
                <span style={{ color: colors.textMuted, fontSize: '0.72rem', flexShrink: 0 }}>
                  Quick:
                </span>
                {[50000, 100000, 250000, 500000, 1000000].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setWhatIfAmount(String(amount))
                      setWhatIfResult(null)
                    }}
                    style={{
                      padding: '0.3rem 0.6rem',
                      background: colors.bgCard2,
                      border: `1px solid ${colors.border}`,
                      color: colors.textSecondary,
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = colors.borderGreen
                      e.currentTarget.style.color = colors.green
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.color = colors.textSecondary
                    }}
                  >
                    {formatShort(amount)}
                  </button>
                ))}
              </div>

              {/* Result */}
              {whatIfResult && (
                <div style={{
                  background: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.04)',
                  border: `1px solid ${colors.borderGreen}`,
                  borderRadius: '14px',
                  padding: '1.5rem',
                }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: colors.textPrimary,
                    marginBottom: '1rem',
                  }}>
                    If you collect {formatNaira(whatIfResult.extra)} today:
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}>
                    <div style={{
                      background: colors.bgCard2,
                      borderRadius: '10px',
                      padding: '1rem',
                      textAlign: 'center',
                    }}>
                      <div style={{ color: colors.textMuted, fontSize: '0.7rem', marginBottom: '0.3rem' }}>
                        Current Runway
                      </div>
                      <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 800,
                        fontSize: '1.3rem',
                        color: whatIfResult.oldRunway === null
                          ? colors.green
                          : whatIfResult.oldRunway <= 30
                          ? colors.danger
                          : colors.warning,
                      }}>
                        {whatIfResult.oldRunway === null ? '90+ days' : `${whatIfResult.oldRunway} days`}
                      </div>
                    </div>

                    <div style={{
                      background: isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)',
                      border: `1px solid ${colors.borderGreen}`,
                      borderRadius: '10px',
                      padding: '1rem',
                      textAlign: 'center',
                    }}>
                      <div style={{ color: colors.textMuted, fontSize: '0.7rem', marginBottom: '0.3rem' }}>
                        New Runway
                      </div>
                      <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 800,
                        fontSize: '1.3rem',
                        color: colors.green,
                      }}>
                        {whatIfResult.newRunway === null ? '90+ days' : `${whatIfResult.newRunway} days`}
                      </div>
                    </div>
                  </div>

                  {whatIfResult.improvement > 0 ? (
                    <div style={{
                      color: colors.green,
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                    }}>
                      ✓ This extends your runway by {whatIfResult.improvement} days
                    </div>
                  ) : (
                    <div style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                      Your runway is already beyond 90 days. Business is secure.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI ADVICE TAB */}
          {activeView === 'ai' && (
            <div style={card}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: colors.textPrimary,
                marginBottom: '0.3rem',
              }}>
                🤖 AI Cash Flow Advisor
              </h3>
              <p style={{
                color: colors.textMuted,
                fontSize: '0.78rem',
                marginBottom: '1.25rem',
                lineHeight: 1.6,
              }}>
                Get specific advice based on your actual cash flow numbers.
              </p>

              {!aiAdvice && !loadingAI && (
                <div style={{
                  background: isDark ? 'rgba(124,106,247,0.04)' : 'rgba(91,78,199,0.03)',
                  border: `1px solid ${isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.12)'}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
                  <p style={{
                    color: colors.textSecondary,
                    fontSize: '0.85rem',
                    lineHeight: 1.7,
                  }}>
                    AI will analyze your runway ({forecast.runwayDays === null ? '90+ days' : `${forecast.runwayDays} days`}),
                    unpaid invoices ({forecast.unpaidCount}),
                    and cash position ({formatShort(currentCash)})
                    to give you 3 specific actions for this week.
                  </p>
                </div>
              )}

              {loadingAI && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ color: colors.purple, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '12px', height: '12px',
                      borderRadius: '50%',
                      border: `2px solid ${colors.purple}40`,
                      borderTopColor: colors.purple,
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                    }} />
                    Analyzing your cash flow...
                  </div>
                  {[100, 80, 92, 65].map((w, i) => (
                    <div key={i} style={{
                      height: '10px',
                      borderRadius: '5px',
                      background: isDark ? 'rgba(124,106,247,0.08)' : 'rgba(91,78,199,0.06)',
                      width: `${w}%`,
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.15}s`,
                    }} />
                  ))}
                </div>
              )}

              {aiAdvice && !loadingAI && (
                <div style={{
                  background: isDark ? 'rgba(124,106,247,0.04)' : 'rgba(91,78,199,0.03)',
                  border: `1px solid ${isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.12)'}`,
                  borderRadius: '12px',
                  padding: '1.2rem',
                  marginBottom: '1rem',
                }}>
                  <p style={{
                    color: colors.textPrimary,
                    fontSize: '0.88rem',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {aiAdvice}
                  </p>
                  <div style={{ color: colors.textMuted, fontSize: '0.7rem', marginTop: '0.75rem' }}>
                    ✦ Generated by AI using your live business data
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={getAIAdvice}
                disabled={loadingAI}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  background: loadingAI
                    ? isDark ? 'rgba(124,106,247,0.08)' : 'rgba(91,78,199,0.06)'
                    : isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.08)',
                  border: `1px solid ${isDark ? 'rgba(124,106,247,0.3)' : 'rgba(91,78,199,0.2)'}`,
                  color: colors.purple,
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: loadingAI ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
              >
                {loadingAI ? (
                  <>
                    <span style={{
                      width: '14px', height: '14px',
                      borderRadius: '50%',
                      border: `2px solid ${colors.purple}40`,
                      borderTopColor: colors.purple,
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                    }} />
                    Analyzing...
                  </>
                ) : (
                  <>{aiAdvice ? '↻ Get New Advice' : '✦ Analyze My Cash Flow'}</>
                )}
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </AppLayout>
  )
}

export default CashFlow