import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'
import { generateInvoicePDF } from '../../lib/generatePDF'
import { initializePayment } from '../../lib/paystack'
import { sendInvoicePaidEmail } from '../../lib/sendEmail'

function Invoices() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [profile, setProfile] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, price: 0 }]
  })

  useEffect(() => {
  if (user) {
    loadInvoices()
    loadClients()
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data))
  }
}, [user])


  const loadInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id)
    setClients(data || [])
  }

  const generateInvoiceNumber = () => {
    const date = new Date()
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `INV-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${rand}`
  }

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, price: 0 }]
    })
  }

  const removeItem = (index) => {
    if (form.items.length === 1) return
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    })
  }

  const updateItem = (index, field, value) => {
    const updated = form.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setForm({ ...form, items: updated })
  }

  const getSubtotal = () => {
    return form.items.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.price))
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const subtotal = getSubtotal()
    const invoice_number = generateInvoiceNumber()

    const { error } = await supabase.from('invoices').insert({
      user_id: user.id,
      client_id: form.client_id || null,
      invoice_number,
      due_date: form.due_date || null,
      notes: form.notes,
      items: form.items,
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'unpaid',
    })

    if (!error) {
      setForm({
        client_id: '',
        due_date: '',
        notes: '',
        items: [{ description: '', quantity: 1, price: 0 }]
      })
      setShowForm(false)
      loadInvoices()
    }
    setSaving(false)
  }

  const markAsPaid = async (id) => {
  await supabase
    .from('invoices')
    .update({ status: 'paid' })
    .eq('id', id)

  // Send email notification
  const inv = invoices.find(i => i.id === id)
  if (inv && user?.email) {
    await sendInvoicePaidEmail({
      ownerEmail: user.email,
      ownerName: profile?.owner_name || '',
      businessName: profile?.business_name || 'Your Business',
      clientName: inv.clients?.name || 'Client',
      invoiceNumber: inv.invoice_number,
      amount: inv.total,
    })
  }

  loadInvoices()
}

  const deleteInvoice = async (id) => {
    if (!window.confirm('Delete this invoice?')) return
    await supabase.from('invoices').delete().eq('id', id)
    loadInvoices()
  }

  const handlePaystackPayment = (inv) => {
  if (!inv.clients?.email) {
    alert('This client has no email. Add their email in Clients first.')
    return
  }
  initializePayment({
    email: inv.clients.email,
    amount: Number(inv.total),
    invoiceNumber: inv.invoice_number,
    onSuccess: async (response) => {
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paystack_ref: response.reference,
        })
        .eq('id', inv.id)
      loadInvoices()
    },
    onClose: () => console.log('Payment closed'),
  })
}

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)

  const inp = {
    padding: '0.7rem 0.9rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#0F1510',
    color: '#F0F5F2',
    fontSize: '0.9rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    width: '100%',
  }

  return (
    <AppLayout>
      {/* Header */}
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
            Invoices
          </h1>
          <p style={{ color: '#8A9E92', fontSize: '0.9rem' }}>
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total
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
          + New Invoice
        </button>
      </div>

      {/* Invoice Form */}
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
            marginBottom: '1.5rem',
            fontSize: '1.1rem',
          }}>
            Create New Invoice
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Client + Due Date */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  CLIENT
                </label>
                <select
                  value={form.client_id}
                  onChange={e => setForm({ ...form, client_id: e.target.value })}
                  style={inp}
                >
                  <option value="">Select a client (optional)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  DUE DATE
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  style={inp}
                />
              </div>
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
                ITEMS / SERVICES
              </label>

              {/* Items Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 100px 40px',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                padding: '0 0.2rem',
              }}>
                {['Description', 'Qty', 'Price (₦)', ''].map((h, i) => (
                  <div key={i} style={{ color: '#8A9E92', fontSize: '0.75rem', fontWeight: 600 }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Item Rows */}
              {form.items.map((item, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 100px 40px',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  alignItems: 'center',
                }}>
                  <input
                    placeholder="e.g. Logo design"
                    value={item.description}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                    required
                    style={inp}
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', e.target.value)}
                    style={inp}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={item.price}
                    onChange={e => updateItem(index, 'price', e.target.value)}
                    style={inp}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{
                      background: 'rgba(255,80,80,0.1)',
                      border: 'none',
                      color: '#ff8080',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                  background: 'transparent',
                  border: '1px dashed rgba(0,197,102,0.3)',
                  color: '#00C566',
                  borderRadius: '8px',
                  padding: '0.6rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  marginTop: '0.5rem',
                  width: '100%',
                }}
              >
                + Add Another Item
              </button>
            </div>

            {/* Total */}
            <div style={{
              background: '#0F1510',
              borderRadius: '10px',
              padding: '1rem 1.2rem',
              marginBottom: '1.2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ color: '#8A9E92', fontSize: '0.9rem' }}>Total Amount</span>
              <span style={{
                color: '#00C566',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '1.3rem',
              }}>
                {formatNaira(getSubtotal())}
              </span>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                NOTES (OPTIONAL)
              </label>
              <textarea
                placeholder="e.g. Payment due within 7 days. Thank you for your business!"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                style={{
                  ...inp,
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.75rem 1.8rem',
                  background: saving ? '#005a30' : '#00C566',
                  color: '#080C0A',
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Invoice'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#8A9E92',
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.95rem',
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

      {/* Invoices List */}
      {loading ? (
        <div style={{ color: '#8A9E92', textAlign: 'center', marginTop: '3rem' }}>
          Loading invoices...
        </div>
      ) : invoices.length === 0 ? (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          color: '#8A9E92',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</div>
          <p style={{ marginBottom: '1rem' }}>No invoices yet. Create your first one!</p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '0.6rem 1.2rem',
              background: '#00C566',
              color: '#080C0A',
              borderRadius: '8px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Create Invoice
          </button>
        </div>
      ) : (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {invoices.map((inv, i) => (
            <div key={inv.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: i < invoices.length - 1
                ? '1px solid rgba(255,255,255,0.05)'
                : 'none',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div>
                <div style={{
                  color: '#F0F5F2',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  marginBottom: '0.2rem',
                  fontFamily: 'Syne, sans-serif',
                }}>
                  {inv.invoice_number}
                </div>
                <div style={{ color: '#8A9E92', fontSize: '0.8rem' }}>
                  {inv.clients?.name || 'No client'} •{' '}
                  {new Date(inv.created_at).toLocaleDateString('en-NG')}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#F0F5F2',
                }}>
                  {formatNaira(inv.total)}
                </div>

                <div style={{
                  padding: '0.2rem 0.7rem',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: inv.status === 'paid'
                    ? 'rgba(0,197,102,0.1)'
                    : 'rgba(245,166,35,0.1)',
                  color: inv.status === 'paid' ? '#00C566' : '#f5a623',
                }}>
                  {inv.status}
                </div>

                {inv.status === 'unpaid' && (
                  <button
                    onClick={() => markAsPaid(inv.id)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      background: 'rgba(0,197,102,0.1)',
                      border: '1px solid rgba(0,197,102,0.2)',
                      color: '#00C566',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    Mark Paid
                  </button>
                )}

                <button
  onClick={() => generateInvoicePDF(
    inv,
    inv.clients?.name || 'Client',
    profile?.business_name || 'My Business',
    profile?.owner_name || ''
  )}
  style={{
    padding: '0.3rem 0.75rem',
    background: 'rgba(0,197,102,0.08)',
    border: '1px solid rgba(0,197,102,0.15)',
    color: '#00C566',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Syne, sans-serif',
  }}
>
  ↓ PDF
</button>
<button
  onClick={() => shareOnWhatsApp(inv, inv.clients?.name)}
  style={{
    padding: '0.3rem 0.75rem',
    background: 'rgba(37,211,102,0.08)',
    border: '1px solid rgba(37,211,102,0.2)',
    color: '#25D366',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Syne, sans-serif',
  }}
>
  WhatsApp
</button>
              <button
                  onClick={() => deleteInvoice(inv.id)}
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
                {inv.status === 'unpaid' && (
  <button
    onClick={() => handlePaystackPayment(inv)}
    style={{
      padding: '0.3rem 0.75rem',
      background: 'rgba(0,100,255,0.08)',
      border: '1px solid rgba(0,100,255,0.2)',
      color: '#4d9fff',
      borderRadius: '6px',
      fontSize: '0.78rem',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'Syne, sans-serif',
    }}
  >
    💳 Pay Now
  </button>
)}


              </div>
            </div>            
          ))}
        </div>
      )}
    </AppLayout>
  )
  const shareOnWhatsApp = (inv, clientName) => {
  const message = encodeURIComponent(
    `Hello ${clientName || 'there'},\n\n` +
    `Please find your invoice details below:\n\n` +
    `📋 Invoice: ${inv.invoice_number}\n` +
    `💰 Amount: ${formatNaira(inv.total)}\n` +
    `📅 Due: ${inv.due_date
      ? new Date(inv.due_date).toLocaleDateString('en-NG')
      : 'On receipt'}\n\n` +
    `Kindly make payment at your earliest convenience.\n\n` +
    `Thank you for your business! 🙏\n` +
    `— ${profile?.business_name || 'StackPay'}`
  )
  window.open(`https://wa.me/?text=${message}`, '_blank')
}

}

export default Invoices