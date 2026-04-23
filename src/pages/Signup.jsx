import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  const checkStrength = (password) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[0-9]/.test(password)) score++
    if (/[a-zA-Z]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    setPasswordStrength(score)
  }

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePhone = (phone) => {
    if (!phone) return true
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return /^(\+?234|0)[789][01]\d{8}$/.test(cleaned)
  }

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return 'Password must contain at least one special character (@, #, !, etc.)'
    }
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      const cleaned = value.replace(/[^0-9+\-\(\)\s]/g, '')
      if (cleaned.replace(/\D/g, '').length > 13) return
      setForm({ ...form, [name]: cleaned })
      return
    }
    setForm({ ...form, [name]: value })
    if (name === 'password') checkStrength(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    if (form.phone && !validatePhone(form.phone)) {
      setError('Please enter a valid Nigerian phone number (e.g. 08012345678).')
      setLoading(false)
      return
    }

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
      if (error.message.includes('already registered')) {
        setError('An account with this email already exists. Try logging in.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  const strengthLabels = [
    '',
    'Weak — add numbers, letters & symbols',
    'Fair — getting stronger',
    'Good — almost there',
    'Strong — excellent password ✓',
  ]

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

      <div style={{
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
      }}>

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
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              lineHeight: 1.5,
            }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <label style={labelStyle}>BUSINESS NAME *</label>
            <input
              name="businessName"
              placeholder="e.g. Adunola's Boutique"
              value={form.businessName}
              onChange={handleChange}
              required
              maxLength={100}
              style={inp}
            />

            <label style={labelStyle}>YOUR NAME *</label>
            <input
              name="ownerName"
              placeholder="e.g. Adunola Bello"
              value={form.ownerName}
              onChange={handleChange}
              required
              maxLength={80}
              style={inp}
            />

            <label style={labelStyle}>EMAIL ADDRESS *</label>
            <input
              name="email"
              type="email"
              placeholder="you@yourbusiness.com"
              value={form.email}
              onChange={handleChange}
              required
              maxLength={150}
              style={{
                ...inp,
                borderColor: form.email && !validateEmail(form.email)
                  ? 'rgba(255,80,80,0.4)'
                  : 'rgba(255,255,255,0.1)',
              }}
            />
            {form.email && !validateEmail(form.email) && (
              <div style={{
                color: '#ff8080',
                fontSize: '0.78rem',
                marginTop: '-0.75rem',
                marginBottom: '1rem',
              }}>
                Please enter a valid email address
              </div>
            )}

            <label style={labelStyle}>
              PHONE NUMBER{' '}
              <span style={{ color: '#4A6055', fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="e.g. 08012345678"
              value={form.phone}
              onChange={handleChange}
              maxLength={15}
              style={{
                ...inp,
                borderColor: form.phone && !validatePhone(form.phone)
                  ? 'rgba(255,80,80,0.4)'
                  : 'rgba(255,255,255,0.1)',
              }}
            />
            {form.phone && !validatePhone(form.phone) && (
              <div style={{
                color: '#ff8080',
                fontSize: '0.78rem',
                marginTop: '-0.75rem',
                marginBottom: '1rem',
              }}>
                Enter a valid Nigerian number (e.g. 08012345678)
              </div>
            )}

            <label style={labelStyle}>PASSWORD *</label>
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 chars, number & symbol"
                value={form.password}
                onChange={handleChange}
                required
                style={{
                  ...inp,
                  paddingRight: '3rem',
                  marginBottom: 0,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#7A9485',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0.25rem',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#00C566'}
                onMouseLeave={e => e.currentTarget.style.color = '#7A9485'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>

            {/* Strength Bar */}
            {form.password.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '0.35rem',
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
                }}>
                  {strengthLabels[passwordStrength]}
                </div>
              </div>
            )}

            {/* Password Requirements */}
            <div style={{
              background: 'rgba(0,197,102,0.03)',
              border: '1px solid rgba(0,197,102,0.08)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                color: '#4A6055',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                letterSpacing: '0.3px',
              }}>
                PASSWORD REQUIREMENTS
              </div>
              {[
                { rule: 'At least 8 characters', met: form.password.length >= 8 },
                { rule: 'At least one letter', met: /[a-zA-Z]/.test(form.password) },
                { rule: 'At least one number', met: /[0-9]/.test(form.password) },
                { rule: 'At least one symbol (@, #, !)', met: /[^a-zA-Z0-9]/.test(form.password) },
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
                  <span style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                    {item.met ? '✓' : '○'}
                  </span>
                  {item.rule}
                </div>
              ))}
            </div>

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
              onMouseEnter={e => {
                if (!loading) e.currentTarget.style.background = '#00A855'
              }}
              onMouseLeave={e => {
                if (!loading) e.currentTarget.style.background = '#00C566'
              }}
            >
              {loading ? 'Creating your account...' : 'Create Free Account →'}
            </button>
          </form>

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

        <p style={{
          textAlign: 'center',
          color: '#4A6055',
          fontSize: '0.75rem',
          marginTop: '1.2rem',
        }}>
          🔒 Your data is encrypted. We never share your information.
        </p>
      </div>
    </div>
  )
}

export default Signup
