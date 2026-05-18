import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function Reports() {
  const { user } = useAuth()
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)

  const tabs = [
    { id: 'overview', label: '📈 Overview' },
    { id: 'clients', label: '👥 Client Profitability' },
  ]

  useEffect(() => {
    if (user) {
      loadProfile()
      generateReport()
    }
  }, [user, selectedMonth])

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data)
  }

  const generateReport = async () => {
    setLoading(true)
    const [year, monthNumMinusOne] = selectedMonth.split('-').map(Number)
    const monthNum = monthNumMinusOne - 1 // JS Months are 0-indexed
    const startDate = new Date(year, monthNum, 1).toISOString()
    const endDate = new Date(year, monthNum + 1, 0, 23, 59, 59).toISOString()

    // Fetch Invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, clients(name)')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Fetch Cash Receipts
    const { data: cashReceiptsData } = await supabase
      .from('cash_receipts')
      .select('amount, received_date')
      .eq('user_id', user.id)
      .gte('received_date', startDate.split('T')[0])
      .lte('received_date', endDate.split('T')[0])

    // Fetch Expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.split('T')[0])
      .lte('date', endDate.split('T')[0])

    // Compute Income Breakdown
    const invoiceIncome = (invoices || [])
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.total), 0)

    const cashIncome = (cashReceiptsData || [])
      .reduce((sum, r) => sum + Number(r.amount), 0)

    const totalIncome = invoiceIncome + cashIncome

    // Monthly Calculation logic for consistency
    const invoiceMonthIncome = (invoices || [])
      .filter(inv => {
        const d = new Date(inv.created_at)
        return inv.status === 'paid' &&
          d.getMonth() === monthNum &&
          d.getFullYear() === year
      })
      .reduce((sum, inv) => sum + Number(inv.total), 0)

    const cashMonthIncome = (cashReceiptsData || [])
      .filter(r => {
        const d = new Date(r.received_date)
        return d.getMonth() === monthNum && d.getFullYear() === year
      })
      .reduce((sum, r) => sum + Number(r.amount), 0)

    const totalExpenses = expenses
      ?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

    const byCategory = {}
    expenses?.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
    })

    setReport({
      invoices: invoices || [],
      expenses: expenses || [],
      totalIncome, // Combined Invoice (Paid) + Cash Receipts
      totalExpenses,
      profit: totalIncome - totalExpenses,
      paidCount: invoices?.filter(i => i.status === 'paid').length || 0,
      unpaidCount: invoices?.filter(i => i.status === 'unpaid').length || 0,
      expensesByCategory: byCategory,
    })

    setLoading(false)
  }

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)

  const card = {
    background: '#141A16',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
  }

  const monthLabel = new Date(selectedMonth + '-01')
    .toLocaleString('en-NG', { month: 'long', year: 'numeric' })

  return (
    <AppLayout>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
            color: '#F0F5F2',
          }}>
            Monthly Report
          </h1>
          <p style={{ color: '#8A9E92', fontSize: '0.9rem' }}>
            {monthLabel}
          </p>
        </div>

        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#141A16',
            color: '#F0F5F2',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.9rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.75rem',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '999px',
              border: '1px solid transparent',
              background: activeTab === tab.id ? '#0F1C13' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? '#F0F5F2' : '#8A9E92',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              fontSize: '0.88rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#8A9E92', textAlign: 'center', marginTop: '3rem' }}>
          Generating report...
        </div>
      ) : report ? (
        <>
          {activeTab === 'overview' && (
            <>
              {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            {[
              { label: 'Total Income', value: formatNaira(report.totalIncome), color: '#00C566' },
              { label: 'Total Expenses', value: formatNaira(report.totalExpenses), color: '#ff8080' },
              { label: 'Net Profit', value: formatNaira(report.profit), color: report.profit >= 0 ? '#00C566' : '#ff8080' },
              { label: 'Paid Invoices', value: report.paidCount, color: '#00C566' },
              { label: 'Unpaid Invoices', value: report.unpaidCount, color: '#f5a623' },
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
                  fontSize: '1.3rem',
                  color: card.color,
                }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Expenses by Category */}
          {Object.keys(report.expensesByCategory).length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                color: '#F0F5F2',
                marginBottom: '1rem',
              }}>
                Expenses by Category
              </h2>
              <div style={{
                background: '#141A16',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                overflow: 'hidden',
              }}>
                {Object.entries(report.expensesByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount], i, arr) => {
                    const maxAmount = Math.max(...Object.values(report.expensesByCategory))
                    const pct = (amount / maxAmount) * 100
                    return (
                      <div key={category} style={{
                        padding: '1rem 1.5rem',
                        borderBottom: i < arr.length - 1
                          ? '1px solid rgba(255,255,255,0.05)'
                          : 'none',
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.4rem',
                        }}>
                          <span style={{
                            color: '#F0F5F2',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                          }}>
                            {category}
                          </span>
                          <span style={{
                            color: '#ff8080',
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                          }}>
                            {formatNaira(amount)}
                          </span>
                        </div>
                        <div style={{
                          height: '4px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'rgba(255,80,80,0.5)',
                            borderRadius: '2px',
                          }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Invoice List */}
          {report.invoices.length > 0 && (
            <div>
              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                color: '#F0F5F2',
                marginBottom: '1rem',
              }}>
                Invoices This Month
              </h2>
              <div style={{
                background: '#141A16',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                overflow: 'hidden',
              }}>
                {report.invoices.map((inv, i) => (
                  <div key={inv.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 1.5rem',
                    borderBottom: i < report.invoices.length - 1
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
                        {inv.invoice_number}
                      </div>
                      <div style={{ color: '#8A9E92', fontSize: '0.78rem' }}>
                        {inv.clients?.name || 'No client'}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}>
                      <span style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        color: '#F0F5F2',
                        fontSize: '0.9rem',
                      }}>
                        {formatNaira(inv.total)}
                      </span>
                      <span style={{
                        padding: '0.15rem 0.6rem',
                        borderRadius: '100px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: inv.status === 'paid'
                          ? 'rgba(0,197,102,0.1)'
                          : 'rgba(245,166,35,0.1)',
                        color: inv.status === 'paid'
                          ? '#00C566'
                          : '#f5a623',
                      }}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.invoices.length === 0 && report.expenses.length === 0 && (
            <div style={{
              background: '#141A16',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '3rem',
              textAlign: 'center',
              color: '#8A9E92',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
              <p>No activity recorded for {monthLabel}.</p>
            </div>
          )}
            </>
          )}

          {activeTab === 'clients' && (
            <div>
              <div style={{ ...card, padding: '1.5rem', marginBottom: '1.25rem' }}>
                <h3 style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: colors.textPrimary,
                  marginBottom: '0.4rem',
                }}>
                  💡 Which clients actually make you money?
                </h3>
                <p style={{
                  color: colors.textMuted,
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  marginBottom: '1.25rem',
                }}>
                  Revenue alone is misleading. A client who gives you ₦300,000 but pays 45 days late
                  and requires 3x the work is less valuable than one who pays ₦100,000 on time every month.
                  Here is the truth about each client relationship.
                </p>

                {/* Redirect to Client Insights */}
                <a
                  href="/client-insights"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: colors.accent,
                    color: colors.accentText,
                    borderRadius: '10px',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  View Full Client Analysis →
                </a>
              </div>
            </div>
          )}
        </>
      ) : null}
    </AppLayout>
  )
}

export default Reports