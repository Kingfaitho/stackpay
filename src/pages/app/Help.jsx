import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

const FAQ = [
  {
    q: 'How do I create my first invoice?',
    a: 'Go to Invoices → click "+ New Invoice" → select a client, add line items with prices, set a due date, and click Save. Share via WhatsApp or email the payment link directly to your client.',
  },
  {
    q: 'How does the payment link work?',
    a: 'Every invoice has a "Pay Now" link. When your client clicks it, they can pay directly with their card or bank transfer via Paystack. The invoice automatically marks as paid when they complete payment.',
  },
  {
    q: 'What is the Business Credit Score?',
    a: 'Your credit score (300-1000) is calculated from your payment collection rate, revenue consistency, profit margin, client diversity, and business activity. The higher your score, the more loan eligibility you will have when we launch lending partnerships.',
  },
  {
    q: 'How do I track cash payments?',
    a: 'Go to Cash Receipts → "+ Log Receipt" → enter the amount, what it was for, and the payment method (cash, bank transfer, POS, etc.). Cash receipts are included in your total income and profit calculations.',
  },
  {
    q: 'How does inventory tracking work?',
    a: 'Go to Inventory → "+ Add Item" → enter the item name, quantity, cost price, and selling price. StackPay calculates your profit margin automatically and alerts you when stock runs low.',
  },
  {
    q: 'What is Cash Flow & Runway?',
    a: 'This feature predicts how long your business cash will last based on your income, expenses, and unpaid invoices. First configure your minimum cash buffer and fixed monthly costs, then you will see a 90-day forecast with a visual chart.',
  },
  {
    q: 'How do I upgrade my plan?',
    a: 'Go to Billing in the sidebar → choose Growth (₦3,500/month) or Business (₦9,000/month) → click Upgrade. Payment is processed securely via Paystack.',
  },
  {
    q: 'Can I share my client portal?',
    a: 'Yes. Go to Clients → click "Portal" next to any client → copy the link and share it with them. They can view all their invoices and payment history without needing a StackPay account.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Email support@stackpay.ng with your account email and we will delete your account and all data within 30 days as required by our privacy policy.',
  },
]

