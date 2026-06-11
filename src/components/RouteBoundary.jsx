import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, RotateCw } from 'lucide-react'

// Per-page error compartment. If one page throws, only that page shows this
// fallback; the rest of Ledga keeps working. Navigating away always works
// because the boundary is keyed by pathname (a fresh route remounts it), and
// "Try again" remounts just the broken page.
class Boundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Ledga page error:', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    // A failed lazy-chunk fetch usually means a new version was deployed
    // while the user had an old tab open; a reload fetches fresh chunks.
    const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i
      .test(this.state.error?.message || '')

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060908',
        padding: '2rem',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        <div style={{
          maxWidth: '420px',
          width: '100%',
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(245,166,35,0.1)',
            border: '1px solid rgba(245,166,35,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <AlertTriangle size={22} color="#f5a623" strokeWidth={2} />
          </div>

          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.15rem',
            color: '#EDF2EF',
            marginBottom: '0.5rem',
            letterSpacing: '-0.3px',
          }}>
            {isChunkError ? 'Ledga was updated' : 'This page hit a problem'}
          </h2>

          <p style={{
            color: '#7A9485',
            fontSize: '0.86rem',
            lineHeight: 1.7,
            marginBottom: '1.5rem',
          }}>
            {isChunkError
              ? 'A new version of Ledga is live. Refresh to load it. Nothing was lost.'
              : 'Only this page is affected. The rest of Ledga is working fine and your data is safe.'}
          </p>

          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (isChunkError) {
                  window.location.reload()
                } else {
                  this.setState({ hasError: false, error: null })
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.7rem 1.3rem',
                background: '#00C566',
                color: '#060908',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <RotateCw size={14} strokeWidth={2.5} />
              {isChunkError ? 'Refresh' : 'Try Again'}
            </button>
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.7rem 1.3rem',
                background: 'transparent',
                color: '#8A9E92',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <ArrowLeft size={14} strokeWidth={2.5} /> Dashboard
            </Link>
          </div>

          {!isChunkError && this.state.error?.message && (
            <p style={{
              color: '#4A6055',
              fontSize: '0.68rem',
              marginTop: '1.25rem',
              fontFamily: 'monospace',
              wordBreak: 'break-word',
            }}>
              {this.state.error.message}
            </p>
          )}
        </div>
      </div>
    )
  }
}

// Keyed by pathname so every navigation gets a clean boundary: leaving a
// broken page clears the error, and revisiting it retries from scratch.
export default function RouteBoundary({ children }) {
  const location = useLocation()
  return <Boundary key={location.pathname}>{children}</Boundary>
}
