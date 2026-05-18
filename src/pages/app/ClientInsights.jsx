import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function ClientInsights() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [clientData, setClientData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('profit')

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)

    const [
      { data: clients },
      { data: invoices },
      { data: expenses },
      { data: cashReceipts },
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('invoices').select('*').eq('user_id', user.id),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('cash_receipts').select('*').eq('user_id', user.id),
    ])

    const today = new Date()

    // Build per-client analysis
    const analysis = (clients || []).map(client => {
      const clientInvoices = (invoices || []).filter(
        i => i.client_id === client.id
      )

      const paidInvoices = clientInvoices.filter(i => i.status === 'paid')
      const unpaidInvoices = clientInvoices.filter(i => i.status === 'unpaid')
      const overdueInvoices = unpaidInvoices.filter(
        i => i.due_date && new Date(i.due_date) < today
      )

      const totalRevenue = paidInvoices.reduce(
        (sum, i) => sum + Number(i.total), 0
      )
      const totalUnpaid = unpaidInvoices.reduce(
        (sum, i) => sum + Number(i.total), 0
      )
      const totalOverdue = overdueInvoices.reduce(
        (sum, i) => sum + Number(i.total), 0
      )

      // Average payment delay
      const paymentDelays = paidInvoices
        .filter(i => i.due_date && i.updated_at)
        .map(i => {
          const due = new Date(i.due_date)
          const paid = new Date(i.updated_at)
          return Math.round((paid - due) / (1000 * 60 * 60 * 24))
        })
      const avgDelay = paymentDelays.length > 0
        ? Math.round(paymentDelays.reduce((a, b) => a + b, 0) / paymentDelays.length)
        : 0

      // Reliability score 0-100
      let reliability = 50
      if (clientInvoices.length > 0) {
        const payRate = paidInvoices.length / clientInvoices.length
        reliability = Math.round(payRate * 70)
        if (avgDelay <= 0) reliability += 20
        else if (avgDelay <= 7) reliability += 15
        else if (avgDelay <= 14) reliability += 8
        else if (avgDelay > 30) reliability -= 10
        if (overdueInvoices.length > 0) reliability -= overdueInvoices.length * 5
        reliability = Math.max(0, Math.min(100, reliability))
      }

      // First and last invoice dates
      const dates = clientInvoices
        .map(i => new Date(i.created_at))
        .sort((a, b) => a - b)
      const firstInvoice = dates[0]
      const lastInvoice = dates[dates.length - 1]
      const relationshipMonths = firstInvoice
        ? Math.max(
            1,
            Math.round(
              (today - firstInvoice) / (1000 * 60 * 60 * 24 * 30)
            )
          )
        : 0

      return {
        ...client,
        totalRevenue,
        totalUnpaid,
        totalOverdue,
        invoiceCount: clientInvoices.length,
        paidCount: paidInvoices.length,
        overdueCount: overdueInvoices.length,
        avgDelay,
        reliability,
        relationshipMonths,
        monthlyAvg: relationshipMonths > 0
          ? Math.round(totalRevenue / relationshipMonths)
          : totalRevenue,
        lastInvoice,
      }
    })

    // Sort
    const sorted = [...analysis].sort((a, b) => {
      if (sortBy === 'profit') return b.totalRevenue - a.totalRevenue
      if (sortBy === 'reliability') return b.reliability - a.reliability
      if (sortBy === 'overdue') return b.totalOverdue - a.totalOverdue
      return b.totalRevenue - a.totalRevenue
    })

    setClientData(sorted)
    setLoading(false)
  }

  useEffect(() => {
    if (clientData.length > 0) {
      const sorted = [...clientData].sort((a, b) => {
        if (sortBy === 'profit') return b.totalRevenue - a.totalRevenue
        if (sortBy === 'reliability') return b.reliability - a.reliability
        if (sortBy === 'overdue') return b.totalOverdue - a.totalOverdue
        return b.totalRevenue - a.totalRevenue
      })
      setClientData(sorted)
    }
  }, [sortBy])

  const formatNaira = (n) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(n || 0)

  const getReliabilityConfig = (score) => {
    if (score >= 80) return { label: 'Excellent', color: colors.green, emoji: '⭐' }
    if (score >= 60) return { label: 'Good', color: colors.green, emoji: '✅' }
    if (score >= 40) return { label: 'Average', color: colors.warning, emoji: '⚠️' }
    if (score >= 20) return { label: 'Poor', color: colors.danger, emoji: '🔴' }
    return { label: 'Risk', color: colors.danger, emoji: '🚨' }
  }

  const getDelayLabel = (days) => {
    if (days <= 0) return { text: 'Pays early', color: colors.green }
    if (days <= 7) return { text: `${days}d late avg`, color: colors.green }
    if (days <= 14) return { text: `${days}d late avg`, color: colors.warning }
    return { text: `${days}d late avg`, color: colors.danger }
  }

  const totalFromAllClients = clientData.reduce(
    (sum, c) => sum + c.totalRevenue, 0
  )

  const card = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: '1.25rem',
  }

  return (
    <AppLayout>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
          color: colors.textPrimary,
          marginBottom: '0.25rem',
        }}>
          👥 Client Insights
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
          Which clients make you money, which waste your time, and who owes you right now
        </p>
      </div>

      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.5rem',
      }}>
        {[
          {
            icon: '👥',
            label: 'Total Clients',
            value: clientData.length,
            color: colors.textPrimary,
          },
          {
            icon: '💰',
            label: 'Revenue from Clients',
            value: formatNaira(totalFromAllClients),
            color: colors.green,
          },
          {
            icon: '⭐',
            label: 'Excellent Payers',
            value: clientData.filter(c => c.reliability >= 80).length,
            color: colors.green,
          },
          {
            icon: '🔴',
            label: 'Problem Clients',
            value: clientData.filter(c => c.overdueCount > 0).length,
            color: clientData.filter(c => c.overdueCount > 0).length > 0
              ? colors.danger
              : colors.textPrimary,
          },
        ].map((item, i) => (
          <div key={i} style={{ ...card, marginBottom: 0, padding: '1.1rem' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>
              {item.icon}
            </div>
            <div style={{
              color: colors.textLabel,
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '0.3rem',
            }}>
              {item.label}
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: item.color,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sort controls */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{ color: colors.textMuted, fontSize: '0.75rem', flexShrink: 0 }}>
          Sort by:
        </span>
        {[
          { id: 'profit', label: '💰 Revenue' },
          { id: 'reliability', label: '⭐ Reliability' },
          { id: 'overdue', label: '🚨 Overdue' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setSortBy(s.id)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '100px',
              border: `1px solid ${sortBy === s.id
                ? colors.borderGreen : colors.border}`,
              background: sortBy === s.id
                ? isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)'
                : 'transparent',
              color: sortBy === s.id ? colors.green : colors.textMuted,
              fontFamily: 'Syne, sans-serif',
              fontWeight: sortBy === s.id ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...card, padding: '3rem', textAlign: 'center', color: colors.textMuted }}>
          Analyzing your clients...
        </div>
      ) : clientData.length === 0 ? (
        <div style={{ ...card, padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
          <p style={{ color: colors.textPrimary, fontWeight: 500, marginBottom: '0.5rem' }}>
            No client data yet
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
            Add clients and create invoices to see who is making you money
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {clientData.map((client, i) => {
            const reliabilityConfig = getReliabilityConfig(client.reliability)
            const delayConfig = getDelayLabel(client.avgDelay)
            const revenueShare = totalFromAllClients > 0
              ? Math.round((client.totalRevenue / totalFromAllClients) * 100)
              : 0
            const isTopClient = i === 0 && client.totalRevenue > 0
            const isProblem = client.overdueCount > 0

            return (
              <div key={client.id} style={{
                background: colors.bgCard,
                border: `1px solid ${isProblem
                  ? colors.danger + '40'
                  : isTopClient
                  ? colors.borderGreen
                  : colors.border}`,
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
              }}>

                {/* Top client indicator */}
                {isTopClient && client.totalRevenue > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: colors.green,
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '0 14px 0 8px',
                    fontFamily: 'Syne, sans-serif',
                  }}>
                    TOP CLIENT
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '1rem',
                  alignItems: 'start',
                  flexWrap: 'wrap',
                }}>

                  {/* Avatar */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: client.logo_url
                      ? 'transparent'
                      : isDark ? 'rgba(0,197,102,0.1)' : 'rgba(0,120,60,0.08)',
                    border: `1px solid ${colors.borderGreen}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.green,
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {client.logo_url ? (
                      <img
                        src={client.logo_url}
                        alt={client.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : client.name[0].toUpperCase()}
                  </div>

                  {/* Main info */}
                  <div>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: colors.textPrimary,
                      marginBottom: '0.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}>
                      {client.name}
                      {client.company && (
                        <span style={{
                          color: colors.textMuted,
                          fontWeight: 400,
                          fontSize: '0.78rem',
                        }}>
                          · {client.company}
                        </span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}>
                      <span style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: colors.green,
                      }}>
                        {formatNaira(client.totalRevenue)}
                      </span>
                      <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                        {client.invoiceCount} invoice{client.invoiceCount !== 1 ? 's' : ''}
                      </span>
                      {client.relationshipMonths > 0 && (
                        <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                          {client.relationshipMonths} month{client.relationshipMonths !== 1 ? 's' : ''} client
                        </span>
                      )}
                      <span style={{
                        color: delayConfig.color,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        {delayConfig.text}
                      </span>
                    </div>

                    {/* Revenue share bar */}
                    {revenueShare > 0 && (
                      <div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.25rem',
                        }}>
                          <span style={{
                            color: colors.textMuted,
                            fontSize: '0.68rem',
                          }}>
                            {revenueShare}% of total revenue
                          </span>
                          {revenueShare > 60 && (
                            <span style={{
                              color: colors.warning,
                              fontSize: '0.68rem',
                              fontWeight: 600,
                            }}>
                              ⚠️ High dependency
                            </span>
                          )}
                        </div>
                        <div style={{
                          height: '4px',
                          background: isDark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.06)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${revenueShare}%`,
                            background: revenueShare > 60
                              ? colors.warning
                              : colors.green,
                            borderRadius: '2px',
                            transition: 'width 0.8s ease',
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Overdue warning */}
                    {client.overdueCount > 0 && (
                      <div style={{
                        marginTop: '0.6rem',
                        padding: '0.4rem 0.75rem',
                        background: isDark
                          ? 'rgba(255,80,80,0.08)'
                          : 'rgba(204,34,0,0.05)',
                        border: `1px solid ${colors.danger}30`,
                        borderRadius: '7px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}>
                        <span style={{
                          color: colors.danger,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}>
                          🚨 {client.overdueCount} overdue —
                          {formatNaira(client.totalOverdue)} owed
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reliability score */}
                  <div style={{
                    textAlign: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>
                      {reliabilityConfig.emoji}
                    </div>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      color: reliabilityConfig.color,
                      lineHeight: 1,
                    }}>
                      {client.reliability}
                    </div>
                    <div style={{
                      color: colors.textMuted,
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}>
                      reliability
                    </div>
                    <div style={{
                      fontSize: '0.65rem',
                      color: reliabilityConfig.color,
                      fontWeight: 600,
                      marginTop: '0.15rem',
                    }}>
                      {reliabilityConfig.label}
                    </div>

                    {/* Mini score bar */}
                    <div style={{
                      marginTop: '0.4rem',
                      height: '3px',
                      width: '50px',
                      background: isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.06)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${client.reliability}%`,
                        background: reliabilityConfig.color,
                        borderRadius: '2px',
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}

export default ClientInsights