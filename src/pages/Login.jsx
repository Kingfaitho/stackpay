import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) { setError('Invalid email or password. Please try again.'); setLoading(false) }
    else navigate('/dashboard')
  }

  const inp = {
    width: '100%', padding: '0.85rem 1.2rem', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)', background: '#141A16',
    color: '#F0F5F2', fontSize: '0.95rem', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', marginBottom: '1rem',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080C0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 5%' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#F0F5F2', textDecoration: 'none' }}>
            Stack<span style={{ color: '#00C566' }}>Pay</span>
          </Link>
          <p style={{ color: '#8A9E92', fontSize: '0.95rem', marginTop: '0.5rem' }}>Welcome back. Sign in to your account.</p>
        </div>
        <div style={{ background: '#141A16', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2.5rem' }}>
          {error && (
            <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '8px', padding: '0.8rem 1rem', color: '#ff8080', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <label style={{ color: '#8A9E92', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>EMAIL ADDRESS</label>
            <input type="email" placeholder="you@yourbusiness.com" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
            <label style={{ color: '#8A9E92', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>PASSWORD</label>
            <input type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required style={{ ...inp, marginBottom: '1.5rem' }} />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: loading ? '#005a30' : '#00C566', color: '#080C0A', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', color: '#8A9E92', fontSize: '0.88rem', marginTop: '1.5rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#00C566', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
