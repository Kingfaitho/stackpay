import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function Collections() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [overdueInvoices, setOverdueInvoices] = useState([])
  const [dueSoonInvoices, setDueSoonInvoices] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState({})
  const [sentLog, setSentLog] = useState({})
  const [reliabilityScores, setReliabilityScores] = useState({})

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, clients(id, name, email, phone)')
      .eq('user_id', user.id)
      .eq('status', 'unpaid')
      .order('due_date', { ascending: true })

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('client_id, status, due_date, created_at')
      .eq('user_id', user.id)

    setProfile(profileData)

    // Calculate reliability scores per client
    const scores = {}
    if (allInvoices) {
      const clientGroups = {}
      allInvoices.forEach(inv => {
        if (!inv.client_id) return
        if (!clientGroups[inv.client_id]) {
          clientGroups[inv.client_id] = { total: 0, paid: 0, overdue: 0 }
        }
        clientGroups[inv.client_id].total++
        if (inv.status === 'paid') clientGroups[inv.client_id].paid++
        if (inv.status === 'unpaid' && inv.due_date &&
            new Date(inv.due_date) < today) {
          clientGroups[inv.client_id].overdue++
        }
      })
      Object.entries(clientGroups).forEach(([clientId, data]) => {
        const score = data.total === 0 ? 50 :
          Math.round((data.paid / data.total) * 100)
        scores[clientId] = { score, ...data }
      })
    }
    setReliabilityScores(scores)

    const overdue = []
    const dueSoon = []

    invoices?.forEach(inv => {
      if (!inv.due_date) return
      const due = new Date(inv.due_date)
      due.setHours(0, 0, 0, 0)
      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        overdue.push({ ...inv, daysOverdue: Math.abs(diffDays), diffDays })
      } else if (diffDays <= 7) {
        dueSoon.push({ ...inv, daysUntilDue: diffDays, diffDays })
      }
    })

    setOverdueInvoices(overdue.sort((a, b) => a.diffDays - b.diffDays))
    setDueSoonInvoices(dueSoon)
    setLoading(false)
  }

  const getTone = (daysOverdue) => {
    if (daysOverdue <= 3) return 'gentle'
    if (daysOverdue <= 14) return 'firm'
    return 'urgent'
  }

  const generateMessage = (inv, tone, profileData) => {
    const business = profileData?.business_name || 'StackPay'
    const clientName = inv.clients?.name || 'there'
    const amount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(inv.total)
    const invoiceNum = inv.invoice_number
    const daysOverdue = inv.daysOverdue

    const payLink = `${window.location.origin}/pay/${inv.id}`

    if (tone === 'gentle') {
      return `Hello ${clientName} 👋

Hope you're doing well! Just a friendly reminder about invoice ${invoiceNum} for ${amount}.

The payment was due ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago.

You can pay securely here:
${payLink}

Thank you for your business! 🙏
— ${business}`
    }

    if (tone === 'firm') {
      return `Hello ${clientName},

This is a follow-up regarding invoice ${invoiceNum} for ${amount}, which is now ${daysOverdue} days overdue.

We kindly request that you process this payment as soon as possible to avoid any disruption to our services.

Pay now:
${payLink}

Please reach out if you have any questions.
— ${business}`
    }

    return `Hello ${clientName},

URGENT: Invoice ${invoiceNum} for ${amount} is now ${daysOverdue} days overdue.

Immediate payment is required to continue receiving our services. Please process this today.

Pay now:
${payLink}

If you have already made payment, please disregard this message and share your payment confirmation.
— ${business}`
  }

  const sendWhatsApp = (inv, tone) => {
    setSending(prev => ({ ...prev, [inv.id]: true }))
    const message = generateMessage(inv, tone, profile)
    const phone = inv.clients?.phone?.replace(/[^0-9]/g, '')
    let waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    if (phone) {
      const intlPhone = phone.startsWith('0')
        ? '234' + phone.slice(1)
        : phone
      waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`
    }
    window.open(waUrl, '_blank')
    setSentLog(prev => ({ ...prev, [inv.id]: new Date().toLocaleTimeString() }))
    setTimeout(() => setSending(prev => ({ ...prev, [inv.id]: false })), 1000)
  }

  const chaseAll = () => {
    if (overdueInvoices.length === 0) return
    if (!window.confirm(
      `Send WhatsApp reminders for all ${overdueInvoices.length} overdue invoices?`
    )) return

    overdueInvoices.forEach((inv, i) => {
      setTimeout(() => {
        const tone = getTone(inv.daysOverdue)
        const message = generateMessage(inv, tone, profile)
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        setSentLog(prev => ({ ...prev, [inv.id]: new Date().toLocaleTimeString() }))
      }, i * 1500)
    })
  }

  const formatNaira = (amount) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount || 0)

  const totalOverdue = overdueInvoices.reduce((s, i) => s + Number(i.total), 0)

  const getScoreColor = (score) => {
    if (score >= 80) return colors.green
    if (score >= 50) return colors.warning
    return colors.danger
  }

  const toneConfig = {
    gentle: {
      label: 'Gentle',
      color: colors.green,
      bg: isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)',
    },
    firm: {
      label: 'Firm',
      color: colors.warning,
      bg: isDark ? 'rgba(245,166,35,0.08)' : 'rgba(184,122,0,0.06)',
    },
    urgent: {
      label: 'Urgent',
      color: colors.danger,
      bg: isDark ? 'rgba(255,80,80,0.08)' : 'rgba(204,34,0,0.06)',
    },
  }

  const card = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: '1.25rem',
  }

  return (
    <AppLayout>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
            color: colors.textPrimary,
            marginBottom: '0.25rem',
          }}>
            🏃 Collections Engine
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
            Chase unpaid invoices and track client payment reliability
          </p>
        </div>

        {overdueInvoices.length > 0 && (
          <button
            onClick={chaseAll}
            style={{
              padding: '0.75rem 1.5rem',
              background: isDark ? 'rgba(255,80,80,0.1)' : 'rgba(204,34,0,0.08)',
              border: `1px solid ${colors.danger}40`,
              color: colors.danger,
              borderRadius: '10px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255,80,80,0.18)'
                : 'rgba(204,34,0,0.14)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255,80,80,0.1)'
                : 'rgba(204,34,0,0.08)'
            }}
          >
            ⚡ Chase All Overdue ({overdueInvoices.length})
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.5rem',
      }}>
        {[
          {
            icon: '🚨',
            label: 'Overdue Invoices',
            value: overdueInvoices.length,
            color: overdueInvoices.length > 0 ? colors.danger : colors.textPrimary,
          },
          {
            icon: '💰',
            label: 'Total Overdue Value',
            value: formatNaira(totalOverdue),
            color: totalOverdue > 0 ? colors.danger : colors.textPrimary,
          },
          {
            icon: '⏰',
            label: 'Due This Week',
            value: dueSoonInvoices.length,
            color: dueSoonInvoices.length > 0 ? colors.warning : colors.textPrimary,
          },
          {
            icon: '📨',
            label: 'Reminders Sent',
            value: Object.keys(sentLog).length,
            color: colors.green,
          },
        ].map((item, i) => (
          <div key={i} style={{
            ...card,
            marginBottom: 0,
            padding: '1.1rem',
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>
              {item.icon}
            </div>
            <div style={{
              color: colors.textLabel,
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '0.35rem',
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

      {loading ? (
        <div style={{
          ...card,
          textAlign: 'center',
          color: colors.textMuted,
          padding: '3rem',
        }}>
          Loading collections data...
        </div>
      ) : (
        <>
          {/* Overdue Invoices */}
          <div style={card}>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: colors.textPrimary,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              🚨 Overdue Invoices
              {overdueInvoices.length > 0 && (
                <span style={{
                  background: `${colors.danger}15`,
                  border: `1px solid ${colors.danger}30`,
                  color: colors.danger,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '100px',
                }}>
                  {overdueInvoices.length}
                </span>
              )}
            </h2>

            {overdueInvoices.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem',
                color: colors.textMuted,
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p style={{ fontSize: '0.9rem' }}>
                  No overdue invoices! All payments are on time.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {overdueInvoices.map(inv => {
                  const tone = getTone(inv.daysOverdue)
                  const tc = toneConfig[tone]
                  const clientScore = reliabilityScores[inv.client_id]
                  const wasSent = sentLog[inv.id]

                  return (
                    <div key={inv.id} style={{
                      background: colors.bgCard2,
                      border: `1px solid ${colors.border}`,
                      borderLeft: `3px solid ${tc.color}`,
                      borderRadius: '10px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.3rem',
                          flexWrap: 'wrap',
                        }}>
                          <span style={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: colors.textPrimary,
                          }}>
                            {inv.invoice_number}
                          </span>

                          {/* Urgency badge */}
                          <span style={{
                            background: tc.bg,
                            border: `1px solid ${tc.color}30`,
                            color: tc.color,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '100px',
                            fontFamily: 'Syne, sans-serif',
                          }}>
                            {tc.label}
                          </span>

                          {wasSent && (
                            <span style={{
                              color: colors.green,
                              fontSize: '0.68rem',
                              fontWeight: 600,
                            }}>
                              ✓ Sent {wasSent}
                            </span>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginBottom: '0.25rem',
                        }}>
                          <span style={{
                            color: colors.textSecondary,
                            fontSize: '0.82rem',
                          }}>
                            {inv.clients?.name || 'No client'}
                          </span>

                          {/* Client reliability score */}
                          {clientScore && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.68rem',
                              color: getScoreColor(clientScore.score),
                              fontWeight: 700,
                            }}>
                              {clientScore.score >= 80 ? '⭐' :
                               clientScore.score >= 50 ? '⚠️' : '🔴'}
                              {clientScore.score}% reliable
                            </span>
                          )}
                        </div>

                        <div style={{
                          color: colors.danger,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}>
                          {inv.daysOverdue} day{inv.daysOverdue !== 1 ? 's' : ''} overdue
                          {inv.due_date && ` · due ${new Date(inv.due_date).toLocaleDateString('en-NG')}`}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexShrink: 0,
                      }}>
                        <div style={{
                          fontFamily: 'Syne, sans-serif',
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: colors.textPrimary,
                          whiteSpace: 'nowrap',
                        }}>
                          {formatNaira(inv.total)}
                        </div>

                        <button
                          onClick={() => sendWhatsApp(inv, tone)}
                          disabled={sending[inv.id]}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#25D36615',
                            border: '1px solid #25D36630',
                            color: '#25D366',
                            borderRadius: '8px',
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s',
                          }}
                        >
                          💬 Send Reminder
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Due Soon */}
          {dueSoonInvoices.length > 0 && (
            <div style={card}>
              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: colors.textPrimary,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                ⏰ Due This Week
                <span style={{
                  background: `${colors.warning}15`,
                  border: `1px solid ${colors.warning}30`,
                  color: colors.warning,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '100px',
                }}>
                  {dueSoonInvoices.length}
                </span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {dueSoonInvoices.map(inv => (
                  <div key={inv.id} style={{
                    background: colors.bgCard2,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `3px solid ${colors.warning}`,
                    borderRadius: '10px',
                    padding: '0.9rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}>
                    <div>
                      <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        color: colors.textPrimary,
                        marginBottom: '0.2rem',
                      }}>
                        {inv.invoice_number}
                        <span style={{
                          color: colors.textSecondary,
                          fontWeight: 400,
                          fontSize: '0.82rem',
                          marginLeft: '0.5rem',
                        }}>
                          · {inv.clients?.name || 'No client'}
                        </span>
                      </div>
                      <div style={{
                        color: inv.daysUntilDue === 0
                          ? colors.danger
                          : colors.warning,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}>
                        {inv.daysUntilDue === 0
                          ? 'Due TODAY'
                          : `Due in ${inv.daysUntilDue} day${inv.daysUntilDue !== 1 ? 's' : ''}`}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}>
                      <span style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 800,
                        color: colors.textPrimary,
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                      }}>
                        {formatNaira(inv.total)}
                      </span>
                      <button
                        onClick={() => sendWhatsApp(inv, 'gentle')}
                        style={{
                          padding: '0.4rem 0.85rem',
                          background: '#25D36615',
                          border: '1px solid #25D36630',
                          color: '#25D366',
                          borderRadius: '7px',
                          fontFamily: 'Syne, sans-serif',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        💬 Remind
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Reliability Scores */}
          {Object.keys(reliabilityScores).length > 0 && (
            <div style={card}>
              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: colors.textPrimary,
                marginBottom: '0.5rem',
              }}>
                📊 Client Reliability Scores
              </h2>
              <p style={{
                color: colors.textMuted,
                fontSize: '0.8rem',
                marginBottom: '1.25rem',
              }}>
                Based on invoice payment history. Used to calculate your credit score.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}>
                {Object.entries(reliabilityScores)
                  .sort((a, b) => a[1].score - b[1].score)
                  .map(([clientId, data]) => {
                    const client = overdueInvoices.find(
                      i => i.client_id === Number(clientId)
                    )?.clients ||
                      dueSoonInvoices.find(
                        i => i.client_id === Number(clientId)
                      )?.clients

                    return (
                      <div key={clientId} style={{
                        background: colors.bgCard2,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        padding: '1rem',
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.6rem',
                        }}>
                          <span style={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: colors.textPrimary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}>
                            {client?.name || `Client ${clientId}`}
                          </span>
                          <span style={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: getScoreColor(data.score),
                            marginLeft: '0.5rem',
                            flexShrink: 0,
                          }}>
                            {data.score}%
                          </span>
                        </div>

                        <div style={{
                          height: '5px',
                          background: isDark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.06)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          marginBottom: '0.4rem',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${data.score}%`,
                            background: getScoreColor(data.score),
                            borderRadius: '3px',
                            transition: 'width 0.6s ease',
                          }} />
                        </div>

                        <div style={{
                          color: colors.textMuted,
                          fontSize: '0.7rem',
                        }}>
                          {data.paid}/{data.total} invoices paid
                          {data.overdue > 0 && (
                            <span style={{ color: colors.danger, marginLeft: '0.5rem' }}>
                              · {data.overdue} overdue
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}

export default Collections