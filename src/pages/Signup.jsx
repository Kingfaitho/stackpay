import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    businessName: '', ownerName: '', email: '', password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const checkStrength = (password) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[0-9]/.test(password)) score++
    if (/[a-zA-Z]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    setPasswordStrength(score)
  }

  const validatePassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
    if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain at least one special character (e.g. @, #, !)'
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (name === 'password') checkStrength(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const passwordError = validatePassword(form.password)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }

    const { error } = await signUp(
      form.email,
      form.password,
      form.businessName,
      form.ownerName
    )

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  const strengthLabels = ['', 'Weak — needs letters, numbers & symbols', 'Fair — getting better', 'Good — almost there', 'Strong — great password ✓']
  const strengthColors = ['', '#ff4444', '#f5a623', '#00C566', '#00ff88']

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
    marginBottom: '1rem',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    color: '#8A9E92',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '0.4rem',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060908',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 5%',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0,197,102,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '2rem',
            color: '#EDF2EF',
            textDecoration: 'none',
            display: 'inline-block',
          }}>
            Stack<span style={{ color: '#00C566' }}>Pay</span>
          </Link>
          <p style={{
            color: '#7A9485',
            fontSize: '0.95rem',
            marginTop: '0.4rem',
          }}>
            Create your free business account
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#111815',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
        }}>

          {/* Error message */}
          {error && (
            <div style={{
              background: 'rgba(255,80,80,0.08)',
              border: '1px solid rgba(255,80,80,0.25)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              color: '#ff8080',
              fontSize: '0.88rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Business Name */}
            <label style={labelStyle}>BUSINESS NAME</label>
            <input
              name="businessName"
              placeholder="e.g. Adunola's Boutique"
              value={form.businessName}
              onChange={handleChange}
              required
              style={inp}
            />

            {/* Owner Name */}
            <label style={labelStyle}>YOUR NAME</label>
            <input
              name="ownerName"
              placeholder="e.g. Adunola Bello"
              value={form.ownerName}
              onChange={handleChange}
              required
              style={inp}
            />

            {/* Email */}
            <label style={labelStyle}>EMAIL ADDRESS</label>
            <input
              name="email"
              type="email"
              placeholder="you@yourbusiness.com"
              value={form.email}
              onChange={handleChange}
              required
              style={inp}
            />

            {/* Password */}
            <label style={labelStyle}>PASSWORD</label>
            <input
              name="password"
              type="password"
              placeholder="Min 8 chars, include number & symbol"
              value={form.password}
              onChange={handleChange}
              required
              style={{ ...inp, marginBottom: '0.5rem' }}
            />

            {/* Password strength bar */}
            {form.password.length > 0 && (
              <div style={{ marginBottom: '1.2rem' }}>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '0.4rem',
                }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      background: passwordStrength >= i
                        ? strengthColors[passwordStrength]
                        : 'rgba(255,255,255,0.08)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  color: strengthColors[passwordStrength] || '#7A9485',
                  fontWeight: 500,
                }}>
                  {strengthLabels[passwordStrength]}
                </div>
              </div>
            )}

            {/* Password requirements hint */}
            <div style={{
              background: 'rgba(0,197,102,0.04)',
              border: '1px solid rgba(0,197,102,0.1)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                color: '#4A6055',
                fontSize: '0.78rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
                letterSpacing: '0.3px',
              }}>
                PASSWORD REQUIREMENTS
              </div>
              {[
                { rule: 'At least 8 characters', met: form.password.length >= 8 },
                { rule: 'At least one letter (a-z)', met: /[a-zA-Z]/.test(form.password) },
                { rule: 'At least one number (0-9)', met: /[0-9]/.test(form.password) },
                { rule: 'At least one symbol (@, #, !, etc.)', met: /[^a-zA-Z0-9]/.test(form.password) },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: item.met ? '#00C566' : '#4A6055',
                  marginBottom: '0.25rem',
                  transition: 'color 0.2s',
                }}>
                  <span style={{ fontSize: '0.7rem' }}>
                    {item.met ? '✓' : '○'}
                  </span>
                  {item.rule}
                </div>
              ))}
            </div>

            {/* Submit button */}
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
                transition: 'background 0.2s',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#00A855' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#00C566' }}
            >
              {loading ? 'Creating your account...' : 'Create Free Account →'}
            </button>
          </form>

          {/* Sign in link */}
          <p style={{
            textAlign: 'center',
            color: '#7A9485',
            fontSize: '0.88rem',
            marginTop: '1.5rem',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: '#00C566',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              Sign in
            </Link>
          </p>
        </div>

        {/* Bottom trust note */}
        <p style={{
          textAlign: 'center',
          color: '#4A6055',
          fontSize: '0.78rem',
          marginTop: '1.2rem',
        }}>
          🔒 Your data is encrypted and secure. We never share your information.
        </p>
      </div>
    </div>
  )
}

export default Signup
