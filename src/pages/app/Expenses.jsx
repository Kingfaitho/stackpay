import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

const CATEGORIES = [
  'Data & Internet', 'Transport', 'Stock/Inventory',
  'Rent', 'Salary', 'Marketing', 'Equipment', 'Other'
]

function Expenses() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], notes: ''
  })

  useEffect(() => {
    if (user) loadExpenses()
  }, [user])

  const loadExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    setExpenses(data || [])
    setLoading(false)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('expenses')
      .insert({ ...form, amount: Number(form.amount), user_id: user.id })
    if (!error) {
      setForm({ title: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], notes: '' })
      setShowForm(false)
      loadExpenses()
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    await supabase.from('expenses').delete().eq('id', id)
    loadExpenses()
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)

  const inputStyle = {
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
            Expenses
          </h1>
          <p style={{ color: '#ff8080', fontSize: '0.9rem', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
            Total: {formatNaira(totalExpenses)}
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
          + Log Expense
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
            New Expense
          </h3>
          <form onSubmit={handleAdd}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.5rem',
            }}>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  DESCRIPTION *
                </label>
                <input
                  placeholder="e.g. MTN Data bundle"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  AMOUNT (₦) *
                </label>
                <input
                  type="number"
                  placeholder="5000"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  CATEGORY
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{ ...inputStyle }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  DATE
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  style={inputStyle}
                />
              </div>
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
                {saving ? 'Saving...' : 'Save Expense'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: 'transparent',
                  color: '#8A9E92',
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
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
          Loading expenses...
        </div>
      ) : expenses.length === 0 ? (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          color: '#8A9E92',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💸</div>
          <p>No expenses logged yet. Start tracking your costs.</p>
        </div>
      ) : (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {expenses.map((exp, i) => (
            <div key={exp.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: i < expenses.length - 1
                ? '1px solid rgba(255,255,255,0.05)'
                : 'none',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div>
                <div style={{
                  color: '#F0F5F2',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  marginBottom: '0.2rem',
                }}>
                  {exp.title}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: '#8A9E92',
                    fontSize: '0.75rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '100px',
                  }}>
                    {exp.category}
                  </span>
                  <span style={{ color: '#8A9E92', fontSize: '0.8rem' }}>
                    {new Date(exp.date).toLocaleDateString('en-NG')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  color: '#ff8080',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}>
                  -{formatNaira(exp.amount)}
                </div>
                <button
                  onClick={() => handleDelete(exp.id)}
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

export default Expenses
