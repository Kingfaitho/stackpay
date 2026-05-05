import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function Recurring() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [recurring, setRecurring] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    frequency: 'monthly',
    next_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, price: '' }],
  })

  useEffect(() => {
    if (user) { loadRecurring(); loadClients() }
  }, [user])

  const loadRecurring = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('recurring_invoices')
      .select('*, clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRecurring(data || [])
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

  const addItem = () => {
    setForm(p => ({
      ...p,
      items: [...p.items, { description: '', quantity: 1, price: '' }],
    }))
  }

  const updateItem = (index, field, value) => {
    const updated = [...form.items]
    updated[index][field] = value
    setForm(p => ({ ...p, items: updated }))
  }

  const removeItem = (index) => {
    setForm(p => ({
      ...p,
      items: p.items.filter((_, i) => i !== index),
    }))
  }

  const total = form.items.reduce(
    (sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!form.client_id) { alert('Please select a client'); return }
    if (!form.next_date) { alert('Please set the next invoice date'); return }
    setSaving(true)

    await supabase.from('recurring_invoices').insert({
      user_id: user.id,
      client_id: form.client_id,
      frequency: form.frequency,
      next_date: form.next_date,
      notes: form.notes || null,
      items: form.items,
      total,
      active: true,
    })

    setShowForm(false)
    setForm({
      client_id: '',
      frequency: 'monthly',
      next_date: '',
      notes: '',
      items: [{ description: '', quantity: 1, price: '' }],
    })
    await loadRecurring()
    setSaving(false)
  }

  const toggleActive = async (rec) => {
    await supabase
      .from('recurring_invoices')
      .update({ active: !rec.active })
      .eq('id', rec.id)
    loadRecurring()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring invoice?')) return
    await supabase.from('recurring_invoices').delete().eq('id', id)
    loadRecurring()
  }

  const generateNow = async (rec) => {
    const invoiceNumber = `INV-${Date.now()}`
    await supabase.from('invoices').insert({
      user_id: user.id,
      client_id: rec.client_id,
      invoice_number: invoiceNumber,
      status: 'unpaid',
      items: rec.items,
      subtotal: rec.total,
      tax: 0,
      total: rec.total,
      notes: rec.notes || `Recurring invoice - ${rec.frequency}`,
      issue_date: new Date().toISOString().split('T')[0],
    })

    const nextDate = new Date(rec.next_date)
    if (rec.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7)
    else if (rec.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1)
    else if (rec.frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3)
    else if (rec.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1)

    await supabase
      .from('recurring_invoices')
      .update({ next_date: nextDate.toISOString().split('T')[0] })
      .eq('id', rec.id)

    alert(`Invoice ${invoiceNumber} created! Go to Invoices to send it.`)
    loadRecurring()
  }

  const formatNaira = (n) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(n || 0)

  const freqLabel = {
    weekly: 'Every Week',
    monthly: 'Every Month',
    quarterly: 'Every 3 Months',
    yearly: 'Every Year',
  }

  const card = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
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
    fontSize: '0.72rem',
    fontWeight: 600,
    display: 'block',
    marginBottom: '0.3rem',
    letterSpacing: '0.3px',
  }

  return (
    <AppLayout>
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
            🔄 Recurring Invoices
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
            Set up invoices that repeat automatically — weekly, monthly, or quarterly
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
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
          }}
        >
          + New Recurring
        </button>
      </div>

      {showForm && (
        <div style={{ ...card, border: `1px solid ${colors.borderGreen}`, padding: '1.5rem' }}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            color: colors.textPrimary,
            fontSize: '1rem',
            marginBottom: '1.5rem',
          }}>
            + New Recurring Invoice
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}>
              <div>
                <label style={lbl}>CLIENT *</label>
                <select
                  value={form.client_id}
                  onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
                  required
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  <option value="">Select client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>FREQUENCY *</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly (every 3 months)</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label style={lbl}>FIRST INVOICE DATE *</label>
                <input
                  type="date"
                  value={form.next_date}
                  onChange={e => setForm(p => ({ ...p, next_date: e.target.value }))}
                  required
                  style={inp}
                />
              </div>
            </div>

            <label style={lbl}>INVOICE ITEMS *</label>
            {form.items.map((item, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 120px auto',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                alignItems: 'start',
              }}>
                <input
                  placeholder="Description e.g. Monthly retainer"
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  required
                  style={{ ...inp, marginBottom: 0 }}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                  style={{ ...inp, marginBottom: 0 }}
                />
                <input
                  type="number"
                  placeholder="Price (NGN)"
                  value={item.price}
                  onChange={e => updateItem(i, 'price', e.target.value)}
                  required
                  style={{ ...inp, marginBottom: 0 }}
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={form.items.length === 1}
                  style={{
                    padding: '0.75rem',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.danger,
                    borderRadius: '8px',
                    cursor: form.items.length === 1 ? 'not-allowed' : 'pointer',
                    opacity: form.items.length === 1 ? 0.3 : 1,
                    height: '44px',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: `1px dashed ${colors.borderGreen}`,
                color: colors.green,
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '0.82rem',
                marginBottom: '1rem',
                transition: 'all 0.2s',
              }}
            >
              + Add Line Item
            </button>

            {total > 0 && (
              <div style={{
                padding: '0.75rem 1rem',
                background: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.04)',
                border: `1px solid ${colors.borderGreen}`,
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
                  Invoice Total
                </span>
                <span style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: colors.green,
                }}>
                  {formatNaira(total)}
                </span>
              </div>
            )}

            <label style={lbl}>NOTES (OPTIONAL)</label>
            <textarea
              placeholder="Any notes to include on the invoice..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6, marginBottom: '1.25rem' }}
            />

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
                }}
              >
                {saving ? 'Saving...' : 'Save Recurring Invoice'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: colors.textMuted,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ ...card, padding: '3rem', textAlign: 'center', color: colors.textMuted }}>
          Loading...
        </div>
      ) : recurring.length === 0 ? (
        <div style={{ ...card, padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔄</div>
          <p style={{ color: colors.textPrimary, fontWeight: 500, marginBottom: '0.4rem' }}>
            No recurring invoices yet
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Perfect for retainers, monthly services, rent collection, or any regular billing
          </p>
          <button
            onClick={() => setShowForm(true)}
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
            Create First Recurring Invoice
          </button>
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
          {recurring.map((rec, i) => {
            const isOverdue = rec.next_date && new Date(rec.next_date) < new Date()
            return (
              <div
                key={rec.id}
                style={{
                  padding: '1.1rem 1.5rem',
                  borderBottom: i < recurring.length - 1
                    ? `1px solid ${colors.border}`
                    : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  opacity: rec.active ? 1 : 0.5,
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
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.3rem',
                  }}>
                    <span style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: colors.textPrimary,
                    }}>
                      {rec.clients?.name || 'No client'}
                    </span>
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
                    }}>
                      {freqLabel[rec.frequency]}
                    </span>
                    {!rec.active && (
                      <span style={{
                        background: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.06)',
                        color: colors.textMuted,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '100px',
                        fontFamily: 'Syne, sans-serif',
                      }}>
                        PAUSED
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: colors.green,
                    }}>
                      {formatNaira(rec.total)}
                    </span>
                    <span style={{
                      color: isOverdue ? colors.danger : colors.textMuted,
                      fontSize: '0.78rem',
                      fontWeight: isOverdue ? 700 : 400,
                    }}>
                      {isOverdue ? '⚠️ Due: ' : 'Next: '}
                      {rec.next_date
                        ? new Date(rec.next_date).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                  flexShrink: 0,
                }}>
                  <button
                    onClick={() => generateNow(rec)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      background: isDark
                        ? 'rgba(0,197,102,0.06)'
                        : 'rgba(0,120,60,0.06)',
                      border: `1px solid ${colors.borderGreen}`,
                      color: colors.green,
                      borderRadius: '7px',
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ⚡ Generate Now
                  </button>
                  <button
                    onClick={() => toggleActive(rec)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: 'transparent',
                      border: `1px solid ${colors.border}`,
                      color: colors.textMuted,
                      borderRadius: '7px',
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {rec.active ? '⏸ Pause' : '▶ Resume'}
                  </button>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    style={{
                      padding: '0.4rem 0.6rem',
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: colors.textMuted,
                      borderRadius: '7px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = colors.danger
                      e.currentTarget.style.borderColor = `${colors.danger}40`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = colors.textMuted
                      e.currentTarget.style.borderColor = 'transparent'
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

export default Recurring