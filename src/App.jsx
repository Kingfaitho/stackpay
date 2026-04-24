import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/app/Dashboard'
import Invoices from './pages/app/Invoices'
import Clients from './pages/app/Clients'
import Expenses from './pages/app/Expenses'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import './styles/global.css'
import Profile from './pages/app/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Billing from './pages/app/Billing'
import Reports from './pages/app/Reports'
import Team from './pages/app/Team'
import Recurring from './pages/app/Recurring'
import ClientPortal from './pages/ClientPortal'
import Admin from './pages/Admin'
import InstallPrompt from './components/InstallPrompt'
import InvoicePayment from './pages/InvoicePayment'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/reports" element={
  <ProtectedRoute><Reports /></ProtectedRoute>
} />
<Route path="/billing" element={
  <ProtectedRoute><Billing /></ProtectedRoute>
} />
          <Route path="/profile" element={
  <ProtectedRoute><Profile /></ProtectedRoute>
} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute><Invoices /></ProtectedRoute>
          } />
          <Route path="/pay/:invoiceId" element={<InvoicePayment />} />
          <Route path="/team" element={
  <ProtectedRoute><Team /></ProtectedRoute>
} />
<Route path="/admin" element={<Admin />} />
<Route path="/recurring" element={
  <ProtectedRoute><Recurring /></ProtectedRoute>
} />
<Route path="/portal/:clientId" element={<ClientPortal />} />
          <Route path="/clients" element={
            <ProtectedRoute><Clients /></ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute><Expenses /></ProtectedRoute>
          } />
        </Routes>
        <InstallPrompt />
      </Router>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App
