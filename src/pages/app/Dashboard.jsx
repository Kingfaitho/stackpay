import { Link, useNavigate } from 'react-router-dom'
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

function StatCard({ label, value, sub, color, icon, gradient, accentAlpha = '0.12' }) {
  const { colors, isDark } = useTheme()
  const [hovered, setHovered] = useState(false)

  const isMoneyValue = typeof value === 'string' && value.includes('₦')

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isDark
          ? `linear-gradient(145deg, ${gradient?.[0] || 'rgba(255,255,255,0.04)'}, ${gradient?.[1] || 'rgba(255,255,255,0.02)'})`
          : `linear-gradient(145deg, ${gradient?.[0] || 'rgba(255,255,255,0.9)'}, ${gradient?.[1] || 'rgba(255,255,255,0.7)'})`,
        border: `1px solid ${hovered ? color || colors.borderGreen : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: '20px',
        padding: '1.4rem 1.35rem 1.2rem',
        transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered
          ? isDark
            ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color || colors.borderGreen}30`
            : `0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px ${color || colors.borderGreen}25`
          : isDark
            ? '0 1px 3px rgba(0,0,0,0.3)'
            : '0 2px 16px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        minWidth: 0,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Subtle glow layer */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: color
          ? `linear-gradient(90deg, transparent, ${color}60, transparent)`
          : 'transparent',
        borderRadius: '20px 20px 0 0',
        opacity: hovered ? 1 : 0.5,
        transition: 'opacity 0.22s',
      }} />

      {/* Icon chip */}
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '12px',
        background: color ? `${color}${isDark ? '22' : '15'}` : `${colors.green}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.15rem',
        marginBottom: '0.85rem',
        border: `1px solid ${color ? `${color}30` : `${colors.green}25`}`,
      }}>
        {icon}
      </div>

      <div style={{
        color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.42)',
        fontSize: '0.68rem',
        fontWeight: 600,
        letterSpacing: '0.6px',
        textTransform: 'uppercase',
        marginBottom: '0.45rem',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        {label}
      </div>

      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: isMoneyValue ? 'clamp(1.05rem, 2vw, 1.45rem)' : '1.7rem',
        color: color || colors.textPrimary,
        letterSpacing: '-0.5px',
        lineHeight: 1.1,
        marginBottom: '0.35rem',
        wordBreak: 'break-word',
      }}>
        {value}
      </div>

      {sub && (
        <div style={{
          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
          fontSize: '0.72rem',
          fontFamily: 'DM Sans, sans-serif',
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

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const QUOTES = [
  {
    quote: "Every invoice you send is one step closer to the life you are building.",
    author: "Ledga Intelligence",
  },
  {
    quote: "The business owner who knows their numbers controls their future. The one who does not is just guessing.",
    author: "Ledga Intelligence",
  },
  {
    quote: "Every naira tracked today is a decision made with clarity tomorrow.",
    author: "Ledga Intelligence",
  },
  {
    quote: "You did not start your business to stay small. Track it, grow it, own it.",
    author: "Ledga Intelligence",
  },
  {
    quote: "Cash flow is the heartbeat of your business. Know it like you know your own name.",
    author: "Ledga Intelligence",
  },
  {
    quote: "Send the invoice. Chase the payment. Log the expense. Repeat until wealthy.",
    author: "Ledga Intelligence",
  },
  {
    quote: "Small consistent actions in your finances compound into extraordinary results.",
    author: "Ledga Intelligence",
  },
  {
    quote: "Your credit score is a record of your discipline. Every paid invoice writes your financial story.",
    author: "Ledga Intelligence",
  },
  {
    quote: "The most dangerous number in business is the one you do not know.",
    author: "Ledga Intelligence",
  },
  {
    quote: "Nigeria is full of brilliant business owners. The ones who win are the ones who track.",
    author: "Ledga Intelligence",
  },
  {
    quote: "Profit is not what you earn. It is what you keep after knowing every cost.",
    author: "Ledga Intelligence",
  },
  {
    quote: "One overdue invoice chased today is rent paid next month.",
    author: "Ledga Intelligence",
  },
  {
    quote: "Your runway is your freedom. Know how many days of cash you have every single morning.",
    author: "Ledga Intelligence",
  },
  {
    quote: "Every great Nigerian business started with one client, one invoice, one payment.",
    author: "Ledga Intelligence",
  },
  {
    quote: "Do not work harder. Work with better information. That is what Ledga is for.",
    author: "Ledga Intelligence",
  },
]

function DailyQuote({ colors, isDark }) {
  // Pick a quote based on the day of year — same quote all day, changes daily
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) /
    (1000 * 60 * 60 * 24)
  )
  const quote = QUOTES[dayOfYear % QUOTES.length]

  return (
    <div style={{
      background: isDark
        ? 'linear-gradient(135deg, rgba(0,197,102,0.06), rgba(124,106,247,0.06))'
        : 'linear-gradient(135deg, rgba(0,120,60,0.04), rgba(91,78,199,0.04))',
      border: `1px solid ${isDark ? 'rgba(0,197,102,0.15)' : 'rgba(0,120,60,0.12)'}`,
      borderRadius: '14px',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.85rem',
    }}>
      <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '0.1rem' }}>
        💡
      </span>
      <div>
        <p style={{
          color: colors.textPrimary,
          fontSize: '0.88rem',
          lineHeight: 1.7,
          fontStyle: 'italic',
          marginBottom: '0.3rem',
        }}>
          "{quote.quote}"
        </p>
        <p style={{
          color: colors.textMuted,
          fontSize: '0.7rem',
          fontWeight: 600,
          fontFamily: 'Syne, sans-serif',
        }}>
          — {quote.author}
        </p>
      </div>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const navigate = useNavigate()

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

      // After fetching profile
    if (profile && profile.onboarding_complete === false) {
  navigate('/onboarding')
  return
}

     const [
  { data: invoices },
  { data: expenses },
  { data: cashReceiptsData },
  { data: clients },
] = await Promise.all([
  supabase.from('invoices').select('*').eq('user_id', user.id),
  supabase.from('expenses').select('*').eq('user_id', user.id),
  supabase.from('cash_receipts').select('amount').eq('user_id', user.id),
  supabase.from('clients').select('id').eq('user_id', user.id),
])

      setAllInvoices(invoices || [])
      setAllExpenses(expenses || [])

     const invoiceIncome = (invoices || [])
  .filter(i => i.status === 'paid')
  .reduce((sum, i) => sum + Number(i.total), 0)

const cashIncome = (cashReceiptsData || [])
  .reduce((sum, r) => sum + Number(r.amount), 0)

const totalIncome = invoiceIncome + cashIncome

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

      {/* Welcome + Hero CTA */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.15rem',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
              color: colors.textPrimary,
              marginBottom: '0.3rem',
              letterSpacing: '-0.3px',
            }}>
              {getGreeting()}{profile?.owner_name
                ? `, ${profile.owner_name.split(' ')[0]}`
                : ''} 👋
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
              {profile?.business_name || 'Your business'} ·{' '}
              {new Date().toLocaleDateString('en-NG', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>

          {/* Hero New Invoice CTA */}
          <Link
            to="/invoices"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.72rem 1.4rem',
              borderRadius: '14px',
              background: isDark
                ? 'linear-gradient(135deg, #00c566, #00a352)'
                : 'linear-gradient(135deg, #009e50, #007a3c)',
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'none',
              letterSpacing: '-0.2px',
              boxShadow: isDark
                ? '0 4px 20px rgba(0,197,102,0.35), 0 1px 4px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(0,140,70,0.3), 0 1px 4px rgba(0,0,0,0.12)',
              transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'
              e.currentTarget.style.boxShadow = isDark
                ? '0 6px 28px rgba(0,197,102,0.45), 0 2px 6px rgba(0,0,0,0.35)'
                : '0 6px 28px rgba(0,140,70,0.4), 0 2px 6px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = isDark
                ? '0 4px 20px rgba(0,197,102,0.35), 0 1px 4px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(0,140,70,0.3), 0 1px 4px rgba(0,0,0,0.12)'
            }}
          >
            <span style={{ fontSize: '1rem' }}>+</span>
            New Invoice
          </Link>
        </div>

        {/* Daily quote */}
        <DailyQuote colors={colors} isDark={isDark} />
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <StatCard
          label="Total Income"
          value={formatNaira(stats.totalIncome)}
          sub="From paid invoices & cash"
          color={colors.green}
          icon="💰"
          gradient={isDark
            ? ['rgba(0,197,102,0.10)', 'rgba(0,197,102,0.03)']
            : ['rgba(220,255,237,0.95)', 'rgba(200,255,225,0.6)']}
        />
        <StatCard
          label="Total Expenses"
          value={formatNaira(stats.totalExpenses)}
          sub="All logged costs"
          color={colors.danger}
          icon="📉"
          gradient={isDark
            ? ['rgba(255,80,80,0.10)', 'rgba(255,80,80,0.03)']
            : ['rgba(255,235,235,0.95)', 'rgba(255,215,215,0.6)']}
        />
        <StatCard
          label="Net Profit"
          value={formatNaira(stats.profit)}
          sub="Income minus expenses"
          color={stats.profit >= 0 ? colors.green : colors.danger}
          icon={stats.profit >= 0 ? '📈' : '⚠️'}
          gradient={stats.profit >= 0
            ? isDark
              ? ['rgba(0,197,102,0.10)', 'rgba(0,197,102,0.03)']
              : ['rgba(220,255,237,0.95)', 'rgba(200,255,225,0.6)']
            : isDark
              ? ['rgba(255,80,80,0.10)', 'rgba(255,80,80,0.03)']
              : ['rgba(255,235,235,0.95)', 'rgba(255,215,215,0.6)']}
        />
        <StatCard
          label="Unpaid Invoices"
          value={stats.unpaidInvoices}
          sub="Awaiting payment"
          color={colors.warning}
          icon="🔔"
          gradient={isDark
            ? ['rgba(245,166,35,0.10)', 'rgba(245,166,35,0.03)']
            : ['rgba(255,248,220,0.95)', 'rgba(255,240,180,0.6)']}
        />
        <StatCard
          label="Total Clients"
          value={stats.totalClients}
          sub="Active clients"
          color={colors.purple}
          icon="👥"
          gradient={isDark
            ? ['rgba(124,106,247,0.10)', 'rgba(124,106,247,0.03)']
            : ['rgba(240,237,255,0.95)', 'rgba(225,220,255,0.6)']}
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '0.9rem',
          color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          marginBottom: '0.9rem',
        }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {[
            { label: '+ Add Client',      path: '/clients',        emoji: '👤' },
            { label: '+ Log Expense',     path: '/expenses',       emoji: '🧾' },
            { label: '💵 Log Cash',       path: '/cash-receipts',  emoji: null },
            { label: '🎯 Budget',         path: '/budget',         emoji: null },
            { label: '⚙️ Settings',       path: '/profile',        emoji: null },
          ].map((action) => (
            <Link
              key={action.path + action.label}
              to={action.path}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '10px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                color: colors.textPrimary,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 500,
                fontSize: '0.85rem',
                textDecoration: 'none',
                transition: 'all 0.18s',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = colors.borderGreen
                e.currentTarget.style.color = colors.green
                e.currentTarget.style.background = isDark
                  ? 'rgba(0,197,102,0.08)'
                  : 'rgba(0,140,70,0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                e.currentTarget.style.color = colors.textPrimary
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
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
          Income vs Expenses - Last 6 Months
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
