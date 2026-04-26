import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function Clients() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    logo_url: '',
  })

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
    setForm({
      name: '', company: '', email: '',
      phone: '', address: '', bio: '', logo_url: '',
    })
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('client-form')?.scrollIntoView({
        behavior: 'smooth', block: 'start',
      })
    }, 100)
  }

  const openEditForm = (client) => {
    setEditingClient(client)
    setForm({
      name: client.name || '',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      bio: client.bio || '',
      logo_url: client.logo_url || '',
    })
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('client-form')?.scrollIntoView({
        behavior: 'smooth', block: 'start',
      })
    }, 100)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be under 2MB')
      return
    }

    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const fileName = `client-logos/${user.id}-${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true })

    if (!error) {
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)
      setForm({ ...form, logo_url: urlData.publicUrl })
    } else {
      console.error('Upload error:', error)
      alert('Upload failed. Make sure you created a "logos" storage bucket in Supabase.')
    }
    setUploadingLogo(false)
  }

  const validatePhone = (phone) => {
    if (!phone) return true
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return /^(\+?234|0)[789][01]\d{8}$/.test(cleaned)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (editingClient) {
      await supabase
        .from('clients')
        .update(form)
        .eq('id', editingClient.id)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('clients')
        .insert({ ...form, user_id: user.id })
    }

    setShowForm(false)
    setEditingClient(null)
    loadClients()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return
    await supabase.from('clients').delete().eq('id', id)
    loadClients()
  }

  const copyPortalLink = (clientId) => {
    const link = `${window.location.origin}/portal/${clientId}`
    navigator.clipboard.writeText(link).then(() => {
      alert(`Portal link copied!\n\n${link}`)
    }).catch(() => {
      prompt('Copy this link:', link)
    })
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
    transition: 'border-color 0.2s',
  }

  const label = {
    color: colors.textLabel,
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
            color: colors.textPrimary,
          }}>
            Clients
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={openAddForm}
          style={{
            padding: '0.7rem 1.3rem',
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
          + Add Client
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div
          id="client-form"
          style={{
            background: colors.bgCard,
            border: `1px solid ${editingClient
              ? colors.purple + '50'
              : colors.borderGreen}`,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: '1.5rem',
            fontSize: '1.05rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            {editingClient ? '✏️ Edit Client' : '+ New Client'}
          </h3>

          <form onSubmit={handleSubmit}>

            {/* Logo Upload */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={label}>
                CLIENT / COMPANY LOGO
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Client logo"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                ) : (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: colors.bgInput,
                    border: `2px dashed ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.textMuted,
                    fontSize: '1.5rem',
                  }}>
                    🏢
                  </div>
                )}
                <div>
                  <label
                    htmlFor="logo-upload"
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: colors.bgCard2,
                      border: `1px solid ${colors.border}`,
                      color: colors.textSecondary,
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-block',
                      transition: 'all 0.2s',
                    }}
                  >
                    {uploadingLogo
                      ? 'Uploading...'
                      : form.logo_url
                      ? 'Change Logo'
                      : 'Upload Logo'}
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    color: colors.textMuted,
                    fontSize: '0.72rem',
                    marginTop: '0.3rem',
                  }}>
                    PNG, JPG up to 2MB. Appears on invoices.
                  </div>
                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logo_url: '' })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: colors.danger,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                        marginTop: '0.3rem',
                        display: 'block',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fields Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.5rem',
            }}>
              <div>
                <label style={label}>CONTACT NAME *</label>
                <input
                  placeholder="e.g. Tola Adeyemi"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  maxLength={80}
                  style={inp}
                />
              </div>

              <div>
                <label style={label}>COMPANY NAME</label>
                <input
                  placeholder="e.g. Tola Designs Ltd"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  maxLength={100}
                  style={inp}
                />
              </div>

              <div>
                <label style={label}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="tola@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{
                    ...inp,
                    borderColor: form.email &&
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                      ? '#cc3300'
                      : colors.border,
                  }}
                />
              </div>

              <div>
                <label style={label}>PHONE NUMBER</label>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={form.phone}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/[^0-9+\-\(\)\s]/g, '')
                    if (cleaned.replace(/\D/g, '').length <= 13) {
                      setForm({ ...form, phone: cleaned })
                    }
                  }}
                  style={{
                    ...inp,
                    borderColor: form.phone && !validatePhone(form.phone)
                      ? '#cc3300'
                      : colors.border,
                  }}
                />
                {form.phone && !validatePhone(form.phone) && (
                  <div style={{
                    color: colors.danger,
                    fontSize: '0.75rem',
                    marginTop: '-0.5rem',
                    marginBottom: '0.5rem',
                  }}>
                    Enter a valid Nigerian number
                  </div>
                )}
              </div>

              <div>
                <label style={label}>ADDRESS / LOCATION</label>
                <input
                  placeholder="e.g. Ikeja, Lagos"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  maxLength={150}
                  style={inp}
                />
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginTop: '0.25rem' }}>
              <label style={label}>
                CLIENT BIO / NOTES
              </label>
              <textarea
                placeholder="e.g. Fashion designer based in Lagos. Prefers invoice due within 7 days. Met at Lagos Fashion Week 2024."
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                rows={3}
                maxLength={500}
                style={{
                  ...inp,
                  resize: 'vertical',
                  lineHeight: 1.6,
                  marginBottom: '1.5rem',
                }}
              />
              <div style={{
                color: colors.textMuted,
                fontSize: '0.72rem',
                marginTop: '-1.2rem',
                marginBottom: '1rem',
                textAlign: 'right',
              }}>
                {form.bio.length}/500
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving || uploadingLogo}
                style={{
                  padding: '0.7rem 1.8rem',
                  background: saving
                    ? colors.greenDark
                    : editingClient
                    ? colors.purple
                    : colors.accent,
                  color: editingClient ? '#fff' : colors.accentText,
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
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
                onClick={() => { setShowForm(false); setEditingClient(null) }}
                style={{
                  padding: '0.7rem 1.5rem',
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

      {/* Clients List */}
      {loading ? (
        <div style={{ color: colors.textMuted, textAlign: 'center', marginTop: '3rem' }}>
          Loading clients...
        </div>
      ) : clients.length === 0 ? (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          color: colors.textMuted,
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
          <p style={{ fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
            No clients yet
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Add your first client to start sending invoices
          </p>
        </div>
      ) : (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          {clients.map((client, i) => (
            <div key={client.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: i < clients.length - 1
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
              {/* Logo + Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flex: 1,
                minWidth: '200px',
              }}>
                {/* Avatar/Logo */}
                {client.logo_url ? (
                  <img
                    src={client.logo_url}
                    alt={client.name}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: `1px solid ${colors.border}`,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: isDark
                      ? 'rgba(0,197,102,0.1)'
                      : 'rgba(0,120,60,0.08)',
                    border: `1px solid ${colors.borderGreen}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.green,
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}>
                    {client.name[0].toUpperCase()}
                  </div>
                )}

                <div>
                  <div style={{
                    color: colors.textPrimary,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    fontFamily: 'Syne, sans-serif',
                    marginBottom: '0.15rem',
                  }}>
                    {client.name}
                    {client.company && (
                      <span style={{
                        color: colors.textMuted,
                        fontWeight: 400,
                        fontSize: '0.82rem',
                        marginLeft: '0.5rem',
                      }}>
                        · {client.company}
                      </span>
                    )}
                  </div>
                  <div style={{
                    color: colors.textSecondary,
                    fontSize: '0.78rem',
                    display: 'flex',
                    gap: '0.4rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}>
                    {client.email && <span>{client.email}</span>}
                    {client.email && client.phone && <span>·</span>}
                    {client.phone && <span>{client.phone}</span>}
                    {!client.email && !client.phone && (
                      <span style={{
                        color: colors.textMuted,
                        fontStyle: 'italic',
                      }}>
                        No contact info — click Edit to add
                      </span>
                    )}
                  </div>
                  {client.bio && (
                    <div style={{
                      color: colors.textMuted,
                      fontSize: '0.75rem',
                      marginTop: '0.2rem',
                      fontStyle: 'italic',
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {client.bio}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => openEditForm(client)}
                  style={{
                    background: isDark
                      ? 'rgba(124,106,247,0.06)'
                      : 'rgba(91,78,199,0.06)',
                    border: `1px solid ${isDark
                      ? 'rgba(124,106,247,0.2)'
                      : 'rgba(91,78,199,0.2)'}`,
                    color: colors.purple,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontFamily: 'Syne, sans-serif',
                    transition: 'all 0.2s',
                  }}
                >
                  ✏️ Edit
                </button>

                <button
                  onClick={() => copyPortalLink(client.id)}
                  style={{
                    background: isDark
                      ? 'rgba(0,197,102,0.06)'
                      : 'rgba(0,120,60,0.06)',
                    border: `1px solid ${colors.borderGreen}`,
                    color: colors.green,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontFamily: 'Syne, sans-serif',
                    transition: 'all 0.2s',
                  }}
                >
                  🔗 Portal
                </button>

                <button
                  onClick={() => handleDelete(client.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: colors.textMuted,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.2s',
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
          ))}
        </div>
      )}
    </AppLayout>
  )
}

export default Clients