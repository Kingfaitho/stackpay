import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [strength, setStrength] = useState(0)

  const checkStrength = (pwd) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[a-zA-Z]/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++
    setStrength(score)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (!/[a-zA-Z]/.test(password)) return setError('Password must contain at least one letter')
    if (!/[0-9]/.test(password)) return setError('Password must contain at least one number')
    if (!/[^a-zA-Z0-9]/.test(password)) return setError('Password must contain at least one special character')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  const strengthColors = ['', '#ff4444', '#f5a623', '#00C566', '#00ff88']

  const inp = {
    width: '100%',
    padding: '0.85rem 1.2rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#0F1510',
    color: '#EDF2EF',
    fontSize: '0.95rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '0.75rem',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060908',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 5%',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '2rem',
            color: '#EDF2EF',
            textDecoration: 'none',
          }}>
            Stack<span style={{ color: '#00C566' }}>Pay</span>
          </Link>
          <p style={{ color: '#7A9485', fontSize: '0.95rem', marginTop: '0.4rem' }}>
            Create a new password
          </p>
        </div>

        <div style={{
          background: '#111815',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
        }}>
          {error && (
            <div style={{
              background: 'rgba(255,80,80,0.08)',
              border: '1px solid rgba(255,80,80,0.25)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              color: '#ff8080',
              fontSize: '0.88rem',
              marginBottom: '1.5rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
              NEW PASSWORD
            </label>
            <input
              type="password"
              placeholder="Min 8 chars, number & symbol"
              value={password}
              onChange={e => { setPassword(e.target.value); checkStrength(e.target.value) }}
              required
              style={inp}
            />

            {/* Strength bar */}
            {password.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: strength >= i ? strengthColors[strength] : 'rgba(255,255,255,0.08)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
              </div>
            )}

            <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              placeholder="Repeat your new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={{ ...inp, marginBottom: '1.5rem' }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.95rem',
                borderRadius: '12px',
                background: loading ? '#005a30' : '#00C566',
                color: '#060908',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
