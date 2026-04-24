import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function Clients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadClients()
  }, [user])

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const openAddForm = () => {
    setEditingClient(null)
    setForm({ name: '', email: '', phone: '', address: '' })
    setShowForm(true)
  }

  const openEditForm = (client) => {
    setEditingClient(client)
    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update(form)
        .eq('id', editingClient.id)
        .eq('user_id', user.id)

      if (!error) {
        setShowForm(false)
        setEditingClient(null)
        loadClients()
      }
    } else {
      const { error } = await supabase
        .from('clients')
        .insert({ ...form, user_id: user.id })

      if (!error) {
        setForm({ name: '', email: '', phone: '', address: '' })
        setShowForm(false)
        loadClients()
      }
    }

    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client? This cannot be undone.')) return
    await supabase.from('clients').delete().eq('id', id)
    loadClients()
  }

  const copyPortalLink = (clientId) => {
    const link = `${window.location.origin}/portal/${clientId}`
    navigator.clipboard.writeText(link).then(() => {
      alert(`Portal link copied!\n\n${link}\n\nShare with your client to let them view all their invoices.`)
    }).catch(() => {
      prompt('Copy this link:', link)
    })
  }

  const validatePhone = (phone) => {
    if (!phone) return true
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return /^(\+?234|0)[789][01]\d{8}$/.test(cleaned)
  }

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${hasError
      ? 'rgba(255,80,80,0.4)'
      : 'rgba(255,255,255,0.1)'}`,
    background: '#0F1510',
    color: '#F0F5F2',
    fontSize: '0.9rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '0.75rem',
    transition: 'border-color 0.2s',
  })

  const labelStyle = {
    color: '#8A9E92',
    fontSize: '0.78rem',
    fontWeight: 600,
    display: 'block',
    marginBottom: '0.3rem',
    letterSpacing: '0.3px',
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
            Clients
          </h1>
          <p style={{ color: '#8A9E92', fontSize: '0.9rem' }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={openAddForm}
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
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#00A855'}
          onMouseLeave={e => e.currentTarget.style.background = '#00C566'}
        >
          + Add Client
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{
          background: '#141A16',
          border: `1px solid ${editingClient
            ? 'rgba(124,106,247,0.3)'
            : 'rgba(0,197,102,0.2)'}`,
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            {editingClient ? (
              <>
                <span style={{ color: '#7C6AF7' }}>✏️</span>
                Edit {editingClient.name}
              </>
            ) : (
              <>
                <span style={{ color: '#00C566' }}>+</span>
                New Client
              </>
            )}
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.5rem',
            }}>
              <div>
                <label style={labelStyle}>CLIENT NAME *</label>
                <input
                  placeholder="e.g. Tola Adeyemi"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  maxLength={80}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={labelStyle}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="tola@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputStyle(
                    form.email &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                  )}
                />
                {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                  <div style={{
                    color: '#ff8080',
                    fontSize: '0.75rem',
                    marginTop: '-0.5rem',
                    marginBottom: '0.5rem',
                  }}>
                    Enter a valid email address
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>PHONE NUMBER</label>
                <input
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={form.phone}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/[^0-9+\-\(\)\s]/g, '')
                    if (cleaned.replace(/\D/g, '').length <= 13) {
                      setForm({ ...form, phone: cleaned })
                    }
                  }}
                  maxLength={15}
                  style={inputStyle(
                    form.phone && !validatePhone(form.phone)
                  )}
                />
                {form.phone && !validatePhone(form.phone) && (
                  <div style={{
                    color: '#ff8080',
                    fontSize: '0.75rem',
                    marginTop: '-0.5rem',
                    marginBottom: '0.5rem',
                  }}>
                    Enter a valid Nigerian number (e.g. 08012345678)
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>ADDRESS / LOCATION</label>
                <input
                  placeholder="e.g. Ikeja, Lagos"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  maxLength={150}
                  style={inputStyle(false)}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '0.5rem',
              flexWrap: 'wrap',
            }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: saving
                    ? '#005a30'
                    : editingClient
                    ? '#7C6AF7'
                    : '#00C566',
                  color: '#fff',
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {saving
                  ? 'Saving...'
                  : editingClient
                  ? '✓ Save Changes'
                  : 'Add Client'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingClient(null)
                }}
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

      {/* Clients List */}
      {loading ? (
        <div style={{
          color: '#8A9E92',
          textAlign: 'center',
          marginTop: '3rem',
        }}>
          Loading clients...
        </div>
      ) : clients.length === 0 ? (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          color: '#8A9E92',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
          <p style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
            No clients yet
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Add your first client to start sending invoices
          </p>
        </div>
      ) : (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {clients.map((client, i) => (
            <div key={client.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: i < clients.length - 1
                ? '1px solid rgba(255,255,255,0.05)'
                : 'none',
              flexWrap: 'wrap',
              gap: '0.75rem',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Avatar + Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flex: 1,
                minWidth: '180px',
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(0,197,102,0.1)',
                  border: '1px solid rgba(0,197,102,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00C566',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  {client.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{
                    color: '#F0F5F2',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    fontFamily: 'Syne, sans-serif',
                    marginBottom: '0.2rem',
                  }}>
                    {client.name}
                  </div>
                  <div style={{
                    color: '#8A9E92',
                    fontSize: '0.78rem',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}>
                    {client.email ? (
                      <span>{client.email}</span>
                    ) : (
                      <span style={{
                        color: '#4A6055',
                        fontStyle: 'italic',
                      }}>
                        No email
                      </span>
                    )}
                    {client.email && client.phone && <span>•</span>}
                    {client.phone ? (
                      <span>{client.phone}</span>
                    ) : (
                      !client.email && (
                        <span style={{
                          color: '#4A6055',
                          fontStyle: 'italic',
                        }}>
                          No contact info
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}>

                {/* Edit Button */}
                <button
                  onClick={() => openEditForm(client)}
                  style={{
                    background: 'rgba(124,106,247,0.06)',
                    border: '1px solid rgba(124,106,247,0.15)',
                    color: '#7C6AF7',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontFamily: 'Syne, sans-serif',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(124,106,247,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(124,106,247,0.3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(124,106,247,0.06)'
                    e.currentTarget.style.borderColor = 'rgba(124,106,247,0.15)'
                  }}
                >
                  ✏️ Edit
                </button>

                {/* Portal Link Button */}
                <button
                  onClick={() => copyPortalLink(client.id)}
                  style={{
                    background: 'rgba(0,197,102,0.06)',
                    border: '1px solid rgba(0,197,102,0.15)',
                    color: '#00C566',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontFamily: 'Syne, sans-serif',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0,197,102,0.12)'
                    e.currentTarget.style.borderColor = 'rgba(0,197,102,0.3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0,197,102,0.06)'
                    e.currentTarget.style.borderColor = 'rgba(0,197,102,0.15)'
                  }}
                >
                  🔗 Portal
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(client.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: '#4A6055',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#ff8080'
                    e.currentTarget.style.borderColor = 'rgba(255,80,80,0.2)'
                    e.currentTarget.style.background = 'rgba(255,80,80,0.05)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#4A6055'
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.background = 'transparent'
                  }}
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

export default Clients