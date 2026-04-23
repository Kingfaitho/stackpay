import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('StackPay Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#060908',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 1.5rem',
            }}>
              ⚠️
            </div>

            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.5rem',
              color: '#F0F5F2',
              marginBottom: '0.75rem',
            }}>
              Something went wrong
            </h1>

            <p style={{
              color: '#7A9485',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}>
              StackPay hit an unexpected error. Your data is safe.
              Please refresh the page or contact support if this persists.
            </p>

            <div style={{
              background: '#111815',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}>
              <p style={{
                color: '#4A6055',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}>
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#00C566',
                  color: '#080C0A',
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#8A9E92',
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
