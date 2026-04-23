import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ClientPortal() {
  const { clientId } = useParams()
  const [invoices, setInvoices] = useState([])
  const [client, setClient] = useState(null)
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (clientId) loadPortal()
  }, [clientId])

  const loadPortal = async () => {
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('name, email, user_id')
      .eq('id', clientId)
      .single()

    if (clientError || !clientData) {
      setError(true)
      setLoading(false)
      return
    }

    setClient(clientData)

    // Load business name of the owner
    const { data: profileData } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', clientData.user_id)
      .single()

    if (profileData?.business_name) {
      setBusinessName(profileData.business_name)
    }

    // Load invoices for this client
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    setInvoices(invoiceData || [])
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
      fontFamily: 'DM Sans, sans-serif',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: '3px solid rgba(0,197,102,0.2)',
        borderTopColor: '#00C566',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p>Loading your invoices...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{
      minHeight: '100vh',
      background: '#060908',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: 'DM Sans, sans-serif',
      color: '#8A9E92',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        color: '#F0F5F2',
        fontWeight: 700,
      }}>
        Portal not found
      </h2>
      <p>This link may be invalid or expired. Contact your service provider.</p>
    </div>
  )

  const totalOwed = invoices
    .filter(i => i.status === 'unpaid')
    .reduce((sum, i) => sum + Number(i.total), 0)

  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.total), 0)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060908',
      padding: '2rem 5% 4rem',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Logo + Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          paddingTop: '1.5rem',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.6rem',
            color: '#EDF2EF',
            marginBottom: '0.75rem',
          }}>
            Stack<span style={{ color: '#00C566' }}>Pay</span>
          </div>

          <div style={{
            background: '#141A16',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'inline-block',
            minWidth: '280px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(0,197,102,0.1)',
              border: '1px solid rgba(0,197,102,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00C566',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.2rem',
              margin: '0 auto 0.75rem',
            }}>
              {client?.name?.[0]?.toUpperCase()}
            </div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#F0F5F2',
              marginBottom: '0.25rem',
            }}>
              Hello, {client?.name} 👋
            </h1>
            {businessName && (
              <p style={{ color: '#7A9485', fontSize: '0.85rem' }}>
                Invoices from {businessName}
              </p>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            background: '#141A16',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '1.2rem',
            textAlign: 'center',
          }}>
            <div style={{
              color: '#8A9E92',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}>
              Total Paid
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.3rem',
              color: '#00C566',
            }}>
              {formatNaira(totalPaid)}
            </div>
          </div>
          <div style={{
            background: totalOwed > 0
              ? 'rgba(245,166,35,0.06)'
              : '#141A16',
            border: totalOwed > 0
              ? '1px solid rgba(245,166,35,0.2)'
              : '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '1.2rem',
            textAlign: 'center',
          }}>
            <div style={{
              color: '#8A9E92',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}>
              Outstanding
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.3rem',
              color: totalOwed > 0 ? '#f5a623' : '#4A6055',
            }}>
              {formatNaira(totalOwed)}
            </div>
          </div>
        </div>

        {/* Outstanding Banner */}
        {totalOwed > 0 && (
          <div style={{
            background: 'rgba(245,166,35,0.06)',
            border: '1px solid rgba(245,166,35,0.2)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <p style={{
              color: '#f5a623',
              fontSize: '0.88rem',
              lineHeight: 1.5,
            }}>
              You have <strong>{formatNaira(totalOwed)}</strong> in outstanding
              invoices. Please make payment at your earliest convenience.
            </p>
          </div>
        )}

        {/* Invoice List */}
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '0.95rem',
          color: '#F0F5F2',
          marginBottom: '0.75rem',
          letterSpacing: '0.3px',
        }}>
          All Invoices ({invoices.length})
        </h2>

        {invoices.length === 0 ? (
          <div style={{
            background: '#141A16',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            color: '#8A9E92',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</div>
            <p>No invoices found.</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            {invoices.map(inv => (
              <div key={inv.id} style={{
                background: '#141A16',
                border: `1px solid ${inv.status === 'paid'
                  ? 'rgba(0,197,102,0.1)'
                  : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '14px',
                padding: '1.2rem 1.5rem',
                transition: 'border-color 0.2s',
              }}>
                {/* Invoice Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: inv.items?.length > 0 ? '0.75rem' : 0,
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      color: '#F0F5F2',
                      fontSize: '0.95rem',
                      marginBottom: '0.3rem',
                    }}>
                      {inv.invoice_number}
                    </div>
                    <div style={{
                      color: '#8A9E92',
                      fontSize: '0.78rem',
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}>
                      <span>
                        Issued: {new Date(inv.created_at)
                          .toLocaleDateString('en-NG')}
                      </span>
                      {inv.due_date && (
                        <>
                          <span>•</span>
                          <span>
                            Due: {new Date(inv.due_date)
                              .toLocaleDateString('en-NG')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      color: '#F0F5F2',
                      marginBottom: '0.3rem',
                    }}>
                      {formatNaira(inv.total)}
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.2rem 0.7rem',
                      borderRadius: '100px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      fontFamily: 'Syne, sans-serif',
                      background: inv.status === 'paid'
                        ? 'rgba(0,197,102,0.1)'
                        : 'rgba(245,166,35,0.1)',
                      color: inv.status === 'paid'
                        ? '#00C566'
                        : '#f5a623',
                      border: inv.status === 'paid'
                        ? '1px solid rgba(0,197,102,0.2)'
                        : '1px solid rgba(245,166,35,0.2)',
                    }}>
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: inv.status === 'paid'
                          ? '#00C566'
                          : '#f5a623',
                      }} />
                      {inv.status === 'paid' ? 'PAID' : 'UNPAID'}
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                {inv.items?.length > 0 && (
                  <div style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    {inv.items.map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        color: '#8A9E92',
                        marginBottom: '0.3rem',
                        gap: '1rem',
                      }}>
                        <span style={{ flex: 1 }}>
                          {item.description}
                          {item.quantity > 1 && (
                            <span style={{ color: '#4A6055' }}>
                              {' '}× {item.quantity}
                            </span>
                          )}
                        </span>
                        <span style={{
                          color: '#F0F5F2',
                          fontWeight: 500,
                          flexShrink: 0,
                        }}>
                          {formatNaira(
                            Number(item.price) * Number(item.quantity)
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {inv.notes && (
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    color: '#4A6055',
                    fontSize: '0.8rem',
                    fontStyle: 'italic',
                  }}>
                    {inv.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <p style={{ color: '#4A6055', fontSize: '0.78rem' }}>
            Powered by{' '}
            <a
              href="https://stackpay.ng"
              style={{ color: '#00C566', textDecoration: 'none' }}
              target="_blank"
              rel="noreferrer"
            >
              StackPay
            </a>
            {' '}— Financial tools for Nigerian businesses
          </p>
        </div>
      </div>
    </div>
  )
}

export default ClientPortal
