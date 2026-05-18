import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

const SERVICE_STAGES = [
  { id: 'inquiry', label: 'Inquiry', color: '#8A9E92', icon: '💬' },
  { id: 'quoted', label: 'Quoted', color: '#7C6AF7', icon: '📋' },
  { id: 'accepted', label: 'Accepted', color: '#f5a623', icon: '✅' },
  { id: 'in_progress', label: 'In Progress', color: '#00A855', icon: '⚡' },
  { id: 'delivered', label: 'Delivered', color: '#00C566', icon: '📦' },
  { id: 'paid', label: 'Paid', color: '#00C566', icon: '💰' },
  { id: 'cancelled', label: 'Cancelled', color: '#ff8080', icon: '❌' },
]

function WorkOrders() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterStage, setFilterStage] = useState('all')
  const [form, setForm] = useState({
    client_id: '',
    title: '',
    description: '',
    amount: '',
    deposit_required: '',
    due_date: '',
    stage: 'inquiry',
    notes: '',
    deliverables: '',
  })

  useEffect(() => {
    if (user) {
      loadOrders()
      loadClients()
    }
  }, [user])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*, clients(name, phone, email)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Work orders load error:', error.message)
        setOrders([])
      } else {
        setOrders(data || [])
      }
    } catch (err) {
      console.error('WorkOrders crash:', err)
      setOrders([])
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)

    await supabase.from('work_orders').insert({
      user_id: user.id,
      client_id: form.client_id || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      amount: Number(form.amount) || 0,
      deposit_required: Number(form.deposit_required) || 0,
      due_date: form.due_date || null,
      stage: form.stage,
      notes: form.notes.trim() || null,
      deliverables: form.deliverables.trim() || null,
    })

    setShowForm(false)
    setForm({
      client_id: '',
      title: '',
      description: '',
      amount: '',
      deposit_required: '',
      due_date: '',
      stage: 'inquiry',
      notes: '',
      deliverables: '',
    })
    await loadOrders()
    setSaving(false)
  }

  const updateStage = async (orderId, newStage) => {
    await supabase
      .from('work_orders')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    // Auto-create invoice when marked as delivered
    if (newStage === 'delivered') {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        const invoiceNumber = `INV-${Date.now()}`
        await supabase.from('invoices').insert({
          user_id: user.id,
          client_id: order.client_id,
          invoice_number: invoiceNumber,
          status: 'unpaid',
          items: [{ description: order.title, quantity: 1, price: order.amount }],
          subtotal: order.amount,
          tax: 0,
          total: order.amount,
          notes: `Work Order: ${order.title}${order.deliverables ? `\n\nDeliverables: ${order.deliverables}` : ''}`,
          issue_date: new Date().toISOString().split('T')[0],
        })
        alert(`Invoice ${invoiceNumber} created automatically! Go to Invoices to send it.`)
      }
    }

    loadOrders()
  }

  const deleteOrder = async (id) => {
    if (!window.confirm('Delete this work order?')) return
    await supabase.from('work_orders').delete().eq('id', id)
    loadOrders()
  }

  const formatNaira = (n) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(n || 0)

  const getStageConfig = (stageId) =>
    SERVICE_STAGES.find(s => s.id === stageId) || SERVICE_STAGES[0]

  const filtered = filterStage === 'all'
    ? orders
    : orders.filter(o => o.stage === filterStage)

  const pipelineValue = orders
    .filter(o => !['paid', 'cancelled'].includes(o.stage))
    .reduce((sum, o) => sum + Number(o.amount), 0)

  const paidValue = orders
    .filter(o => o.stage === 'paid')
    .reduce((sum, o) => sum + Number(o.amount), 0)

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

  const card = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: '1.25rem',
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
            ⚡ Work Orders
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
            Track every service job from inquiry to payment — auto-creates invoices when delivered
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
          + New Work Order
        </button>
      </div>

      {/* Pipeline stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.5rem',
      }}>
        {[
          { icon: '💼', label: 'Active Pipeline', value: formatNaira(pipelineValue), color: colors.accent },
          { icon: '💰', label: 'Total Earned', value: formatNaira(paidValue), color: colors.green },
          { icon: '📋', label: 'Total Orders', value: orders.length, color: colors.textPrimary },
          {
            icon: '⚡',
            label: 'In Progress',
            value: orders.filter(o => o.stage === 'in_progress').length,
            color: colors.green,
          },
        ].map((item, i) => (
          <div key={i} style={{ ...card, marginBottom: 0, padding: '1.1rem' }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{item.icon}</div>
            <div style={{
              color: colors.textLabel,
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
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

      {/* Form */}
      {showForm && (
        <div style={{ ...card, border: `1px solid ${colors.borderGreen}`, padding: '1.5rem' }}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            color: colors.textPrimary,
            fontSize: '1rem',
            marginBottom: '1.5rem',
          }}>
            + New Work Order
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}>
              <div>
                <label style={lbl}>JOB TITLE *</label>
                <input
                  placeholder="e.g. Wedding Photography, Logo Design, Website Build"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>CLIENT</label>
                <select
                  value={form.client_id}
                  onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  <option value="">Select client or walk-in</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>AGREED AMOUNT (NGN)</label>
                <input
                  type="number"
                  placeholder="Total job fee"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>DEPOSIT REQUIRED (NGN)</label>
                <input
                  type="number"
                  placeholder="Upfront payment required"
                  value={form.deposit_required}
                  onChange={e => setForm(p => ({ ...p, deposit_required: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>DELIVERY DATE</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>CURRENT STAGE</label>
                <select
                  value={form.stage}
                  onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  {SERVICE_STAGES.filter(s => s.id !== 'cancelled').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={lbl}>WHAT WILL YOU DELIVER? (Deliverables)</label>
              <textarea
                placeholder="e.g. 200 edited photos, 3 outfit changes, delivered via Google Drive within 14 days"
                value={form.deliverables}
                onChange={e => setForm(p => ({ ...p, deliverables: e.target.value }))}
                rows={2}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            <div>
              <label style={lbl}>INTERNAL NOTES</label>
              <textarea
                placeholder="Notes only you can see — client preferences, special requirements..."
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6, marginBottom: '1.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
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
                {saving ? 'Saving...' : 'Create Work Order'}
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

      {/* Stage filter */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        <button
          onClick={() => setFilterStage('all')}
          style={{
            padding: '0.35rem 0.85rem',
            borderRadius: '100px',
            border: `1px solid ${filterStage === 'all' ? colors.borderGreen : colors.border}`,
            background: filterStage === 'all'
              ? isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)'
              : 'transparent',
            color: filterStage === 'all' ? colors.green : colors.textMuted,
            fontFamily: 'Syne, sans-serif',
            fontWeight: filterStage === 'all' ? 700 : 500,
            fontSize: '0.78rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          All ({orders.length})
        </button>
        {SERVICE_STAGES.map(stage => {
          const count = orders.filter(o => o.stage === stage.id).length
          if (count === 0) return null
          return (
            <button
              key={stage.id}
              onClick={() => setFilterStage(stage.id)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '100px',
                border: `1px solid ${filterStage === stage.id ? stage.color + '60' : colors.border}`,
                background: filterStage === stage.id
                  ? `${stage.color}15`
                  : 'transparent',
                color: filterStage === stage.id ? stage.color : colors.textMuted,
                fontFamily: 'Syne, sans-serif',
                fontWeight: filterStage === stage.id ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {stage.icon} {stage.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ ...card, padding: '3rem', textAlign: 'center', color: colors.textMuted }}>
          Loading work orders...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
          <p style={{
            color: colors.textPrimary,
            fontWeight: 500,
            marginBottom: '0.5rem',
          }}>
            No work orders yet
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Perfect for photographers, designers, caterers, consultants — any service business
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
            Create First Work Order
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(order => {
            const stageConfig = getStageConfig(order.stage)
            const isOverdue = order.due_date &&
              new Date(order.due_date) < new Date() &&
              !['paid', 'cancelled'].includes(order.stage)
            const nextStages = SERVICE_STAGES.filter(
              s => s.id !== order.stage && s.id !== 'cancelled'
            )

            return (
              <div key={order.id} style={{
                background: colors.bgCard,
                border: `1px solid ${isOverdue
                  ? colors.danger + '40'
                  : order.stage === 'paid'
                  ? colors.borderGreen
                  : colors.border}`,
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '0.85rem',
                }}>
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
                        fontSize: '0.95rem',
                        color: colors.textPrimary,
                      }}>
                        {order.title}
                      </span>
                      <span style={{
                        background: `${stageConfig.color}15`,
                        border: `1px solid ${stageConfig.color}40`,
                        color: stageConfig.color,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '100px',
                        fontFamily: 'Syne, sans-serif',
                      }}>
                        {stageConfig.icon} {stageConfig.label}
                      </span>
                      {isOverdue && (
                        <span style={{
                          background: `${colors.danger}15`,
                          border: `1px solid ${colors.danger}30`,
                          color: colors.danger,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '100px',
                          fontFamily: 'Syne, sans-serif',
                        }}>
                          OVERDUE
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}>
                      {order.clients?.name && (
                        <span style={{ color: colors.textSecondary, fontSize: '0.8rem' }}>
                          👤 {order.clients.name}
                        </span>
                      )}
                      {order.due_date && (
                        <span style={{
                          color: isOverdue ? colors.danger : colors.textMuted,
                          fontSize: '0.78rem',
                          fontWeight: isOverdue ? 700 : 400,
                        }}>
                          📅 {new Date(order.due_date).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short',
                          })}
                        </span>
                      )}
                      {order.deposit_required > 0 && (
                        <span style={{ color: colors.textMuted, fontSize: '0.78rem' }}>
                          Deposit: {formatNaira(order.deposit_required)}
                        </span>
                      )}
                    </div>

                    {order.deliverables && (
                      <div style={{
                        color: colors.textMuted,
                        fontSize: '0.75rem',
                        marginTop: '0.35rem',
                        fontStyle: 'italic',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '360px',
                      }}>
                        📦 {order.deliverables}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      color: order.stage === 'paid' ? colors.green : colors.textPrimary,
                      marginBottom: '0.75rem',
                    }}>
                      {formatNaira(order.amount)}
                    </div>

                    {/* Stage progression */}
                    {!['paid', 'cancelled'].includes(order.stage) && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {/* Next logical stage */}
                        {(() => {
                          const currentIndex = SERVICE_STAGES.findIndex(s => s.id === order.stage)
                          const nextStage = SERVICE_STAGES[currentIndex + 1]
                          if (!nextStage || nextStage.id === 'cancelled') return null
                          return (
                            <button
                              onClick={() => updateStage(order.id, nextStage.id)}
                              style={{
                                padding: '0.4rem 0.85rem',
                                background: `${nextStage.color}15`,
                                border: `1px solid ${nextStage.color}40`,
                                color: nextStage.color,
                                borderRadius: '7px',
                                fontFamily: 'Syne, sans-serif',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                              }}
                            >
                              {nextStage.icon} Mark as {nextStage.label}
                            </button>
                          )
                        })()}

                        <button
                          onClick={() => updateStage(order.id, 'cancelled')}
                          style={{
                            padding: '0.4rem 0.6rem',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: colors.textMuted,
                            borderRadius: '7px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif',
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
                          Cancel
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => deleteOrder(order.id)}
                      style={{
                        marginTop: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        color: colors.textMuted,
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        display: 'block',
                        textAlign: 'right',
                        width: '100%',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = colors.danger}
                      onMouseLeave={e => e.currentTarget.style.color = colors.textMuted}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}

export default WorkOrders