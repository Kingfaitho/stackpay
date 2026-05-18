import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('StackPay Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#060908',
          padding: '2rem',
          fontFamily: 'DM Sans, sans-serif',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.2rem',
            color: '#EDF2EF',
            marginBottom: '0.5rem',
          }}>
            Something went wrong
          </h2>
          <p style={{
            color: '#8A9E92',
            fontSize: '0.88rem',
            marginBottom: '0.25rem',
          }}>
            Ledga hit an unexpected error. Your data is safe.
          </p>
          <p style={{
            color: '#4A6055',
            fontSize: '0.75rem',
            marginBottom: '1.5rem',
            fontFamily: 'monospace',
          }}>
            {this.state.error?.message}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#00C566',
                color: '#060908',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/dashboard'
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#8A9E92',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary