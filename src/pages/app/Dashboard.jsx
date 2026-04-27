import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import { useTheme } from '../../context/ThemeContext'
import AppLayout from '../../components/AppLayout'
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import OnboardingBanner from '../../components/OnboardingBanner'
import StackPayIntelligence from '../../components/StackPayIntelligence'
import { useEffect, useState } from 'react'

function StatCard({ label, value, sub, color }) {
  const { colors, isDark } = useTheme()
  const [expanded, setExpanded] = useState(false)

  // Extract raw number for full display
  const isMoneyValue = typeof value === 'string' && value.includes('₦')

  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: '1.25rem',
        transition: 'background 0.3s, border-color 0.2s, box-shadow 0.2s',
        boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
        minWidth: 0,
        overflow: 'visible',
        position: 'relative',
        cursor: isMoneyValue ? 'pointer' : 'default',
      }}
      onMouseEnter={e => {
        setExpanded(true)
        e.currentTarget.style.borderColor = colors.borderGreen
        e.currentTarget.style.zIndex = '10'
      }}
      onMouseLeave={e => {
        setExpanded(false)
        e.currentTarget.style.borderColor = colors.border
        e.currentTarget.style.zIndex = '1'
      }}
      onClick={() => setExpanded(prev => !prev)}
    >
      <div style={{
        color: colors.textLabel,
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: '0.5rem',
      }}>
        {label}
      </div>

      {/* Value — shrinks font to fit, expands on hover */}
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: expanded ? '1.1rem' : 'clamp(0.95rem, 1.8vw, 1.3rem)',
        color: color || colors.textPrimary,
        letterSpacing: '-0.3px',
        marginBottom: '0.25rem',
        transition: 'font-size 0.2s',
        wordBreak: 'break-all',
        lineHeight: 1.2,
      }}>
        {value}
      </div>

      {/* Expanded tooltip for full number */}
      {expanded && isMoneyValue && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          background: colors.bgCard2,
          border: `1px solid ${colors.borderGreen}`,
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          marginTop: '4px',
          boxShadow: isDark
            ? '0 8px 24px rgba(0,0,0,0.5)'
            : '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1rem',
            color: color || colors.textPrimary,
            marginBottom: '0.2rem',
          }}>
            {value}
          </div>
          <div style={{
            color: colors.textMuted,
            fontSize: '0.72rem',
          }}>
            {sub}
          </div>
        </div>
      )}

      {sub && (
        <div style={{
          color: colors.textMuted,
          fontSize: '0.72rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])
  const [allInvoices, setAllInvoices] = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    profit: 0,
    unpaidInvoices: 0,
    totalClients: 0,
    recentInvoices: [],
  })

  useEffect(() => {
    if (user) loadDashboard()
  }, [user])

  const loadDashboard = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)

      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)

      setAllInvoices(invoices || [])
      setAllExpenses(expenses || [])

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

      const months = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const monthKey = d.toLocaleString('en-NG', { month: 'short' })
        const monthNum = d.getMonth()
        const year = d.getFullYear()

        const income = invoices
          ?.filter(inv => {
            const invDate = new Date(inv.created_at)
            return inv.status === 'paid' &&
              invDate.getMonth() === monthNum &&
              invDate.getFullYear() === year
          })
          .reduce((sum, inv) => sum + Number(inv.total), 0) || 0

        const expense = expenses
          ?.filter(exp => {
            const expDate = new Date(exp.date)
            return expDate.getMonth() === monthNum &&
              expDate.getFullYear() === year
          })
          .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

        months.push({ month: monthKey, Income: income, Expenses: expense })
      }
      setChartData(months)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatNaira = (amount) => {
    const currency = profile?.currency || 'NGN'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) return (
    <AppLayout>
      <div style={{
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: '3rem',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        Loading your dashboard...
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>

      {/* Welcome */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
          color: colors.textPrimary,
          marginBottom: '0.3rem',
        }}>
          Welcome back{profile?.owner_name
            ? `, ${profile.owner_name.split(' ')[0]}`
            : ''} 👋
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
          Here's how {profile?.business_name || 'your business'} is doing
        </p>
      </div>

      {/* Onboarding */}
      <OnboardingBanner
        profile={profile}
        invoiceCount={stats.recentInvoices.length}
        clientCount={stats.totalClients}
      />

      {/* StackPay Intelligence */}
      <StackPayIntelligence
        invoices={allInvoices}
        expenses={allExpenses}
        totalIncome={stats.totalIncome}
        totalExpenses={stats.totalExpenses}
        unpaidInvoices={stats.unpaidInvoices}
        totalClients={stats.totalClients}
        businessName={profile?.business_name}
        profile={profile}
      />

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.85rem',
        marginBottom: '2rem',
      }}>
        <StatCard
          label="Total Income"
          value={formatNaira(stats.totalIncome)}
          sub="From paid invoices"
          color={colors.green}
        />
        <StatCard
          label="Total Expenses"
          value={formatNaira(stats.totalExpenses)}
          sub="All logged costs"
          color={colors.danger}
        />
        <StatCard
          label="Net Profit"
          value={formatNaira(stats.profit)}
          sub="Income minus expenses"
          color={stats.profit >= 0 ? colors.green : colors.danger}
        />
        <StatCard
          label="Unpaid Invoices"
          value={stats.unpaidInvoices}
          sub="Awaiting payment"
          color={colors.warning}
        />
        <StatCard
          label="Total Clients"
          value={stats.totalClients}
          sub="Active clients"
          color={colors.purple}
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '1rem',
          color: colors.textPrimary,
          marginBottom: '1rem',
        }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { label: '+ New Invoice', path: '/invoices', primary: true },
            { label: '+ Add Client', path: '/clients', primary: false },
            { label: '+ Log Expense', path: '/expenses', primary: false },
            { label: '🎯 Budget', path: '/budget', primary: false },
            { label: '⚙️ Settings', path: '/profile', primary: false },
          ].map((action) => (
            <Link
              key={action.path}
              to={action.path}
              style={{
                padding: '0.65rem 1.2rem',
                borderRadius: '10px',
                background: action.primary ? colors.accent : colors.bgCard,
                color: action.primary ? colors.accentText : colors.textPrimary,
                border: action.primary
                  ? 'none'
                  : `1px solid ${colors.border}`,
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: action.primary
                  ? 'none'
                  : colors.name === 'light'
                  ? '0 1px 4px rgba(0,0,0,0.06)'
                  : 'none',
              }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '1rem',
          color: colors.textPrimary,
          marginBottom: '1rem',
        }}>
          Income vs Expenses — Last 6 Months
        </h2>
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '1.5rem 1rem',
          boxShadow: colors.name === 'light' ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
          transition: 'background 0.3s',
        }}>
          {chartData.every(d => d.Income === 0 && d.Expenses === 0) ? (
            <div style={{
              textAlign: 'center',
              color: colors.textMuted,
              padding: '2rem',
              fontSize: '0.9rem',
            }}>
              Chart appears once you have invoices and expenses recorded.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.06)'}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fill: colors.textMuted,
                    fontSize: 12,
                    fontFamily: 'DM Sans',
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: colors.textMuted,
                    fontSize: 11,
                    fontFamily: 'DM Sans',
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v =>
                    v === 0 ? '0' : `₦${(v / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: colors.bgCard2,
                    border: `1px solid ${colors.borderGreen}`,
                    borderRadius: '10px',
                    color: colors.textPrimary,
                    fontFamily: 'DM Sans',
                    fontSize: '0.85rem',
                  }}
                  formatter={(value) => [`₦${value.toLocaleString()}`, '']}
                  cursor={{
                    fill: isDark
                      ? 'rgba(255,255,255,0.02)'
                      : 'rgba(0,0,0,0.03)',
                  }}
                />
                <Bar
                  dataKey="Income"
                  fill={colors.green}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="Expenses"
                  fill={isDark
                    ? 'rgba(255,80,80,0.6)'
                    : 'rgba(204,34,0,0.5)'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          <div style={{
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            marginTop: '1rem',
          }}>
            {[
              { color: colors.green, label: 'Income' },
              { color: isDark ? 'rgba(255,80,80,0.6)' : 'rgba(204,34,0,0.5)', label: 'Expenses' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  background: item.color,
                }} />
                <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
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
            color: colors.textPrimary,
          }}>
            Recent Invoices
          </h2>
          <Link to="/invoices" style={{
            color: colors.green,
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            View all →
          </Link>
        </div>

        {stats.recentInvoices.length === 0 ? (
          <div style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            color: colors.textMuted,
            boxShadow: colors.name === 'light'
              ? '0 2px 12px rgba(0,0,0,0.06)'
              : 'none',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</div>
            <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
              No invoices yet. Create your first one!
            </p>
            <Link to="/invoices" style={{
              display: 'inline-block',
              padding: '0.6rem 1.2rem',
              background: colors.accent,
              color: colors.accentText,
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
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: colors.name === 'light'
              ? '0 2px 12px rgba(0,0,0,0.06)'
              : 'none',
          }}>
            {stats.recentInvoices.map((inv, i) => (
              <div key={inv.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: i < stats.recentInvoices.length - 1
                  ? `1px solid ${colors.border}`
                  : 'none',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(0,0,0,0.02)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div>
                  <div style={{
                    color: colors.textPrimary,
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    marginBottom: '0.2rem',
                    fontFamily: 'Syne, sans-serif',
                  }}>
                    {inv.invoice_number}
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: '0.8rem' }}>
                    {new Date(inv.created_at).toLocaleDateString('en-NG')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    color: colors.textPrimary,
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    marginBottom: '0.3rem',
                  }}>
                    {formatNaira(inv.total)}
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'Syne, sans-serif',
                    background: inv.status === 'paid'
                      ? isDark
                        ? 'rgba(0,197,102,0.12)'
                        : 'rgba(0,120,60,0.08)'
                      : isDark
                      ? 'rgba(245,166,35,0.1)'
                      : 'rgba(184,122,0,0.08)',
                    color: inv.status === 'paid'
                      ? colors.green
                      : colors.warning,
                    border: `1px solid ${inv.status === 'paid'
                      ? colors.borderGreen
                      : 'rgba(184,122,0,0.25)'}`,
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '2px',
                      background: inv.status === 'paid'
                        ? colors.green
                        : colors.warning,
                    }} />
                    {inv.status === 'paid' ? 'PAID' : 'UNPAID'}
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