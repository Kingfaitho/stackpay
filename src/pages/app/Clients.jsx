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
  const [saveError, setSaveError] = useState('')
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
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setClients(data || [])
    setLoading(false)
  }

  const resetForm = () => {
    setForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      bio: '',
      logo_url: '',
    })
    setSaveError('')
  }

  const openAddForm = () => {
    setEditingClient(null)
    resetForm()
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('client-form-top')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const openEditForm = (client) => {
    setEditingClient(client)
    setSaveError('')
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
      document.getElementById('client-form-top')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setSaveError('Logo must be under 2MB')
      return
    }

    setUploadingLogo(true)
    setSaveError('')

    const ext = file.name.split('.').pop().toLowerCase()
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
    if (!allowed.includes(ext)) {
      setSaveError('Only image files are allowed (JPG, PNG, SVG, GIF, WEBP)')
      setUploadingLogo(false)
      return
    }

    const fileName = `client-logos/${user.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      setSaveError(
        uploadError.message.includes('Bucket not found')
          ? 'Storage bucket "logos" not found. Please create it in Supabase Storage.'
          : `Upload failed: ${uploadError.message}`
      )
      setUploadingLogo(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }))
    setUploadingLogo(false)
  }

  const validatePhone = (phone) => {
    if (!phone) return true
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return /^(\+?234|0)[789][01]\d{8}$/.test(cleaned)
  }

 const handleSubmit = async (e) => {
  e.preventDefault()
  e.stopPropagation()

  // Prevent double submission
  if (saving) return

  setSaveError('')

  if (!form.name.trim()) {
    setSaveError('Client name is required')
    return
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    setSaveError('Please enter a valid email address')
    return
  }

  if (form.phone && !validatePhone(form.phone)) {
    setSaveError('Please enter a valid Nigerian phone number')
    return
  }

  setSaving(true)

  // Full payload with all columns
  const fullPayload = {
    name: form.name.trim(),
    email: form.email?.trim() || null,
    phone: form.phone?.trim() || null,
    address: form.address?.trim() || null,
    company: form.company?.trim() || null,
    bio: form.bio?.trim() || null,
    logo_url: form.logo_url || null,
  }

  // Base payload (original columns only — fallback)
  const basePayload = {
    name: form.name.trim(),
    email: form.email?.trim() || null,
    phone: form.phone?.trim() || null,
    address: form.address?.trim() || null,
  }

  let error = null

  if (editingClient) {
    const result = await supabase
      .from('clients')
      .update(fullPayload)
      .eq('id', editingClient.id)
      .eq('user_id', user.id)
    error = result.error
  } else {
    const result = await supabase
      .from('clients')
      .insert({ ...fullPayload, user_id: user.id })
    error = result.error
  }

  // If schema error on extended columns, retry with base columns
  if (error && error.code === 'PGRST204') {
    console.warn('Falling back to base columns:', error.message)
    let retryResult
    if (editingClient) {
      retryResult = await supabase
        .from('clients')
        .update(basePayload)
        .eq('id', editingClient.id)
        .eq('user_id', user.id)
    } else {
      retryResult = await supabase
        .from('clients')
        .insert({ ...basePayload, user_id: user.id })
    }
    error = retryResult.error
  }

  if (error) {
    console.error('Client save error:', error)
    setSaveError(`Failed to save: ${error.message}`)
    setSaving(false)
    return
  }

  // Success
  setShowForm(false)
  setEditingClient(null)
  resetForm()
  await loadClients()
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
      alert(`Portal link copied!\n\n${link}\n\nShare with your client so they can view all their invoices online.`)
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
    transition: 'border-color 0.2s, background 0.3s',
    boxSizing: 'border-box',
  }

  const lbl = {
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
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + Add Client
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div
          id="client-form-top"
          style={{
            background: colors.bgCard,
            border: `1px solid ${editingClient
              ? `${colors.purple}50`
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
          }}>
            {editingClient ? `✏️ Edit — ${editingClient.name}` : '+ New Client'}
          </h3>

          {/* Error */}
          {saveError && (
            <div style={{
              background: isDark ? 'rgba(255,80,80,0.08)' : 'rgba(204,34,0,0.06)',
              border: `1px solid ${colors.danger}40`,
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: colors.danger,
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}>
              ⚠️ {saveError}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Logo Upload */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>CLIENT / COMPANY LOGO</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                padding: '1rem',
                background: colors.bgCard2,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
              }}>
                {/* Preview */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: colors.bgInput,
                  border: `2px dashed ${form.logo_url
                    ? colors.borderGreen
                    : colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt="Logo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : '🏢'}
                </div>

                <div>
                  <label
                    htmlFor={`logo-upload-${editingClient?.id || 'new'}`}
                    style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      background: uploadingLogo ? colors.bgInput : colors.bgCard,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.textSecondary,
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {uploadingLogo
                      ? '⏳ Uploading...'
                      : form.logo_url
                      ? '🔄 Change Logo'
                      : '📤 Upload Logo'}
                  </label>
                  <input
                    id={`logo-upload-${editingClient?.id || 'new'}`}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    color: colors.textMuted,
                    fontSize: '0.7rem',
                    lineHeight: 1.5,
                    marginTop: '0.1rem',
                  }}>
                    PNG, JPG or SVG · Max 2MB<br />
                    Appears on invoices and PDF exports
                  </div>
                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, logo_url: '' }))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: colors.danger,
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        padding: 0,
                        marginTop: '0.3rem',
                        display: 'block',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      ✕ Remove logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fields */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.5rem',
            }}>
              <div>
                <label style={lbl}>CONTACT NAME *</label>
                <input
                  placeholder="e.g. Tola Adeyemi"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  maxLength={80}
                  style={inp}
                />
              </div>

              <div>
                <label style={lbl}>COMPANY NAME</label>
                <input
                  placeholder="e.g. Tola Designs Ltd"
                  value={form.company}
                  onChange={e => setForm(prev => ({ ...prev, company: e.target.value }))}
                  maxLength={100}
                  style={inp}
                />
              </div>

              <div>
                <label style={lbl}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="tola@company.com"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  maxLength={150}
                  style={{
                    ...inp,
                    borderColor: form.email &&
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                      ? colors.danger
                      : colors.border,
                  }}
                />
              </div>

              <div>
                <label style={lbl}>PHONE NUMBER</label>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={form.phone}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9+\-\(\)\s]/g, '')
                    if (val.replace(/\D/g, '').length <= 13) {
                      setForm(prev => ({ ...prev, phone: val }))
                    }
                  }}
                  maxLength={15}
                  style={{
                    ...inp,
                    borderColor: form.phone && !validatePhone(form.phone)
                      ? colors.danger
                      : colors.border,
                  }}
                />
                {form.phone && !validatePhone(form.phone) && (
                  <div style={{
                    color: colors.danger,
                    fontSize: '0.72rem',
                    marginTop: '-0.5rem',
                    marginBottom: '0.5rem',
                  }}>
                    Enter a valid Nigerian number (e.g. 08012345678)
                  </div>
                )}
              </div>

              <div>
                <label style={lbl}>ADDRESS / LOCATION</label>
                <input
                  placeholder="e.g. Ikeja, Lagos"
                  value={form.address}
                  onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  maxLength={150}
                  style={inp}
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label style={lbl}>
                NOTES / BIO{' '}
                <span style={{ color: colors.textMuted, fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <textarea
                placeholder="e.g. Fashion designer. Prefers invoice within 7 days. Met at Lagos Fashion Week 2024."
                value={form.bio}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                maxLength={500}
                style={{
                  ...inp,
                  resize: 'vertical',
                  lineHeight: 1.6,
                  marginBottom: '0.25rem',
                }}
              />
              <div style={{
                color: colors.textMuted,
                fontSize: '0.7rem',
                textAlign: 'right',
                marginBottom: '1.25rem',
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
                  padding: '0.75rem 1.8rem',
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
                  cursor: saving || uploadingLogo ? 'not-allowed' : 'pointer',
                  opacity: saving || uploadingLogo ? 0.7 : 1,
                  transition: 'all 0.2s',
                  minWidth: '130px',
                }}
              >
                {saving
                  ? 'Saving...'
                  : uploadingLogo
                  ? 'Uploading...'
                  : editingClient
                  ? '✓ Save Changes'
                  : 'Add Client'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingClient(null)
                  resetForm()
                }}
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

      {/* List */}
      {loading ? (
        <div style={{
          color: colors.textMuted,
          textAlign: 'center',
          marginTop: '3rem',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Loading clients...
        </div>
      ) : clients.length === 0 ? (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
          <p style={{
            color: colors.textPrimary,
            fontWeight: 500,
            marginBottom: '0.4rem',
          }}>
            No clients yet
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
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
            <div
              key={client.id}
              style={{
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
              {/* Avatar + Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flex: 1,
                minWidth: '200px',
              }}>
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

                <div style={{ minWidth: 0 }}>
                  <div style={{
                    color: colors.textPrimary,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    fontFamily: 'Syne, sans-serif',
                    marginBottom: '0.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    flexWrap: 'wrap',
                  }}>
                    {client.name}
                    {client.company && (
                      <span style={{
                        color: colors.textMuted,
                        fontWeight: 400,
                        fontSize: '0.8rem',
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
                    {client.email ? (
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '180px',
                      }}>
                        {client.email}
                      </span>
                    ) : null}
                    {client.email && client.phone && <span>·</span>}
                    {client.phone ? <span>{client.phone}</span> : null}
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
                      fontSize: '0.72rem',
                      marginTop: '0.15rem',
                      fontStyle: 'italic',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '280px',
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
                gap: '0.4rem',
                flexWrap: 'wrap',
                flexShrink: 0,
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
                    whiteSpace: 'nowrap',
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
                    whiteSpace: 'nowrap',
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
          ))}
        </div>
      )}
    </AppLayout>
  )
}

export default Clients