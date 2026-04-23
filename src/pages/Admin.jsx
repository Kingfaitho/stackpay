import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

const ADMIN_EMAIL = 'swiftleadglo@gmail.com'

function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvoices: 0,
    totalExpenses: 0,
    paidInvoicesValue: 0,
    planBreakdown: {},
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) {
      navigate('/dashboard')
      return
    }
    loadAdminData()
  }, [user])

  const loadAdminData = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: invoices } = await supabase
      .from('invoices')
      .select('total, status')

    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')

    const planBreakdown = {}
    profiles?.forEach(p => {
      const plan = p.plan || 'Starter'
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1
    })

    const paidValue = invoices
      ?.filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.total), 0) || 0

    setStats({
      totalUsers: profiles?.length || 0,
      totalInvoices: invoices?.length || 0,
      totalExpenses: expenses?.length || 0,
      paidInvoicesValue: paidValue,
      planBreakdown,
    })
    setUsers(profiles || [])
    setLoading(false)
  }

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: '#060908',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#8A9E92',
    }}>
      Loading admin...
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060908',
      padding: '2rem 5%',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.8rem',
            color: '#F0F5F2',
            marginBottom: '0.25rem',
          }}>
            StackPay Admin
          </h1>
          <p style={{ color: '#7A9485' }}>
            Platform overview — visible only to you
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {[
            { label: 'Total Users', value: stats.totalUsers, color: '#00C566' },
            { label: 'Total Invoices', value: stats.totalInvoices, color: '#F0F5F2' },
            { label: 'Paid Invoice Value', value: formatNaira(stats.paidInvoicesValue), color: '#00C566' },
            { label: 'Growth Plan Users', value: stats.planBreakdown['Growth'] || 0, color: '#7C6AF7' },
            { label: 'Business Plan Users', value: stats.planBreakdown['Business'] || 0, color: '#f5a623' },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#141A16',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px',
              padding: '1.2rem',
            }}>
              <div style={{
                color: '#8A9E92',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}>
                {card.label}
              </div>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '1.5rem',
                color: card.color,
              }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            color: '#F0F5F2',
            marginBottom: '1rem',
          }}>
            All Users ({users.length})
          </h2>
          <div style={{
            background: '#141A16',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            {users.map((u, i) => (
              <div key={u.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.5rem',
                borderBottom: i < users.length - 1
                  ? '1px solid rgba(255,255,255,0.05)'
                  : 'none',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div>
                  <div style={{
                    color: '#F0F5F2',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    marginBottom: '0.15rem',
                  }}>
                    {u.business_name || 'Unnamed Business'}
                  </div>
                  <div style={{ color: '#8A9E92', fontSize: '0.78rem' }}>
                    {u.email} • {u.owner_name || 'No name'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    background: u.plan === 'Business'
                      ? 'rgba(245,166,35,0.1)'
                      : u.plan === 'Growth'
                      ? 'rgba(124,106,247,0.1)'
                      : 'rgba(255,255,255,0.05)',
                    border: u.plan === 'Business'
                      ? '1px solid rgba(245,166,35,0.2)'
                      : u.plan === 'Growth'
                      ? '1px solid rgba(124,106,247,0.2)'
                      : '1px solid rgba(255,255,255,0.08)',
                    color: u.plan === 'Business'
                      ? '#f5a623'
                      : u.plan === 'Growth'
                      ? '#7C6AF7'
                      : '#8A9E92',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '100px',
                    fontFamily: 'Syne, sans-serif',
                  }}>
                    {u.plan || 'Starter'}
                  </span>
                  <span style={{ color: '#4A6055', fontSize: '0.75rem' }}>
                    {new Date(u.created_at).toLocaleDateString('en-NG')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin
