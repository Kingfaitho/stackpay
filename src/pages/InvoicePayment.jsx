import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function InvoicePayment() {
  const { invoiceId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (invoiceId) loadInvoice()
  }, [invoiceId])

  const loadInvoice = async () => {
    const { data: inv, error: invError } = await supabase
      .from('invoices')
      .select('*, clients(name, email)')
      .eq('id', invoiceId)
      .single()

    if (invError || !inv) {
      setError(true)
      setLoading(false)
      return
    }

    if (inv.status === 'paid') {
      setPaid(true)
    }

    setInvoice(inv)

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, owner_name, email, currency')
      .eq('id', inv.user_id)
      .single()

    setBusiness(profile)
    setLoading(false)
  }

  const handlePay = () => {
    if (!window.PaystackPop) {
      alert('Payment system is loading. Please refresh and try again.')
      return
    }

    if (!invoice.clients?.email) {
      alert('No client email found for this invoice. Contact the business owner.')
      return
    }

    setPaying(true)

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: invoice.clients.email,
      amount: Number(invoice.total) * 100,
      currency: business?.currency || 'NGN',
      ref: `STACKPAY-${invoice.invoice_number}-${Date.now()}`,
      metadata: {
        invoice_number: invoice.invoice_number,
        invoice_id: invoiceId,
      },
      callback: async (response) => {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paystack_ref: response.reference,
          })
          .eq('id', invoiceId)

        setInvoice({ ...invoice, status: 'paid' })
        setPaid(true)
        setPaying(false)
      },
      onClose: () => {
        setPaying(false)
      },
    })

    handler.openIframe()
  }

  const formatAmount = (amount) => {
    const currency = business?.currency || 'NGN'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

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
      <p>Loading invoice...</p>
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
        Invoice not found
      </h2>
      <p>This payment link may be invalid or expired.</p>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060908',
      padding: '2rem 5% 4rem',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          paddingTop: '1.5rem',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.6rem',
            color: '#EDF2EF',
          }}>
            Stack<span style={{ color: '#00C566' }}>Pay</span>
          </div>
        </div>

        {/* Paid Success State */}
        {paid ? (
          <div style={{
            background: '#141A16',
            border: '1px solid rgba(0,197,102,0.3)',
            borderRadius: '20px',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0,197,102,0.1)',
              border: '2px solid rgba(0,197,102,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 1.5rem',
            }}>
              ✓
            </div>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.5rem',
              color: '#00C566',
              marginBottom: '0.75rem',
            }}>
              Payment Successful!
            </h2>
            <p style={{
              color: '#7A9485',
              fontSize: '0.95rem',
              lineHeight: 1.7,
            }}>
              Invoice <strong style={{ color: '#F0F5F2' }}>
                {invoice?.invoice_number}
              </strong> has been paid.
              <br />
              Thank you for your business!
            </p>
          </div>
        ) : (
          <>
            {/* Business Info */}
            <div style={{
              background: '#141A16',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(0,197,102,0.1)',
                border: '1px solid rgba(0,197,102,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00C566',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '1.1rem',
                flexShrink: 0,
              }}>
                {business?.business_name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  color: '#F0F5F2',
                  fontSize: '0.95rem',
                  marginBottom: '0.15rem',
                }}>
                  {business?.business_name || 'Business'}
                </div>
                <div style={{ color: '#7A9485', fontSize: '0.8rem' }}>
                  Requesting payment for invoice{' '}
                  <span style={{ color: '#F0F5F2' }}>
                    {invoice?.invoice_number}
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div style={{
              background: '#141A16',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1rem',
            }}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                color: '#F0F5F2',
                fontSize: '0.9rem',
                marginBottom: '1rem',
                letterSpacing: '0.5px',
              }}>
                INVOICE DETAILS
              </h3>

              {/* Line items */}
              {invoice?.items?.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.88rem',
                  color: '#8A9E92',
                  marginBottom: '0.5rem',
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
                  <span style={{ color: '#F0F5F2', flexShrink: 0 }}>
                    {formatAmount(
                      Number(item.price) * Number(item.quantity)
                    )}
                  </span>
                </div>
              ))}

              {/* Tax line */}
              {invoice?.tax > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  color: '#f5a623',
                  marginTop: '0.5rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span>VAT (7.5%)</span>
                  <span>+{formatAmount(invoice.tax)}</span>
                </div>
              )}

              {/* Total */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  color: '#F0F5F2',
                  fontSize: '0.95rem',
                }}>
                  Total Amount Due
                </span>
                <span style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  color: '#00C566',
                  fontSize: '1.3rem',
                }}>
                  {formatAmount(invoice?.total)}
                </span>
              </div>

              {/* Due date */}
              {invoice?.due_date && (
                <div style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                }}>
                  <span style={{ color: '#7A9485' }}>Due Date</span>
                  <span style={{ color: '#f5a623' }}>
                    {new Date(invoice.due_date).toLocaleDateString('en-NG')}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {invoice?.notes && (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                color: '#7A9485',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}>
                {invoice.notes}
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={paying}
              style={{
                width: '100%',
                padding: '1.1rem',
                borderRadius: '14px',
                background: paying ? '#005a30' : '#00C566',
                color: '#060908',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '1.05rem',
                border: 'none',
                cursor: paying ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
              onMouseEnter={e => {
                if (!paying) e.currentTarget.style.background = '#00A855'
              }}
              onMouseLeave={e => {
                if (!paying) e.currentTarget.style.background = '#00C566'
              }}
            >
              {paying ? (
                <>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '2px solid rgba(0,0,0,0.2)',
                    borderTopColor: '#060908',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  💳 Pay {formatAmount(invoice?.total)} Now
                </>
              )}
            </button>

            <p style={{
              textAlign: 'center',
              color: '#4A6055',
              fontSize: '0.78rem',
            }}>
              🔒 Secured by Paystack. Your payment info is encrypted.
            </p>
          </>
        )}

        <p style={{
          textAlign: 'center',
          color: '#4A6055',
          fontSize: '0.72rem',
          marginTop: '2rem',
        }}>
          Powered by{' '}
          <a
            href="https://stackpay.ng"
            style={{ color: '#00C566', textDecoration: 'none' }}
          >
            StackPay
          </a>
          {' '}— Financial tools for Nigerian businesses
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default InvoicePayment
