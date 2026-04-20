import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#141A16',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      padding: '1.5rem',
    }}>
      <div style={{
        color: '#8A9E92',
        fontSize: '0.82rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: '0.75rem',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
        color: color || '#F0F5F2',
        letterSpacing: '-0.5px',
        marginBottom: '0.3rem',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: '#8A9E92', fontSize: '0.82rem' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    profit: 0,
    unpaidInvoices: 0,
    totalClients: 0,
    recentInvoices: [],
  })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadDashboard()
  }, [user])

  const loadDashboard = async () => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // Load invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)

      // Load expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)

      // Load clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)

      const totalIncome = invoices
        ?.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.total), 0) || 0

      const totalExpenses = expenses
        ?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

      const unpaidInvoices = invoices
        ?.filter(i => i.status === 'unpaid').length || 0

      setStats({
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
        unpaidInvoices,
        totalClients: clients?.length || 0,
        recentInvoices: invoices?.slice(0, 5) || [],
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)

  if (loading) return (
    <AppLayout>
      <div style={{ color: '#8A9E92', textAlign: 'center', marginTop: '3rem' }}>
        Loading your dashboard...
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
          color: '#F0F5F2',
          marginBottom: '0.3rem',
        }}>
          Welcome back{profile?.owner_name ? `, ${profile.owner_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p style={{ color: '#8A9E92', fontSize: '0.9rem' }}>
          Here's how {profile?.business_name || 'your business'} is doing
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <StatCard
          label="Total Income"
          value={formatNaira(stats.totalIncome)}
          sub="From paid invoices"
          color="#00C566"
        />
        <StatCard
          label="Total Expenses"
          value={formatNaira(stats.totalExpenses)}
          sub="All logged costs"
          color="#ff8080"
        />
        <StatCard
          label="Net Profit"
          value={formatNaira(stats.profit)}
          sub="Income minus expenses"
          color={stats.profit >= 0 ? '#00C566' : '#ff8080'}
        />
        <StatCard
          label="Unpaid Invoices"
          value={stats.unpaidInvoices}
          sub="Awaiting payment"
          color="#f5a623"
        />
        <StatCard
          label="Total Clients"
          value={stats.totalClients}
          sub="Active clients"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '1rem',
          color: '#F0F5F2',
          marginBottom: '1rem',
        }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}>
          {[
            { label: '+ New Invoice', path: '/invoices', color: '#00C566', textColor: '#080C0A' },
            { label: '+ Add Client', path: '/clients', color: 'transparent', textColor: '#F0F5F2' },
            { label: '+ Log Expense', path: '/expenses', color: 'transparent', textColor: '#F0F5F2' },
          ].map((action) => (
            <Link
              key={action.path}
              to={action.path}
              style={{
                padding: '0.65rem 1.2rem',
                borderRadius: '10px',
                background: action.color,
                color: action.textColor,
                border: action.color === 'transparent'
                  ? '1px solid rgba(255,255,255,0.1)'
                  : 'none',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Invoices */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            color: '#F0F5F2',
          }}>
            Recent Invoices
          </h2>
          <Link to="/invoices" style={{
            color: '#00C566',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            View all →
          </Link>
        </div>

        {stats.recentInvoices.length === 0 ? (
          <div style={{
            background: '#141A16',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            color: '#8A9E92',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</div>
            <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
              No invoices yet. Create your first one!
            </p>
            <Link to="/invoices" style={{
              display: 'inline-block',
              padding: '0.6rem 1.2rem',
              background: '#00C566',
              color: '#080C0A',
              borderRadius: '8px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
            }}>
              Create Invoice
            </Link>
          </div>
        ) : (
          <div style={{
            background: '#141A16',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            {stats.recentInvoices.map((inv, i) => (
              <div key={inv.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: i < stats.recentInvoices.length - 1
                  ? '1px solid rgba(255,255,255,0.05)'
                  : 'none',
              }}>
                <div>
                  <div style={{
                    color: '#F0F5F2',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    marginBottom: '0.2rem',
                  }}>
                    {inv.invoice_number}
                  </div>
                  <div style={{ color: '#8A9E92', fontSize: '0.8rem' }}>
                    {new Date(inv.created_at).toLocaleDateString('en-NG')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    color: '#F0F5F2',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    marginBottom: '0.2rem',
                  }}>
                    {formatNaira(inv.total)}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.15rem 0.6rem',
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: inv.status === 'paid'
                      ? 'rgba(0,197,102,0.1)'
                      : 'rgba(245,166,35,0.1)',
                    color: inv.status === 'paid' ? '#00C566' : '#f5a623',
                  }}>
                    {inv.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default Dashboard
