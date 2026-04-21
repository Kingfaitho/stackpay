import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
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
            Reset your password
          </p>
        </div>

        <div style={{
          background: '#111815',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
        }}>
          {!sent ? (
            <>
              <p style={{
                color: '#7A9485',
                fontSize: '0.9rem',
                marginBottom: '1.8rem',
                lineHeight: 1.7,
              }}>
                Enter the email address linked to your StackPay account.
                We'll send you a link to reset your password.
              </p>

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
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.2rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#0F1510',
                    color: '#EDF2EF',
                    fontSize: '0.95rem',
                    fontFamily: 'DM Sans, sans-serif',
                    outline: 'none',
                    marginBottom: '1.5rem',
                  }}
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
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#EDF2EF',
                marginBottom: '0.75rem',
              }}>
                Check your email
              </h3>
              <p style={{
                color: '#7A9485',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                marginBottom: '1.5rem',
              }}>
                We sent a password reset link to <strong style={{ color: '#EDF2EF' }}>{email}</strong>.
                Check your inbox and spam folder.
              </p>
              <Link to="/login" style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'rgba(0,197,102,0.1)',
                border: '1px solid rgba(0,197,102,0.25)',
                color: '#00C566',
                borderRadius: '10px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}>
                Back to Login
              </Link>
            </div>
          )}

          <p style={{
            textAlign: 'center',
            color: '#7A9485',
            fontSize: '0.88rem',
            marginTop: '1.5rem',
          }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: '#00C566', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
