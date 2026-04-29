import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

const PAYMENT_METHODS = [
  { id: 'cash', label: '💵 Cash', desc: 'Physical cash received' },
  { id: 'bank_transfer', label: '🏦 Bank Transfer', desc: 'Direct bank transfer' },
  { id: 'pos', label: '💳 POS', desc: 'POS terminal payment' },
  { id: 'mobile_money', label: '📱 Mobile Money', desc: 'OPay, Kuda, etc.' },
  { id: 'cheque', label: '📝 Cheque', desc: 'Cheque payment' },
  { id: 'other', label: '🔄 Other', desc: 'Any other method' },
]

function CashReceipts() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [receipts, setReceipts] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({
    client_id: '',
    amount: '',
    description: '',
    payment_method: 'cash',
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    if (user) {
      loadReceipts()
      loadClients()
    }
  }, [user])

  const loadReceipts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cash_receipts')
      .select('*, clients(name)')
      .eq('user_id', user.id)
      .order('received_date', { ascending: false })
    if (!error) setReceipts(data || [])
    setLoading(false)
  }

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name')
    setClients(data || [])
  }

  const resetForm = () => {
    setForm({
      client_id: '',
      amount: '',
      description: '',
      payment_method: 'cash',
      received_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setSaveError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (saving) return

    if (!form.amount || Number(form.amount) <= 0) {
      setSaveError('Please enter a valid amount')
      return
    }
    if (!form.description.trim()) {
      setSaveError('Please describe what this payment is for')
      return
    }

    setSaving(true)
    setSaveError('')

    const { error } = await supabase
      .from('cash_receipts')
      .insert({
        user_id: user.id,
        client_id: form.client_id || null,
        amount: Number(form.amount),
        description: form.description.trim(),
        payment_method: form.payment_method,
        received_date: form.received_date,
        notes: form.notes.trim() || null,
      })

    if (error) {
      setSaveError(`Failed to save: ${error.message}`)
      setSaving(false)
      return
    }

    setShowForm(false)
    resetForm()
    await loadReceipts()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this receipt? This cannot be undone.')) return
    await supabase.from('cash_receipts').delete().eq('id', id)
    loadReceipts()
  }

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount || 0)

  const filteredReceipts = receipts.filter(r => {
    if (filter === 'all') return true
    return r.payment_method === filter
  })

  const totalReceived = receipts.reduce((sum, r) => sum + Number(r.amount), 0)
  const thisMonthTotal = receipts
    .filter(r => {
      const d = new Date(r.received_date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const getMethodConfig = (method) => {
    const m = PAYMENT_METHODS.find(p => p.id === method)
    return m || PAYMENT_METHODS[PAYMENT_METHODS.length - 1]
  }

  const card = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
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
            💵 Cash Receipts
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
            Log every payment received outside of invoices — cash, transfers, POS, and more
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm() }}
          style={{
            padding: '0.75rem 1.3rem',
            background: colors.accent,
            color: colors.accentText,
            borderRadius: '10px',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + Log Receipt
        </button>
      </div>

      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.5rem',
      }}>
        {[
          {
            icon: '💰',
            label: 'Total Received',
            value: formatNaira(totalReceived),
            color: colors.green,
          },
          {
            icon: '📅',
            label: 'This Month',
            value: formatNaira(thisMonthTotal),
            color: colors.accent,
          },
          {
            icon: '🧾',
            label: 'Total Receipts',
            value: `${receipts.length}`,
            color: colors.textPrimary,
          },
        ].map((item, i) => (
          <div key={i} style={{
            ...card,
            marginBottom: 0,
            padding: '1.1rem',
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{item.icon}</div>
            <div style={{
              color: colors.textLabel,
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '0.3rem',
            }}>
              {item.label}
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1rem',
              color: item.color,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Add receipt form */}
      {showForm && (
        <div style={{
          ...card,
          border: `1px solid ${colors.borderGreen}`,
        }}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            color: colors.textPrimary,
            fontSize: '1rem',
            marginBottom: '1.5rem',
          }}>
            💵 Log New Cash Receipt
          </h3>

          {saveError && (
            <div style={{
              background: isDark ? 'rgba(255,80,80,0.08)' : 'rgba(204,34,0,0.06)',
              border: `1px solid ${colors.danger}40`,
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: colors.danger,
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}>
              ⚠️ {saveError}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Payment method selector */}
            <label style={lbl}>PAYMENT METHOD</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}>
              {PAYMENT_METHODS.map(method => (
                <div
                  key={method.id}
                  onClick={() => setForm(prev => ({ ...prev, payment_method: method.id }))}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '10px',
                    border: `1px solid ${form.payment_method === method.id
                      ? colors.borderGreen
                      : colors.border}`,
                    background: form.payment_method === method.id
                      ? isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.05)'
                      : colors.bgCard2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontSize: '1rem',
                    marginBottom: '0.15rem',
                  }}>
                    {method.label}
                  </div>
                  <div style={{
                    color: colors.textMuted,
                    fontSize: '0.65rem',
                    lineHeight: 1.3,
                  }}>
                    {method.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Amount + Date row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}>
              <div>
                <label style={lbl} htmlFor="receipt-amount">AMOUNT RECEIVED (NGN) *</label>
                <input
                  id="receipt-amount"
                  name="receipt-amount"
                  type="number"
                  min="1"
                  placeholder="e.g. 50000"
                  value={form.amount}
                  onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl} htmlFor="receipt-date">DATE RECEIVED</label>
                <input
                  id="receipt-date"
                  name="receipt-date"
                  type="date"
                  value={form.received_date}
                  onChange={e => setForm(prev => ({ ...prev, received_date: e.target.value }))}
                  style={inp}
                />
              </div>
            </div>

            {/* Description */}
            <label style={lbl} htmlFor="receipt-desc">WHAT IS THIS PAYMENT FOR? *</label>
            <input
              id="receipt-desc"
              name="receipt-desc"
              type="text"
              placeholder="e.g. Logo design for Emeka's restaurant, Website deposit, Event photography..."
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              required
              maxLength={200}
              style={inp}
            />

            {/* Client (optional) */}
            <label style={lbl} htmlFor="receipt-client">CLIENT (OPTIONAL)</label>
            <select
              id="receipt-client"
              name="receipt-client"
              value={form.client_id}
              onChange={e => setForm(prev => ({ ...prev, client_id: e.target.value }))}
              style={{
                ...inp,
                appearance: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">— No client / Walk-in customer</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Notes */}
            <label style={lbl} htmlFor="receipt-notes">NOTES (OPTIONAL)</label>
            <textarea
              id="receipt-notes"
              name="receipt-notes"
              placeholder="Any additional details about this payment..."
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              maxLength={300}
              style={{
                ...inp,
                resize: 'vertical',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.75rem 1.8rem',
                  background: saving ? colors.greenDark : colors.accent,
                  color: colors.accentText,
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  transition: 'all 0.2s',
                  minWidth: '140px',
                }}
              >
                {saving ? 'Saving...' : '✓ Log Receipt'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm() }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: colors.textMuted,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter bar */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{ color: colors.textMuted, fontSize: '0.75rem', flexShrink: 0 }}>
          Filter:
        </span>
        {[
          { id: 'all', label: 'All' },
          ...PAYMENT_METHODS,
        ].map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '100px',
              border: `1px solid ${filter === f.id ? colors.borderGreen : colors.border}`,
              background: filter === f.id
                ? isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)'
                : 'transparent',
              color: filter === f.id ? colors.green : colors.textMuted,
              fontSize: '0.75rem',
              fontFamily: 'Syne, sans-serif',
              fontWeight: filter === f.id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Receipts list */}
      {loading ? (
        <div style={{
          ...card,
          textAlign: 'center',
          padding: '3rem',
          color: colors.textMuted,
        }}>
          Loading receipts...
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div style={{
          ...card,
          textAlign: 'center',
          padding: '3rem',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💵</div>
          <p style={{
            color: colors.textPrimary,
            fontWeight: 500,
            marginBottom: '0.4rem',
            fontSize: '1rem',
          }}>
            {filter === 'all' ? 'No receipts logged yet' : `No ${filter} receipts`}
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {filter === 'all'
              ? 'Every cash, transfer, or POS payment you receive should be logged here for accurate profit tracking'
              : 'Try a different filter to see other receipts'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => { setShowForm(true); resetForm() }}
              style={{
                padding: '0.65rem 1.5rem',
                background: colors.accent,
                color: colors.accentText,
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Log Your First Receipt
            </button>
          )}
        </div>
      ) : (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          {filteredReceipts.map((receipt, i) => {
            const method = getMethodConfig(receipt.payment_method)
            return (
              <div
                key={receipt.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.5rem',
                  borderBottom: i < filteredReceipts.length - 1
                    ? `1px solid ${colors.border}`
                    : 'none',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
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
                {/* Icon + Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flex: 1,
                  minWidth: '200px',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: isDark
                      ? 'rgba(0,197,102,0.1)'
                      : 'rgba(0,120,60,0.08)',
                    border: `1px solid ${colors.borderGreen}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}>
                    {method.label.split(' ')[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      color: colors.textPrimary,
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      fontFamily: 'Syne, sans-serif',
                      marginBottom: '0.15rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {receipt.description}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}>
                      {receipt.clients?.name && (
                        <span style={{
                          color: colors.textSecondary,
                          fontSize: '0.78rem',
                        }}>
                          {receipt.clients.name}
                        </span>
                      )}
                      {receipt.clients?.name && <span style={{ color: colors.textMuted }}>·</span>}
                      <span style={{
                        color: colors.textMuted,
                        fontSize: '0.75rem',
                      }}>
                        {new Date(receipt.received_date).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <span style={{ color: colors.textMuted }}>·</span>
                      <span style={{
                        background: isDark
                          ? 'rgba(0,197,102,0.08)'
                          : 'rgba(0,120,60,0.06)',
                        border: `1px solid ${colors.borderGreen}`,
                        color: colors.green,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '100px',
                        fontFamily: 'Syne, sans-serif',
                        textTransform: 'uppercase',
                      }}>
                        {receipt.payment_method.replace('_', ' ')}
                      </span>
                    </div>
                    {receipt.notes && (
                      <div style={{
                        color: colors.textMuted,
                        fontSize: '0.72rem',
                        marginTop: '0.15rem',
                        fontStyle: 'italic',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '280px',
                      }}>
                        {receipt.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount + Delete */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexShrink: 0,
                }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: colors.green,
                    whiteSpace: 'nowrap',
                  }}>
                    + {formatNaira(receipt.amount)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(receipt.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: colors.textMuted,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '6px',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = colors.danger
                      e.currentTarget.style.borderColor = `${colors.danger}40`
                      e.currentTarget.style.background = `${colors.danger}08`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = colors.textMuted
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}

export default CashReceipts