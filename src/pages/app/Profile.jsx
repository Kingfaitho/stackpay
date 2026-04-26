import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function Profile() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [form, setForm] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    address: '',
    currency: 'NGN',
    logo_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    if (user) loadProfile()
  }, [user])

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) {
      setForm({
        business_name: data.business_name || '',
        owner_name: data.owner_name || '',
        phone: data.phone || '',
        address: data.address || '',
        currency: data.currency || 'NGN',
        logo_url: data.logo_url || '',
      })
    }
    setLoading(false)
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
    const fileName = `business-logos/${user.id}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true })

    if (!error) {
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)
      setForm({ ...form, logo_url: urlData.publicUrl })
    } else {
      alert('Upload failed. Please check your Supabase storage bucket.')
      console.error(error)
    }
    setUploadingLogo(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', user.id)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const inp = {
    width: '100%',
    padding: '0.85rem 1.2rem',
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
    background: colors.bgInput || '#0F1510',
    color: colors.textPrimary || '#F0F5F2',
    fontSize: '0.95rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '1.2rem',
  }

  const labelStyle = {
    color: colors.textMuted || '#8A9E92',
    fontSize: '0.78rem',
    fontWeight: 600,
    display: 'block',
    marginBottom: '0.4rem',
    letterSpacing: '0.5px',
  }

  const currencies = [
    { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi' },
    { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling' },
  ]

  return (
    <AppLayout>
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
          color: colors.textPrimary,
          marginBottom: '0.3rem',
        }}>
          Business Profile
        </h1>
        <p style={{
          color: colors.textSecondary,
          fontSize: '0.9rem',
          marginBottom: '2rem',
        }}>
          This info appears on your invoices and PDFs
        </p>

        {loading ? (
          <div style={{ color: colors.textMuted }}>Loading profile...</div>
        ) : (
          <div style={{
            background: colors.bgCard || '#141A16',
            border: `1px solid ${colors.border}`,
            borderRadius: '20px',
            padding: '2rem',
          }}>

            {saved && (
              <div style={{
                background: 'rgba(0,197,102,0.08)',
                border: '1px solid rgba(0,197,102,0.2)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                color: colors.green || '#00C566',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                ✓ Profile saved successfully!
              </div>
            )}

            <form onSubmit={handleSave}>
              <label style={labelStyle}>BUSINESS NAME</label>
              <input
                placeholder="e.g. Chidi's Electronics"
                value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                style={inp}
              />

              <label style={labelStyle}>OWNER NAME</label>
              <input
                placeholder="e.g. Chidi Okeke"
                value={form.owner_name}
                onChange={e => setForm({ ...form, owner_name: e.target.value })}
                style={inp}
              />

              {/* Business Logo Upload */}
              <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>
                BUSINESS LOGO
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: colors.bgSidebar || 'rgba(255,255,255,0.02)',
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
              }}>
                {/* Logo preview */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: colors.bgInput,
                  border: `2px dashed ${form.logo_url ? colors.green : colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt="Business logo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.8rem' }}>🏢</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="business-logo-upload"
                    style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      background: colors.bgCard,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.textPrimary,
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: '0.4rem',
                    }}
                  >
                    {uploadingLogo
                      ? 'Uploading...'
                      : form.logo_url
                        ? '🔄 Change Logo'
                        : '📤 Upload Logo'}
                  </label>
                  <input
                    id="business-logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    color: colors.textMuted,
                    fontSize: '0.72rem',
                    lineHeight: 1.5,
                  }}>
                    Appears on invoices and PDF exports.<br />
                    PNG or JPG, max 2MB.
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
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>

              <label style={labelStyle}>PHONE NUMBER</label>
              <input
                placeholder="080xxxxxxxx"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={inp}
              />

              <label style={labelStyle}>BUSINESS ADDRESS</label>
              <input
                placeholder="e.g. 14 Adeola Odeku, Victoria Island, Lagos"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={inp}
              />

              {/* Currency Switcher */}
              <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>
                DEFAULT CURRENCY
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}>
                {currencies.map(cur => (
                  <div
                    key={cur.code}
                    onClick={() => setForm({ ...form, currency: cur.code })}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: '10px',
                      border: form.currency === cur.code
                        ? `1px solid ${colors.green}60`
                        : `1px solid ${colors.border}`,
                      background: form.currency === cur.code
                        ? `${colors.green}15`
                        : colors.bgInput,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      color: form.currency === cur.code
                        ? colors.green
                        : colors.textMuted,
                      marginBottom: '0.2rem',
                    }}>
                      {cur.symbol}
                    </div>
                    <div style={{
                      color: form.currency === cur.code
                        ? colors.green
                        : colors.textSecondary,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}>
                      {cur.code}
                    </div>
                    <div style={{
                      color: colors.textMuted,
                      fontSize: '0.65rem',
                      marginTop: '0.1rem',
                    }}>
                      {cur.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Account Info — Read Only */}
              <div style={{
                background: colors.bgSidebar,
                borderRadius: '10px',
                padding: '1rem 1.2rem',
                marginBottom: '1.8rem',
                border: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  color: colors.textMuted,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                  letterSpacing: '0.5px',
                }}>
                  EMAIL ADDRESS (CANNOT BE CHANGED)
                </div>
                <div style={{
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                }}>
                  {user?.email}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  background: saving ? colors.green + '80' : colors.green,
                  color: '#080C0A',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => {
                  if (!saving) e.currentTarget.style.filter = 'brightness(0.9)'
                }}
                onMouseLeave={e => {
                  if (!saving) e.currentTarget.style.filter = 'none'
                }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default Profile