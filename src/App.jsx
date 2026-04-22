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

function App() {
  return (
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
          <Route path="/clients" element={
            <ProtectedRoute><Clients /></ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute><Expenses /></ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
