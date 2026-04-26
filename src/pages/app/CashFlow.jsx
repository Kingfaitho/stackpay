import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

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

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)

    try {
      const { data: constraintData } = await supabase
        .from('business_constraints')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, clients(name)')
        .eq('user_id', user.id)

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)

      const { data: clientBehavior } = await supabase
        .from('client_payment_behavior')
        .select('*')
        .eq('user_id', user.id)

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
      console.error('Cash flow load error:', err)
      setShowSetup(true)
    }

    setLoading(false)
  }

  const buildForecast = (invoices, expenses, constraints, clientBehavior, cashPosition) => {
    const today = new Date()
    const days = []

    const delayMap = {}
    clientBehavior.forEach(cb => {
      delayMap[cb.client_id] = cb.average_payment_delay_days || 0
    })

    const unpaidInvoices = invoices.filter(i => i.status === 'unpaid')
    const fixedMonthly = (constraints.monthly_fixed_costs || [])
      .reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const fixedDaily = fixedMonthly / 30

    let runningBalance = cashPosition
    const minimumBuffer = Number(constraints.minimum_cash_buffer || 0)
    let runwayDays = null
    let criticalDate = null

    for (let d = 0; d <= 90; d++) {
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      const dateStr = date.toISOString().split('T')[0]

      let dayInflow = 0
      let dayOutflow = fixedDaily
      const inflows = []
      const outflows = []

      unpaidInvoices.forEach(inv => {
        const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.created_at)
        const delay = delayMap[inv.client_id] || 0
        const expectedDate = new Date(dueDate)
        expectedDate.setDate(expectedDate.getDate() + delay)

        if (expectedDate.toISOString().split('T')[0] === dateStr) {
          dayInflow += Number(inv.total)
          inflows.push({
            label: inv.clients?.name || 'Client',
            amount: Number(inv.total),
            invoiceNum: inv.invoice_number,
          })
        }
      })

      if (d % 30 === 0 && d > 0) {
        ;(constraints.monthly_fixed_costs || []).forEach(cost => {
          outflows.push({ label: cost.label, amount: Number(cost.amount) })
        })
      }

      runningBalance += dayInflow - dayOutflow

      if (runningBalance <= minimumBuffer && runwayDays === null && d > 0) {
        runwayDays = d
        criticalDate = dateStr
      }

      if (d === 0 || d === 7 || d === 14 || d === 30 || d === 60 || d === 90 ||
          inflows.length > 0 || runningBalance <= minimumBuffer * 1.2) {
        days.push({
          day: d,
          date: dateStr,
          balance: runningBalance,
          inflow: dayInflow,
          outflow: dayOutflow,
          inflows,
          outflows,
          isCritical: minimumBuffer > 0 && runningBalance <= minimumBuffer,
          isWarning: minimumBuffer > 0 && runningBalance <= minimumBuffer * 1.5,
        })
      }
    }

    setForecast({
      days,
      runwayDays,
      criticalDate,
      minimumBuffer,
      unpaidCount: unpaidInvoices.length,
      unpaidTotal: unpaidInvoices.reduce((s, i) => s + Number(i.total), 0),
      expectedIn30: days
        .filter(d => d.day <= 30)
        .reduce((s, d) => s + d.inflow, 0),
    })
  }

  const saveConstraints = async () => {
    setSavingSetup(true)
    await supabase
      .from('business_constraints')
      .upsert({
        user_id: user.id,
        minimum_cash_buffer: Number(setupForm.minimum_cash_buffer) || 0,
        risk_tolerance: setupForm.risk_tolerance,
        monthly_fixed_costs: setupForm.monthly_fixed_costs,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    setShowSetup(false)
    setSavingSetup(false)
    loadData()
  }

  const addFixedCost = () => {
    if (!newFixedCost.label || !newFixedCost.amount) return
    setSetupForm({
      ...setupForm,
      monthly_fixed_costs: [
        ...setupForm.monthly_fixed_costs,
        { label: newFixedCost.label, amount: Number(newFixedCost.amount) },
      ],
    })
    setNewFixedCost({ label: '', amount: '' })
  }

  const removeFixedCost = (index) => {
    setSetupForm({
      ...setupForm,
      monthly_fixed_costs: setupForm.monthly_fixed_costs.filter((_, i) => i !== index),
    })
  }

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount || 0)

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
  }

  return (
    <AppLayout>
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
          Know exactly how long your business can survive — and what's coming next.
        </p>
      </div>

      {/* Show setup when no constraints exist */}
      {!constraints && !loading && !showSetup && (
        <div style={{
          ...card,
          background: isDark
            ? 'rgba(0,197,102,0.04)'
            : 'rgba(0,120,60,0.03)',
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
            marginBottom: '1.5rem',
            maxWidth: '420px',
            margin: '0 auto 1.5rem',
          }}>
            Tell StackPay your minimum cash buffer and fixed monthly costs.
            This makes our forecasting accurate and personal to your business.
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
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Configure Now →
          </button>
        </div>
      )}

      {showSetup && (
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
              ⚙️ Your Financial Constraints
            </h3>
            {constraints && (
              <button
                onClick={() => setShowSetup(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <label style={{
            color: colors.textLabel,
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'block',
            marginBottom: '0.4rem',
            letterSpacing: '0.3px',
          }}>
            MINIMUM CASH BUFFER (NGN)
          </label>
          <input
            type="number"
            placeholder="e.g. 200000 — never let cash drop below this"
            value={setupForm.minimum_cash_buffer}
            onChange={e => setSetupForm({
              ...setupForm,
              minimum_cash_buffer: e.target.value,
            })}
            style={inp}
          />
          <div style={{
            color: colors.textMuted,
            fontSize: '0.75rem',
            marginTop: '-0.5rem',
            marginBottom: '1rem',
          }}>
            This is your safety net. StackPay will alert you before you breach it.
          </div>

          <label style={{
            color: colors.textLabel,
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'block',
            marginBottom: '0.4rem',
            letterSpacing: '0.3px',
          }}>
            RISK TOLERANCE
          </label>
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
                onClick={() => setSetupForm({ ...setupForm, risk_tolerance: r.value })}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: `1px solid ${setupForm.risk_tolerance === r.value
                    ? colors.borderGreen
                    : colors.border}`,
                  background: setupForm.risk_tolerance === r.value
                    ? isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.04)'
                    : colors.bgCard2,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{r.label}</div>
                <div style={{ color: colors.textMuted, fontSize: '0.72rem' }}>{r.desc}</div>
              </div>
            ))}
          </div>

          <label style={{
            color: colors.textLabel,
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'block',
            marginBottom: '0.75rem',
            letterSpacing: '0.3px',
          }}>
            FIXED MONTHLY COSTS
          </label>

          {setupForm.monthly_fixed_costs.map((cost, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.6rem 0.85rem',
              background: colors.bgCard2,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              marginBottom: '0.5rem',
            }}>
              <div>
                <span style={{ color: colors.textPrimary, fontWeight: 600, fontSize: '0.88rem' }}>
                  {cost.label}
                </span>
                <span style={{ color: colors.green, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', marginLeft: '0.75rem' }}>
                  {formatNaira(cost.amount)}
                </span>
              </div>
              <button
                onClick={() => removeFixedCost(i)}
                style={{ background: 'transparent', border: 'none', color: colors.danger, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ✕
              </button>
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
            <input
              placeholder="e.g. Office Rent"
              value={newFixedCost.label}
              onChange={e => setNewFixedCost({ ...newFixedCost, label: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && addFixedCost()}
              style={{ ...inp, marginBottom: 0 }}
            />
            <input
              type="number"
              placeholder="Amount (NGN)"
              value={newFixedCost.amount}
              onChange={e => setNewFixedCost({ ...newFixedCost, amount: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && addFixedCost()}
              style={{ ...inp, marginBottom: 0 }}
            />
            <button
              onClick={addFixedCost}
              style={{ padding: '0.75rem 1rem', background: colors.accent, color: colors.accentText, border: 'none', borderRadius: '8px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              + Add
            </button>
          </div>

          <button
            onClick={saveConstraints}
            disabled={savingSetup}
            style={{ width: '100%', padding: '0.9rem', background: savingSetup ? colors.greenDark : colors.accent, color: colors.accentText, border: 'none', borderRadius: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: savingSetup ? 'not-allowed' : 'pointer' }}
          >
            {savingSetup ? 'Saving...' : '✓ Save & Generate Forecast'}
          </button>
        </div>
      )}

      {forecast && !showSetup && (
        <>
          <div style={{
            ...card,
            background: forecast.runwayDays !== null && forecast.runwayDays <= 30
              ? isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)'
              : forecast.runwayDays !== null && forecast.runwayDays <= 60
              ? isDark ? 'rgba(245,166,35,0.06)' : 'rgba(184,122,0,0.04)'
              : isDark ? 'rgba(0,197,102,0.04)' : 'rgba(0,120,60,0.03)',
            border: `1px solid ${forecast.runwayDays !== null && forecast.runwayDays <= 30
              ? colors.danger + '40'
              : forecast.runwayDays !== null && forecast.runwayDays <= 60
              ? colors.warning + '40'
              : colors.borderGreen}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ color: colors.textLabel, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  BUSINESS RUNWAY
                </div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  letterSpacing: '-1px',
                  color: forecast.runwayDays === null ? colors.green : forecast.runwayDays <= 30 ? colors.danger : forecast.runwayDays <= 60 ? colors.warning : colors.green,
                  lineHeight: 1,
                  marginBottom: '0.25rem',
                }}>
                  {forecast.runwayDays === null ? '90+ days' : `${forecast.runwayDays} days`}
                </div>
                <div style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                  {forecast.runwayDays === null ? 'No cash crunch expected in the next 90 days' : `Expected to breach your ₦${Number(forecast.minimumBuffer).toLocaleString()} buffer`}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ color: colors.textLabel, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  CURRENT POSITION
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: currentCash >= 0 ? colors.green : colors.danger }}>
                  {formatNaira(currentCash)}
                </div>
                <div style={{ color: colors.textMuted, fontSize: '0.78rem' }}>Income minus expenses</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Expected (30 days)', value: formatNaira(forecast.expectedIn30), color: colors.green, icon: '📥' },
              { label: 'Unpaid Invoices', value: formatNaira(forecast.unpaidTotal), color: colors.warning, icon: '⏳' },
              { label: 'Unpaid Count', value: `${forecast.unpaidCount} invoice${forecast.unpaidCount !== 1 ? 's' : ''}`, color: colors.textPrimary, icon: '📋' },
            ].map((item, i) => (
              <div key={i} style={{ ...card, marginBottom: 0, padding: '1.1rem' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{item.icon}</div>
                <div style={{ color: colors.textLabel, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: colors.textPrimary }}>
                90-Day Cash Flow Timeline
              </h3>
              <button
                onClick={() => setShowSetup(true)}
                style={{ padding: '0.4rem 0.85rem', background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}
              >
                ⚙️ Edit Constraints
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {forecast.days.slice(0, 12).map((day, i) => {
                const isToday = day.day === 0
                const hasInflow = day.inflow > 0
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: day.isCritical ? (isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)') : day.isWarning ? (isDark ? 'rgba(245,166,35,0.06)' : 'rgba(184,122,0,0.04)') : isToday ? (isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.04)') : 'transparent',
                    border: `1px solid ${day.isCritical ? colors.danger + '30' : day.isWarning ? colors.warning + '30' : isToday ? colors.borderGreen : colors.border}`,
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ width: '60px', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: isToday ? colors.green : colors.textMuted }}>
                        {isToday ? 'TODAY' : `Day ${day.day}`}
                      </div>
                      <div style={{ color: colors.textMuted, fontSize: '0.68rem' }}>
                        {new Date(day.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: day.isCritical ? colors.danger : day.balance >= 0 ? colors.textPrimary : colors.danger, marginBottom: '0.15rem' }}>
                        {formatNaira(day.balance)}
                      </div>
                      {hasInflow && (
                        <div style={{ color: colors.green, fontSize: '0.75rem', fontWeight: 600 }}>
                          + {formatNaira(day.inflow)} expected {day.inflows.map(inf => ` (${inf.label})`).join('')}
                        </div>
                      )}
                    </div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: day.isCritical ? colors.danger : day.isWarning ? colors.warning : colors.green }} />
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}

export default CashFlow