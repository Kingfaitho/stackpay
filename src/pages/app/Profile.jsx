import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    address: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

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
      })
    }
    setLoading(false)
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
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#0F1510',
    color: '#F0F5F2',
    fontSize: '0.95rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '1.2rem',
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
          color: '#F0F5F2',
          marginBottom: '0.3rem',
        }}>
          Business Profile
        </h1>
        <p style={{ color: '#8A9E92', fontSize: '0.9rem', marginBottom: '2rem' }}>
          This info appears on your invoices
        </p>

        {loading ? (
          <div style={{ color: '#8A9E92' }}>Loading profile...</div>
        ) : (
          <div style={{
            background: '#141A16',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '2rem',
          }}>
            {saved && (
              <div style={{
                background: 'rgba(0,197,102,0.1)',
                border: '1px solid rgba(0,197,102,0.25)',
                borderRadius: '8px',
                padding: '0.8rem 1rem',
                color: '#00C566',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
                fontWeight: 600,
              }}>
                ✓ Profile saved successfully!
              </div>
            )}

            <form onSubmit={handleSave}>
              <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                BUSINESS NAME
              </label>
              <input
                placeholder="e.g. Chidi's Electronics"
                value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                style={inp}
              />

              <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                OWNER NAME
              </label>
              <input
                placeholder="e.g. Chidi Okeke"
                value={form.owner_name}
                onChange={e => setForm({ ...form, owner_name: e.target.value })}
                style={inp}
              />

              <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                PHONE NUMBER
              </label>
              <input
                placeholder="080xxxxxxxx"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={inp}
              />

              <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                BUSINESS ADDRESS
              </label>
              <input
                placeholder="e.g. 14 Adeola Odeku, Victoria Island, Lagos"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={{ ...inp, marginBottom: '1.8rem' }}
              />

              {/* Account Info — Read Only */}
              <div style={{
                background: '#0F1510',
                borderRadius: '10px',
                padding: '1rem 1.2rem',
                marginBottom: '1.8rem',
              }}>
                <div style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                  EMAIL ADDRESS
                </div>
                <div style={{ color: '#F0F5F2', fontSize: '0.95rem' }}>
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
                  background: saving ? '#005a30' : '#00C566',
                  color: '#080C0A',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
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