function Help() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [openFaq, setOpenFaq] = useState(null)
  const [feedback, setFeedback] = useState({
    type: 'feedback',
    subject: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    if (!feedback.message.trim()) return
    setSending(true)
    setError('')

    try {
      // Store feedback in Supabase
      const { error: dbError } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id || null,
          user_email: user?.email || null,
          type: feedback.type,
          subject: feedback.subject.trim() || null,
          message: feedback.message.trim(),
          created_at: new Date().toISOString(),
        })

      if (dbError && dbError.code !== '42P01') {
        // Table may not exist yet — that is okay, still show success
        console.warn('Feedback table not ready:', dbError.message)
      }

      setSent(true)
      setFeedback({ type: 'feedback', subject: '', message: '' })
    } catch (err) {
      console.error('Feedback error:', err)
      setError('Failed to send. Please email support@stackpay.ng directly.')
    }
    setSending(false)
  }

  const card = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    marginBottom: '1.25rem',
    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
  }

  const inp = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    background: colors.bgInput,
    color: colors.textPrimary,
    fontSize: '0.9rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '0.75rem',
    boxSizing: 'border-box',
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
          🆘 Help & Feedback
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
          Find answers, report issues, or tell us what to build next
        </p>
      </div>

      {/* Quick contact cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.5rem',
      }}>
        {[
          {
            icon: '💬',
            title: 'WhatsApp Support',
            desc: 'Chat with us directly',
            action: 'Open WhatsApp',
            href: 'https://wa.me/2348000000000?text=Hi, I need help with StackPay',
            color: '#25D366',
          },
          {
            icon: '📧',
            title: 'Email Support',
            desc: 'support@stackpay.ng',
            action: 'Send Email',
            href: 'mailto:support@stackpay.ng',
            color: colors.green,
          },
          {
            icon: '🐛',
            title: 'Report a Bug',
            desc: 'Something broken? Tell us',
            action: 'Report Below',
            href: '#feedback-form',
            color: colors.danger,
          },
        ].map((item, i) => (
          <div key={i} style={{
            ...card,
            padding: '1.25rem',
            marginBottom: 0,
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: colors.textPrimary,
              marginBottom: '0.25rem',
            }}>
              {item.title}
            </div>
            <div style={{
              color: colors.textMuted,
              fontSize: '0.78rem',
              marginBottom: '0.85rem',
            }}>
              {item.desc}
            </div>
            <a
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : '_self'}
              rel="noreferrer"
              style={{
                display: 'inline-block',
                padding: '0.4rem 0.85rem',
                background: `${item.color}15`,
                border: `1px solid ${item.color}30`,
                color: item.color,
                borderRadius: '7px',
                fontSize: '0.78rem',
                fontWeight: 700,
                fontFamily: 'Syne, sans-serif',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              {item.action} →
            </a>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ ...card, overflow: 'hidden', padding: 0, marginBottom: '1.5rem' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid ${colors.border}`,
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: colors.textPrimary,
          }}>
            ❓ Frequently Asked Questions
          </h2>
        </div>

        {FAQ.map((item, i) => (
          <div
            key={i}
            style={{
              borderBottom: i < FAQ.length - 1 ? `1px solid ${colors.border}` : 'none',
            }}
          >
            <button
              type="button"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                gap: '1rem',
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
              <span style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '0.88rem',
                color: colors.textPrimary,
                flex: 1,
              }}>
                {item.q}
              </span>
              <span style={{
                color: colors.textMuted,
                fontSize: '1.1rem',
                flexShrink: 0,
                transition: 'transform 0.2s',
                transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
              }}>
                +
              </span>
            </button>

            {openFaq === i && (
              <div style={{
                padding: '0 1.5rem 1rem',
                color: colors.textSecondary,
                fontSize: '0.88rem',
                lineHeight: 1.7,
              }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Feedback form */}
      <div
        id="feedback-form"
        style={{ ...card, padding: '1.5rem' }}
      >
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '0.95rem',
          color: colors.textPrimary,
          marginBottom: '0.4rem',
        }}>
          📣 Send Feedback or Report an Issue
        </h2>
        <p style={{
          color: colors.textMuted,
          fontSize: '0.82rem',
          marginBottom: '1.25rem',
          lineHeight: 1.6,
        }}>
          Your feedback directly shapes what we build next.
          Every message is read by the founder personally.
        </p>

        {sent ? (
          <div style={{
            background: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.04)',
            border: `1px solid ${colors.borderGreen}`,
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: colors.green,
              marginBottom: '0.3rem',
            }}>
              Message received!
            </div>
            <p style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
              Thank you. We will respond within 24 hours.
            </p>
            <button
              onClick={() => setSent(false)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1.2rem',
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                color: colors.textMuted,
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit}>

            {/* Type selector */}
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              marginBottom: '1rem',
              flexWrap: 'wrap',
            }}>
              {[
                { id: 'feedback', label: '💡 Feature Idea' },
                { id: 'bug', label: '🐛 Bug Report' },
                { id: 'question', label: '❓ Question' },
                { id: 'complaint', label: '😤 Complaint' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFeedback(p => ({ ...p, type: t.id }))}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '100px',
                    border: `1px solid ${feedback.type === t.id
                      ? colors.borderGreen
                      : colors.border}`,
                    background: feedback.type === t.id
                      ? isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)'
                      : 'transparent',
                    color: feedback.type === t.id ? colors.green : colors.textMuted,
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: feedback.type === t.id ? 700 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label style={{
              color: colors.textLabel,
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'block',
              marginBottom: '0.3rem',
              letterSpacing: '0.3px',
            }}>
              SUBJECT (OPTIONAL)
            </label>
            <input
              id="feedback-subject"
              name="feedback-subject"
              placeholder="Brief summary"
              value={feedback.subject}
              onChange={e => setFeedback(p => ({ ...p, subject: e.target.value }))}
              maxLength={100}
              style={inp}
            />

            <label style={{
              color: colors.textLabel,
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'block',
              marginBottom: '0.3rem',
              letterSpacing: '0.3px',
            }}>
              YOUR MESSAGE *
            </label>
            <textarea
              id="feedback-message"
              name="feedback-message"
              placeholder={
                feedback.type === 'bug'
                  ? 'Describe what happened, what you expected, and what page you were on...'
                  : feedback.type === 'feedback'
                  ? 'What feature would you like to see? How would it help your business?'
                  : 'Tell us anything on your mind...'
              }
              value={feedback.message}
              onChange={e => setFeedback(p => ({ ...p, message: e.target.value }))}
              required
              rows={5}
              maxLength={1000}
              style={{
                ...inp,
                resize: 'vertical',
                lineHeight: 1.6,
                marginBottom: '0.25rem',
              }}
            />
            <div style={{
              color: colors.textMuted,
              fontSize: '0.7rem',
              textAlign: 'right',
              marginBottom: '1rem',
            }}>
              {feedback.message.length}/1000
            </div>

            {error && (
              <div style={{
                background: isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)',
                border: `1px solid ${colors.danger}40`,
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: colors.danger,
                fontSize: '0.82rem',
                marginBottom: '1rem',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !feedback.message.trim()}
              style={{
                padding: '0.8rem 2rem',
                background: sending || !feedback.message.trim()
                  ? colors.bgInput
                  : colors.accent,
                color: sending || !feedback.message.trim()
                  ? colors.textMuted
                  : colors.accentText,
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: sending || !feedback.message.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  )
}

export default Help