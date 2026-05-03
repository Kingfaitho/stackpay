import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'

// Public pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import ClientPortal from './pages/ClientPortal'
import InvoicePayment from './pages/InvoicePayment'

// App pages
import Dashboard from './pages/app/Dashboard'
import Invoices from './pages/app/Invoices'
import Clients from './pages/app/Clients'
import Expenses from './pages/app/Expenses'
import CashReceipts from './pages/app/CashReceipts'
import Inventory from './pages/app/Inventory'
import CashFlow from './pages/app/CashFlow'
import Collections from './pages/app/Collections'
import Budget from './pages/app/Budget'
import Reports from './pages/app/Reports'
import Notes from './pages/app/Notes'
import Recurring from './pages/app/Recurring'
import Team from './pages/app/Team'
import Billing from './pages/app/Billing'
import Profile from './pages/app/Profile'
import Admin from './pages/Admin'

// Protected route wrapper
import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#060908',
      color: '#8A9E92',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.9rem',
    }}>
      Loading...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>

              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/portal/:clientId" element={<ClientPortal />} />
              <Route path="/pay/:invoiceId" element={<InvoicePayment />} />

              {/* Protected app routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/invoices" element={
                <ProtectedRoute><Invoices /></ProtectedRoute>
              } />
              <Route path="/clients" element={
                <ProtectedRoute><Clients /></ProtectedRoute>
              } />
              <Route path="/expenses" element={
                <ProtectedRoute><Expenses /></ProtectedRoute>
              } />
              <Route path="/cash-receipts" element={
                <ProtectedRoute><CashReceipts /></ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <ProtectedRoute><Inventory /></ProtectedRoute>
              } />
              <Route path="/cashflow" element={
                <ProtectedRoute><CashFlow /></ProtectedRoute>
              } />
              <Route path="/collections" element={
                <ProtectedRoute><Collections /></ProtectedRoute>
              } />
              <Route path="/budget" element={
                <ProtectedRoute><Budget /></ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute><Reports /></ProtectedRoute>
              } />
              <Route path="/notes" element={
                <ProtectedRoute><Notes /></ProtectedRoute>
              } />
              <Route path="/recurring" element={
                <ProtectedRoute><Recurring /></ProtectedRoute>
              } />
              <Route path="/team" element={
                <ProtectedRoute><Team /></ProtectedRoute>
              } />
              <Route path="/billing" element={
                <ProtectedRoute><Billing /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute><Admin /></ProtectedRoute>
              } />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
            <InstallPrompt />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App