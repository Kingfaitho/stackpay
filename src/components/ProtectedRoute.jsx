import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: '#080C0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#00C566',
      fontFamily: 'Syne, sans-serif',
      fontWeight: 700,
      fontSize: '1rem',
    }}>
      Loading StackPay...
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  return children
}

export default ProtectedRoute
