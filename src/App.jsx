import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/app/Dashboard'
import Invoices from './pages/app/Invoices'
import Clients from './pages/app/Clients'
import Expenses from './pages/app/Expenses'
import { AuthProvider } from './context/AuthContext'
import './styles/global.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/expenses" element={<Expenses />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
