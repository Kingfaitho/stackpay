import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)

  const isLocked = lockedUntil && new Date() < new Date(lockedUntil)

  const getRemainingMinutes = () => {
    if (!lockedUntil) return 0
    const diff = new Date(lockedUntil) - new Date()
    return Math.ceil(diff / 60000)
  }

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isLocked) {
      setError(`Too many failed attempts. Try again in ${getRemainingMinutes()} minute(s).`)
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)

    if (error) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockTime = new Date(
          Date.now() + LOCKOUT_MINUTES * 60 * 1000
        ).toISOString()
        setLockedUntil(lockTime)
        setError(
          `Account temporarily locked after ${MAX_ATTEMPTS} failed attempts. ` +
          `Try again in ${LOCKOUT_MINUTES} minutes.`
        )
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts
        setError(
          `Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`
        )
      }
      setLoading(false)
    } else {
      setAttempts(0)
      navigate('/dashboard')
    }
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
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0,197,102,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>

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
            Welcome back. Sign in to your account.
          </p>
        </div>

        <div style={{
          background: '#111815',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
        }}>

          {/* Lockout Warning */}
          {isLocked && (
            <div style={{
              background: 'rgba(255,80,80,0.08)',
              border: '1px solid rgba(255,80,80,0.25)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}>
              <span>🔒</span>
              <p style={{ color: '#ff8080', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Account temporarily locked.
                Try again in <strong>{getRemainingMinutes()} minute(s)</strong>.
              </p>
            </div>
          )}

          {/* Error */}
          {error && !isLocked && (
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

          {/* Attempt counter */}
          {attempts > 0 && attempts < MAX_ATTEMPTS && !isLocked && (
            <div style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '1rem',
            }}>
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div key={i} style={{
                  flex: 1,
                  height: '3px',
                  borderRadius: '2px',
                  background: i < attempts
                    ? '#ff8080'
                    : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <label style={{
              color: '#8A9E92',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: '0.4rem',
            }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              placeholder="you@yourbusiness.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLocked}
              style={{
                ...inp,
                marginBottom: '1rem',
                opacity: isLocked ? 0.5 : 1,
              }}
            />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.4rem',
            }}>
              <label style={{
                color: '#8A9E92',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}>
                PASSWORD
              </label>
              <Link to="/forgot-password" style={{
                color: '#7A9485',
                fontSize: '0.78rem',
                textDecoration: 'none',
                fontWeight: 500,
              }}>
                Forgot password?
              </Link>
            </div>

            {/* Password field with toggle */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLocked}
                style={{
                  ...inp,
                  paddingRight: '3rem',
                  opacity: isLocked ? 0.5 : 1,
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#00C566'}
                onMouseLeave={e => e.currentTarget.style.color = '#7A9485'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              style={{
                width: '100%',
                padding: '0.95rem',
                borderRadius: '12px',
                background: isLocked
                  ? '#1a1a1a'
                  : loading
                  ? '#005a30'
                  : '#00C566',
                color: isLocked ? '#4A6055' : '#060908',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                cursor: loading || isLocked ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => {
                if (!loading && !isLocked) {
                  e.currentTarget.style.background = '#00A855'
                }
              }}
              onMouseLeave={e => {
                if (!loading && !isLocked) {
                  e.currentTarget.style.background = '#00C566'
                }
              }}
            >
              {loading ? 'Signing in...' : isLocked ? '🔒 Account Locked' : 'Sign In'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            color: '#7A9485',
            fontSize: '0.88rem',
            marginTop: '1.5rem',
          }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{
              color: '#00C566',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              Create one free
            </Link>
          </p>
        </div>

        <p style={{
          textAlign: 'center',
          color: '#4A6055',
          fontSize: '0.75rem',
          marginTop: '1.2rem',
        }}>
          🔒 Your connection is encrypted and secure
        </p>
      </div>
    </div>
  )
}

export default Login
