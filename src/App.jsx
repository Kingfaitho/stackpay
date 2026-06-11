import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import RouteBoundary from './components/RouteBoundary'
import InstallPrompt from './components/InstallPrompt'

// Landing stays eager so the first paint is instant
import LandingPage from './pages/LandingPage'

// Everything else loads on demand to keep the initial bundle small
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const ClientPortal = lazy(() => import('./pages/ClientPortal'))
const InvoicePayment = lazy(() => import('./pages/InvoicePayment'))

const Dashboard = lazy(() => import('./pages/app/Dashboard'))
const Invoices = lazy(() => import('./pages/app/Invoices'))
const Clients = lazy(() => import('./pages/app/Clients'))
const POS = lazy(() => import('./pages/app/POS'))
const WorkOrders = lazy(() => import('./pages/app/WorkOrders'))
const ClientInsights = lazy(() => import('./pages/app/ClientInsights'))
const Expenses = lazy(() => import('./pages/app/Expenses'))
const CashReceipts = lazy(() => import('./pages/app/CashReceipts'))
const Inventory = lazy(() => import('./pages/app/Inventory'))
const CashFlow = lazy(() => import('./pages/app/CashFlow'))
const Collections = lazy(() => import('./pages/app/Collections'))
const Budget = lazy(() => import('./pages/app/Budget'))
const Reports = lazy(() => import('./pages/app/Reports'))
const Notes = lazy(() => import('./pages/app/Notes'))
const Recurring = lazy(() => import('./pages/app/Recurring'))
const Team = lazy(() => import('./pages/app/Team'))
const Billing = lazy(() => import('./pages/app/Billing'))
const Profile = lazy(() => import('./pages/app/Profile'))
const Admin = lazy(() => import('./pages/Admin'))
const Help = lazy(() => import('./pages/app/Help'))

// Protected route wrapper
import { useAuth } from './context/AuthContext'

function ScreenLoader() {
  return (
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
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <ScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <RouteBoundary>
              <Suspense fallback={<ScreenLoader />}>
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
                <Route path="/onboarding" element={
                  <ProtectedRoute><Onboarding /></ProtectedRoute>
                } />
                <Route path="/invoices" element={
                  <ProtectedRoute><Invoices /></ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute><Clients /></ProtectedRoute>
                } />
                <Route path="/pos" element={
                  <ProtectedRoute><POS /></ProtectedRoute>
                } />
                <Route path="/work-orders" element={
                  <ProtectedRoute><WorkOrders /></ProtectedRoute>
                } />
                <Route path="/client-insights" element={
                  <ProtectedRoute><ClientInsights /></ProtectedRoute>
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
                <Route path="/help" element={
                  <ProtectedRoute><Help /></ProtectedRoute>
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
              </Suspense>
            </RouteBoundary>
            <InstallPrompt />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
