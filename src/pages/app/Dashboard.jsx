import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import OnboardingBanner from '../../components/OnboardingBanner'
import StackPayIntelligence from '../../components/StackPayIntelligence'

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

function AIAdvisor({ income, expenses, unpaidInvoices, totalClients, businessName }) {
  const [advice, setAdvice] = useState('')
  const [loading, setLoading] = useState(false)
  const [asked, setAsked] = useState(false)

  const getAdvice = async () => {
    setLoading(true)
    setAsked(true)

    const prompt = `You are a financial advisor for Nigerian small businesses.
Analyze this data and give specific, actionable advice in 3 short paragraphs.
Be direct, practical and use Nigerian business context.

Business: ${businessName || 'Nigerian SME'}
Total Income (paid invoices): ₦${income.toLocaleString()}
Total Expenses: ₦${expenses.toLocaleString()}
Net Profit: ₦${(income - expenses).toLocaleString()}
Profit Margin: ${income > 0
      ? (((income - expenses) / income) * 100).toFixed(1)
      : 0}%
Unpaid Invoices: ${unpaidInvoices}
Total Clients: ${totalClients}

Cover: current financial health, biggest risk, one action to grow revenue this month.
Keep it under 150 words. Be conversational not formal.`

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-3-mini',
          max_tokens: 300,
          messages: [
            {
              role: 'system',
              content: 'You are a concise financial advisor for Nigerian SMEs.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content
      setAdvice(text || 'Unable to generate advice at this time.')
    } catch (err) {
      setAdvice('Unable to connect to AI advisor right now. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #111815 0%, #0F1A15 100%)',
      border: '1px solid rgba(124,106,247,0.2)',
      borderRadius: '20px',
      padding: '1.5rem',
      marginBottom: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-40px', right: '-40px',
        width: '200px', height: '200px',
        background: 'radial-gradient(circle, rgba(124,106,247,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: 'rgba(124,106,247,0.15)',
            border: '1px solid rgba(124,106,247,0.25)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
          }}>
            🤖
          </div>
          <div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#EDF2EF',
            }}>
              AI Business Advisor
            </div>
            <div style={{
              color: '#7C6AF7',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}>
              Powered by Grok AI
            </div>
          </div>
        </div>

        <button
          onClick={getAdvice}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1.2rem',
            borderRadius: '10px',
            background: 'rgba(124,106,247,0.15)',
            border: '1px solid rgba(124,106,247,0.3)',
            color: '#7C6AF7',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: '12px', height: '12px',
                borderRadius: '50%',
                border: '2px solid rgba(124,106,247,0.3)',
                borderTopColor: '#7C6AF7',
                animation: 'spin 0.8s linear infinite',
                display: 'inline-block',
              }} />
              Analyzing...
            </>
          ) : (
            <>{asked ? '↻ Refresh' : '✦ Get AI Advice'}</>
          )}
        </button>
      </div>

      {!asked && !loading && (
        <div style={{
          background: 'rgba(124,106,247,0.04)',
          borderRadius: '12px',
          padding: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{ fontSize: '1.5rem' }}>💡</div>
          <p style={{
            color: '#7A9485',
            fontSize: '0.88rem',
            lineHeight: 1.7,
          }}>
            Click <strong style={{ color: '#7C6AF7' }}>Get AI Advice</strong> and
            Grok AI will analyze your real business numbers and tell you
            exactly what to do next.
          </p>
        </div>
      )}

      {loading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '0.5rem 0',
        }}>
          {[100, 85, 92, 70].map((width, i) => (
            <div key={i} style={{
              height: '12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              width: `${width}%`,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
      )}

      {advice && !loading && (
        <div style={{
          background: 'rgba(124,106,247,0.04)',
          borderRadius: '12px',
          padding: '1.2rem',
        }}>
          <p style={{
            color: '#C8D5CE',
            fontSize: '0.9rem',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
          }}>
            {advice}
          </p>
          <div style={{
            marginTop: '0.75rem',
            color: '#4A6055',
            fontSize: '0.72rem',
          }}>
            ✦ Generated by Grok AI based on your live business data
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])
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

  const [allInvoices, setAllInvoices] = useState([])
const [allExpenses, setAllExpenses] = useState([])

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

        setAllInvoices(invoices || [])
        setAllExpenses(expenses || [])

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

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)

  if (loading) return (
    <AppLayout>
      <div style={{
        color: '#8A9E92',
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

      {/* Welcome Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
          color: '#F0F5F2',
          marginBottom: '0.3rem',
        }}>
          Welcome back{profile?.owner_name
            ? `, ${profile.owner_name.split(' ')[0]}`
            : ''} 👋
        </h1>
        <p style={{ color: '#8A9E92', fontSize: '0.9rem' }}>
          Here's how {profile?.business_name || 'your business'} is doing
        </p>
      </div>

      {/* Onboarding + Health Score + AI — all after state is declared */}
      <OnboardingBanner
        profile={profile}
        invoiceCount={stats.recentInvoices.length}
        clientCount={stats.totalClients}
      />

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
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
            {
              label: '+ New Invoice',
              path: '/invoices',
              bg: '#00C566',
              color: '#080C0A',
            },
            {
              label: '+ Add Client',
              path: '/clients',
              bg: 'transparent',
              color: '#F0F5F2',
            },
            {
              label: '+ Log Expense',
              path: '/expenses',
              bg: 'transparent',
              color: '#F0F5F2',
            },
            {
              label: '⚙️ Settings',
              path: '/profile',
              bg: 'transparent',
              color: '#F0F5F2',
            },
          ].map((action) => (
            <Link
              key={action.path}
              to={action.path}
              style={{
                padding: '0.65rem 1.2rem',
                borderRadius: '10px',
                background: action.bg,
                color: action.color,
                border: action.bg === 'transparent'
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

      {/* Chart */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '1rem',
          color: '#F0F5F2',
          marginBottom: '1rem',
        }}>
          Income vs Expenses — Last 6 Months
        </h2>
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '1.5rem 1rem',
        }}>
          {chartData.every(d => d.Income === 0 && d.Expenses === 0) ? (
            <div style={{
              textAlign: 'center',
              color: '#8A9E92',
              padding: '2rem',
              fontSize: '0.9rem',
            }}>
              Chart will appear once you have invoices and expenses recorded.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fill: '#8A9E92',
                    fontSize: 12,
                    fontFamily: 'DM Sans',
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: '#8A9E92',
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
                    background: '#0F1510',
                    border: '1px solid rgba(0,197,102,0.2)',
                    borderRadius: '10px',
                    color: '#EDF2EF',
                    fontFamily: 'DM Sans',
                    fontSize: '0.85rem',
                  }}
                  formatter={(value) => [
                    `₦${value.toLocaleString()}`, '',
                  ]}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar
                  dataKey="Income"
                  fill="#00C566"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="Expenses"
                  fill="rgba(255,80,80,0.6)"
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
              { color: '#00C566', label: 'Income' },
              { color: 'rgba(255,80,80,0.6)', label: 'Expenses' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}>
                <div style={{
                  width: '10px', height: '10px',
                  borderRadius: '2px',
                  background: item.color,
                }} />
                <span style={{ color: '#8A9E92', fontSize: '0.8rem' }}>
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
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
              📄
            </div>
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
                    {new Date(inv.created_at)
                      .toLocaleDateString('en-NG')}
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
                    color: inv.status === 'paid'
                      ? '#00C566'
                      : '#f5a623',
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