import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function Recurring() {
  const { user } = useAuth()
  const [recurring, setRecurring] = useState([])
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    client_id: '',
    total: '',
    frequency: 'monthly',
    next_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, price: 0 }],
  })

  useEffect(() => {
    if (user) {
      loadRecurring()
      loadClients()
    }
  }, [user])

  const loadRecurring = async () => {
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
    setClients(data || [])
  }

  const getTotal = () =>
    form.items.reduce((sum, item) =>
      sum + Number(item.quantity) * Number(item.price), 0)

  const updateItem = (index, field, value) => {
    const updated = form.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setForm({ ...form, items: updated })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('recurring_invoices')
      .insert({
        user_id: user.id,
        client_id: form.client_id || null,
        items: form.items,
        total: getTotal(),
        frequency: form.frequency,
        next_date: form.next_date,
        notes: form.notes,
        active: true,
      })
    if (!error) {
      setForm({
        client_id: '',
        total: '',
        frequency: 'monthly',
        next_date: '',
        notes: '',
        items: [{ description: '', quantity: 1, price: 0 }],
      })
      setShowForm(false)
      loadRecurring()
    }
    setSaving(false)
  }

  const toggleActive = async (id, current) => {
    await supabase
      .from('recurring_invoices')
      .update({ active: !current })
      .eq('id', id)
    loadRecurring()
  }

  const deleteRecurring = async (id) => {
    if (!window.confirm('Delete this recurring invoice?')) return
    await supabase.from('recurring_invoices').delete().eq('id', id)
    loadRecurring()
  }

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)

  const inp = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#0F1510',
    color: '#F0F5F2',
    fontSize: '0.9rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '0.75rem',
  }

  return (
    <AppLayout>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
            color: '#F0F5F2',
          }}>
            Recurring Invoices
          </h1>
          <p style={{ color: '#8A9E92', fontSize: '0.9rem' }}>
            Auto-invoice regular clients every month
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.7rem 1.3rem',
            background: '#00C566',
            color: '#080C0A',
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
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(0,197,102,0.2)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            color: '#F0F5F2',
            marginBottom: '1.2rem',
            fontSize: '1rem',
          }}>
            New Recurring Invoice
          </h3>
          <form onSubmit={handleSave}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  CLIENT
                </label>
                <select
                  value={form.client_id}
                  onChange={e => setForm({ ...form, client_id: e.target.value })}
                  style={inp}
                >
                  <option value="">Select client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  FREQUENCY
                </label>
                <select
                  value={form.frequency}
                  onChange={e => setForm({ ...form, frequency: e.target.value })}
                  style={inp}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  FIRST SEND DATE
                </label>
                <input
                  type="date"
                  value={form.next_date}
                  onChange={e => setForm({ ...form, next_date: e.target.value })}
                  required
                  style={inp}
                />
              </div>
            </div>

            {/* Items */}
            <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              ITEMS
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 70px 90px 36px',
              gap: '0.4rem',
              marginBottom: '0.4rem',
            }}>
              {['Description', 'Qty', 'Price ₦', ''].map((h, i) => (
                <div key={i} style={{ color: '#4A6055', fontSize: '0.72rem', fontWeight: 600 }}>
                  {h}
                </div>
              ))}
            </div>
            {form.items.map((item, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 70px 90px 36px',
                gap: '0.4rem',
                marginBottom: '0.4rem',
                alignItems: 'center',
              }}>
                <input
                  placeholder="Service description"
                  value={item.description}
                  onChange={e => updateItem(index, 'description', e.target.value)}
                  required
                  style={{ ...inp, marginBottom: 0 }}
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateItem(index, 'quantity', e.target.value)}
                  style={{ ...inp, marginBottom: 0 }}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={item.price}
                  onChange={e => updateItem(index, 'price', e.target.value)}
                  style={{ ...inp, marginBottom: 0 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (form.items.length === 1) return
                    setForm({
                      ...form,
                      items: form.items.filter((_, i) => i !== index)
                    })
                  }}
                  style={{
                    background: 'rgba(255,80,80,0.1)',
                    border: 'none',
                    color: '#ff8080',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '0.4rem',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setForm({
                ...form,
                items: [...form.items, { description: '', quantity: 1, price: 0 }]
              })}
              style={{
                background: 'transparent',
                border: '1px dashed rgba(0,197,102,0.3)',
                color: '#00C566',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                width: '100%',
                marginBottom: '1rem',
              }}
            >
              + Add Item
            </button>

            {/* Total preview */}
            <div style={{
              background: '#0F1510',
              borderRadius: '10px',
              padding: '0.85rem 1.2rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: '#8A9E92', fontSize: '0.9rem' }}>
                Amount per invoice
              </span>
              <span style={{
                color: '#00C566',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '1.1rem',
              }}>
                {formatNaira(getTotal())}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: '#00C566',
                  color: '#080C0A',
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Recurring Invoice'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: 'transparent',
                  color: '#8A9E92',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
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
        <div style={{ color: '#8A9E92', textAlign: 'center', marginTop: '3rem' }}>
          Loading...
        </div>
      ) : recurring.length === 0 ? (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          color: '#8A9E92',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔄</div>
          <p>No recurring invoices yet.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Set one up for clients you invoice every month.
          </p>
        </div>
      ) : (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {recurring.map((rec, i) => (
            <div key={rec.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: i < recurring.length - 1
                ? '1px solid rgba(255,255,255,0.05)'
                : 'none',
              flexWrap: 'wrap',
              gap: '0.75rem',
              opacity: rec.active ? 1 : 0.5,
            }}>
              <div>
                <div style={{
                  color: '#F0F5F2',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  marginBottom: '0.2rem',
                }}>
                  {rec.clients?.name || 'No client'} •{' '}
                  <span style={{ color: '#00C566', textTransform: 'capitalize' }}>
                    {rec.frequency}
                  </span>
                </div>
                <div style={{ color: '#8A9E92', fontSize: '0.8rem' }}>
                  Next: {rec.next_date
                    ? new Date(rec.next_date).toLocaleDateString('en-NG')
                    : 'Not set'}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <span style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  color: '#F0F5F2',
                  fontSize: '0.95rem',
                }}>
                  {formatNaira(rec.total)}
                </span>
                <button
                  onClick={() => toggleActive(rec.id, rec.active)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    background: rec.active
                      ? 'rgba(0,197,102,0.1)'
                      : 'rgba(255,255,255,0.05)',
                    border: rec.active
                      ? '1px solid rgba(0,197,102,0.2)'
                      : '1px solid rgba(255,255,255,0.1)',
                    color: rec.active ? '#00C566' : '#8A9E92',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  {rec.active ? 'Active' : 'Paused'}
                </button>
                <button
                  onClick={() => deleteRecurring(rec.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#8A9E92',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff8080'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8A9E92'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}

export default Recurring
