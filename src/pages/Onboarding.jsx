import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../supabaseClient'

const BUSINESS_TYPES = [
  { id: 'photography', label: 'Photography & Videography', icon: '📸' },
  { id: 'fashion', label: 'Fashion & Tailoring', icon: '👗' },
  { id: 'catering', label: 'Catering & Food Business', icon: '🍽️' },
  { id: 'beauty', label: 'Beauty & Hair Salon', icon: '💅' },
  { id: 'consulting', label: 'Consulting & Coaching', icon: '💼' },
  { id: 'design', label: 'Freelance Design', icon: '🎨' },
  { id: 'tech', label: 'Software & Tech', icon: '💻' },
  { id: 'events', label: 'Event Planning', icon: '🎉' },
  { id: 'retail', label: 'Retail & Shop', icon: '🏪' },
  { id: 'construction', label: 'Construction & Engineering', icon: '🏗️' },
  { id: 'education', label: 'Education & Tutoring', icon: '📚' },
  { id: 'health', label: 'Healthcare & Wellness', icon: '🏥' },
  { id: 'transport', label: 'Transport & Logistics', icon: '🚗' },
  { id: 'media', label: 'Media & Content', icon: '🎬' },
  { id: 'other', label: 'Other Business', icon: '⚡' },
]

const STEPS = [
  { id: 1, title: 'Welcome to Ledga', subtitle: 'Your financial brain starts here' },
  { id: 2, title: 'About Your Business', subtitle: 'Help us personalise your experience' },
  { id: 3, title: 'Add Your First Client', subtitle: 'Who do you do business with?' },
  { id: 4, title: 'Create Your First Invoice', subtitle: 'Send your first payment request in 60 seconds' },
  { id: 5, title: 'You Are Ready', subtitle: 'Your Ledga is set up and working' },
]

export default function Onboarding() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 2 — Business info
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [customType, setCustomType] = useState('')
  const [phone, setPhone] = useState('')

  // Step 3 — First client
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientId, setClientId] = useState(null)

  // Step 4 — First invoice
  const [invoiceService, setInvoiceService] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceNote, setInvoiceNote] = useState('')
  const [createdInvoice, setCreatedInvoice] = useState(null)

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  const formatNaira = (n) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(n || 0)

  // STEP 2 — Save business profile
  const saveBusinessProfile = async () => {
    if (!businessName.trim() || !ownerName.trim()) return
    setSaving(true)
    const finalType = businessType === 'other' ? customType : businessType
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      business_name: businessName.trim(),
      owner_name: ownerName.trim(),
      business_type: finalType,
      phone: phone.trim() || null,
      onboarding_complete: false,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    setStep(3)
  }

  // STEP 3 — Save first client
  const saveClient = async () => {
    if (!clientName.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: clientName.trim(),
        phone: clientPhone.trim() || null,
        email: clientEmail.trim() || null,
      })
      .select()
      .single()
    if (data) setClientId(data.id)
    setSaving(false)
    setStep(4)
  }

  // STEP 4 — Create first invoice
  const createInvoice = async () => {
    if (!invoiceService.trim() || !invoiceAmount) return
    setSaving(true)
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
    const amount = Number(invoiceAmount)
    const { data } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: clientId,
        invoice_number: invoiceNumber,
        status: 'unpaid',
        items: [{ description: invoiceService.trim(), quantity: 1, price: amount }],
        subtotal: amount,
        tax: 0,
        total: amount,
        notes: invoiceNote.trim() || null,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0],
      })
      .select()
      .single()
    if (data) setCreatedInvoice(data)

    // Mark onboarding complete
    await supabase
      .from('profiles')
      .update({
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setSaving(false)
    setStep(5)
  }

  const shareOnWhatsApp = () => {
    if (!createdInvoice) return
    const paymentLink = `${window.location.origin}/pay/${createdInvoice.id}`
    const message = encodeURIComponent(
      `Hi ${clientName || 'there'} 👋\n\n` +
      `Please find your invoice below:\n\n` +
      `📋 Invoice: ${createdInvoice.invoice_number}\n` +
      `💰 Amount: ${formatNaira(createdInvoice.total)}\n` +
      `📅 Due: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG')}\n\n` +
      `Click to pay securely: ${paymentLink}\n\n` +
      `Powered by Ledga 🇳🇬`
    )
    const waNumber = clientPhone
      ? clientPhone.replace(/[^0-9]/g, '').replace(/^0/, '234')
      : ''
    const url = waNumber
      ? `https://wa.me/${waNumber}?text=${message}`
      : `https://wa.me/?text=${message}`
    window.open(url, '_blank')
  }

  // Shared styles
  const inp = {
    width: '100%',
    padding: '0.9rem 1.1rem',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    background: colors.bgInput,
    color: colors.textPrimary,
    fontSize: '0.95rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '0.85rem',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const lbl = {
    color: colors.textLabel,
    fontSize: '0.72rem',
    fontWeight: 700,
    display: 'block',
    marginBottom: '0.35rem',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  }

  const primaryBtn = {
    width: '100%',
    padding: '1rem',
    background: colors.green,
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: `0 4px 20px ${colors.green}40`,
    transition: 'all 0.2s',
    letterSpacing: '-0.3px',
  }

  const currentStep = STEPS[step - 1]

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgPrimary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem 1rem',
      fontFamily: 'DM Sans, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: isDark
          ? 'rgba(0,197,102,0.06)'
          : 'rgba(0,120,60,0.05)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: isDark
          ? 'rgba(124,106,247,0.07)'
          : 'rgba(91,78,199,0.05)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        zIndex: 2,
      }}>

        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 900,
            fontSize: '1.6rem',
            color: colors.green,
            letterSpacing: '-1px',
          }}>
            Ledga
          </div>
          <div style={{
            color: colors.textMuted,
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginTop: '0.15rem',
          }}>
            Your Financial Brain
          </div>
        </div>

        {/* Progress bar */}
        {step < 5 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}>
              <span style={{
                color: colors.textMuted,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}>
                Step {step} of {STEPS.length - 1}
              </span>
              <span style={{
                color: colors.green,
                fontSize: '0.72rem',
                fontWeight: 700,
              }}>
                {Math.round(progress)}% complete
              </span>
            </div>
            <div style={{
              height: '4px',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${colors.green}, ${colors.accent})`,
                borderRadius: '2px',
                transition: 'width 0.5s ease',
              }} />
            </div>

            {/* Step dots */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.6rem',
            }}>
              {STEPS.slice(0, 4).map((s) => (
                <div key={s.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: step > s.id
                      ? colors.green
                      : step === s.id
                      ? isDark ? 'rgba(0,197,102,0.15)' : 'rgba(0,120,60,0.1)'
                      : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: `2px solid ${step >= s.id ? colors.green : colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: step > s.id ? '#fff' : step === s.id ? colors.green : colors.textMuted,
                    transition: 'all 0.3s',
                    fontFamily: 'Syne, sans-serif',
                  }}>
                    {step > s.id ? '✓' : s.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card */}
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.4)'
            : '0 20px 60px rgba(0,0,0,0.08)',
        }}>

          {/* Step header */}
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.4rem',
              color: colors.textPrimary,
              marginBottom: '0.3rem',
              letterSpacing: '-0.5px',
            }}>
              {currentStep.title}
            </h2>
            <p style={{
              color: colors.textSecondary,
              fontSize: '0.88rem',
            }}>
              {currentStep.subtitle}
            </p>
          </div>

          {/* ── STEP 1 — Welcome ── */}
          {step === 1 && (
            <div>
              <div style={{
                display: 'grid',
                gap: '0.75rem',
                marginBottom: '1.75rem',
              }}>
                {[
                  {
                    icon: '📄',
                    title: 'Create professional invoices',
                    body: 'Send payment links your clients can pay instantly via card or transfer',
                  },
                  {
                    icon: '💰',
                    title: 'Know your real profit',
                    body: 'See exactly what you earned after every cost — no guessing',
                  },
                  {
                    icon: '💧',
                    title: '90-day cash flow forecast',
                    body: 'Know how long your business can survive before you need new money',
                  },
                  {
                    icon: '🤖',
                    title: 'AI financial advisor',
                    body: 'Get 3 specific actions every week based on your actual numbers',
                  },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    background: isDark
                      ? 'rgba(0,197,102,0.04)'
                      : 'rgba(0,120,60,0.03)',
                    border: `1px solid ${isDark
                      ? 'rgba(0,197,102,0.1)'
                      : 'rgba(0,120,60,0.08)'}`,
                    borderRadius: '12px',
                    alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <div>
                      <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: colors.textPrimary,
                        marginBottom: '0.15rem',
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        color: colors.textSecondary,
                        fontSize: '0.78rem',
                        lineHeight: 1.5,
                      }}>
                        {item.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                style={primaryBtn}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Set Up My Business →
              </button>

              <p style={{
                textAlign: 'center',
                color: colors.textMuted,
                fontSize: '0.72rem',
                marginTop: '1rem',
              }}>
                Takes 2 minutes · Free forever · No card needed
              </p>
            </div>
          )}

          {/* ── STEP 2 — Business Info ── */}
          {step === 2 && (
            <div>
              <label style={lbl}>YOUR FULL NAME *</label>
              <input
                placeholder="e.g. Chidi Okonkwo"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                id="owner-name"
                name="owner-name"
                style={inp}
                onFocus={e => e.target.style.borderColor = colors.green}
                onBlur={e => e.target.style.borderColor = colors.border}
              />

              <label style={lbl}>BUSINESS NAME *</label>
              <input
                placeholder="e.g. Chidi Photography Studio"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                id="business-name"
                name="business-name"
                style={inp}
                onFocus={e => e.target.style.borderColor = colors.green}
                onBlur={e => e.target.style.borderColor = colors.border}
              />

              <label style={lbl}>YOUR PHONE NUMBER</label>
              <input
                placeholder="08012345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                id="phone"
                name="phone"
                type="tel"
                style={inp}
                onFocus={e => e.target.style.borderColor = colors.green}
                onBlur={e => e.target.style.borderColor = colors.border}
              />

              <label style={lbl}>WHAT TYPE OF BUSINESS DO YOU RUN? *</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '0.5rem',
                marginBottom: '0.85rem',
              }}>
                {BUSINESS_TYPES.map(type => (
                  <div
                    key={type.id}
                    onClick={() => setBusinessType(type.id)}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderRadius: '10px',
                      border: `1px solid ${businessType === type.id
                        ? colors.green
                        : colors.border}`,
                      background: businessType === type.id
                        ? isDark ? 'rgba(0,197,102,0.1)' : 'rgba(0,120,60,0.08)'
                        : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                      {type.icon}
                    </div>
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: businessType === type.id
                        ? colors.green
                        : colors.textSecondary,
                      lineHeight: 1.3,
                      fontFamily: 'Syne, sans-serif',
                    }}>
                      {type.label}
                    </div>
                  </div>
                ))}
              </div>

              {businessType === 'other' && (
                <input
                  placeholder="Describe your business..."
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                  id="custom-type"
                  name="custom-type"
                  style={inp}
                />
              )}

              <button
                onClick={saveBusinessProfile}
                disabled={saving || !businessName.trim() || !ownerName.trim() || !businessType}
                style={{
                  ...primaryBtn,
                  opacity: saving || !businessName.trim() || !ownerName.trim() || !businessType
                    ? 0.5 : 1,
                  cursor: saving || !businessName.trim() || !ownerName.trim() || !businessType
                    ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Continue →'}
              </button>

              <button
                onClick={() => setStep(1)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  color: colors.textMuted,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.85rem',
                  marginTop: '0.5rem',
                }}
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── STEP 3 — First Client ── */}
          {step === 3 && (
            <div>
              <div style={{
                background: isDark
                  ? 'rgba(0,197,102,0.06)'
                  : 'rgba(0,120,60,0.04)',
                border: `1px solid ${isDark
                  ? 'rgba(0,197,102,0.15)'
                  : 'rgba(0,120,60,0.12)'}`,
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                gap: '0.65rem',
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
                <p style={{
                  color: colors.textSecondary,
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                }}>
                  Think of someone who owes you money right now or someone you are about to invoice.
                  Add them here and we will create their invoice in the next step.
                </p>
              </div>

              <label style={lbl}>CLIENT NAME *</label>
              <input
                placeholder="e.g. Emeka Okafor"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                id="client-name"
                name="client-name"
                style={inp}
                onFocus={e => e.target.style.borderColor = colors.green}
                onBlur={e => e.target.style.borderColor = colors.border}
              />

              <label style={lbl}>THEIR WHATSAPP NUMBER</label>
              <input
                placeholder="08012345678"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                id="client-phone"
                name="client-phone"
                type="tel"
                style={inp}
                onFocus={e => e.target.style.borderColor = colors.green}
                onBlur={e => e.target.style.borderColor = colors.border}
              />

              <label style={lbl}>THEIR EMAIL (OPTIONAL)</label>
              <input
                placeholder="emeka@example.com"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                id="client-email"
                name="client-email"
                type="email"
                style={{ ...inp, marginBottom: '1.25rem' }}
                onFocus={e => e.target.style.borderColor = colors.green}
                onBlur={e => e.target.style.borderColor = colors.border}
              />

              <button
                onClick={saveClient}
                disabled={saving || !clientName.trim()}
                style={{
                  ...primaryBtn,
                  opacity: saving || !clientName.trim() ? 0.5 : 1,
                  cursor: saving || !clientName.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Add Client →'}
              </button>

              <button
                onClick={() => { setClientId(null); setStep(4) }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  color: colors.textMuted,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.82rem',
                  marginTop: '0.5rem',
                }}
              >
                Skip for now →
              </button>
            </div>
          )}

          {/* ── STEP 4 — First Invoice ── */}
          {step === 4 && (
            <div>
              <div style={{
                background: isDark
                  ? 'rgba(0,197,102,0.06)'
                  : 'rgba(0,120,60,0.04)',
                border: `1px solid ${isDark
                  ? 'rgba(0,197,102,0.15)'
                  : 'rgba(0,120,60,0.12)'}`,
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                gap: '0.65rem',
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>🎯</span>
                <p style={{
                  color: colors.textSecondary,
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                }}>
                  {clientName
                    ? `Creating invoice for ${clientName}. After this step you will have a payment link you can send directly on WhatsApp.`
                    : 'Create your first invoice. After this you will have a payment link you can send directly on WhatsApp.'}
                </p>
              </div>

              <label style={lbl}>WHAT SERVICE DID YOU PROVIDE? *</label>
              <input
                placeholder="e.g. Wedding Photography, Logo Design, Catering"
                value={invoiceService}
                onChange={e => setInvoiceService(e.target.value)}
                id="invoice-service"
                name="invoice-service"
                style={inp}
                onFocus={e => e.target.style.borderColor = colors.green}
                onBlur={e => e.target.style.borderColor = colors.border}
              />

              <label style={lbl}>HOW MUCH ARE YOU CHARGING? (NGN) *</label>
              <input
                placeholder="e.g. 150000"
                value={invoiceAmount}
                onChange={e => setInvoiceAmount(e.target.value)}
                id="invoice-amount"
                name="invoice-amount"
                type="number"
                min="1"
                style={inp}
                onFocus={e => e.target.style.borderColor = colors.green}
                onBlur={e => e.target.style.borderColor = colors.border}
              />

              {invoiceAmount && Number(invoiceAmount) > 0 && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: isDark
                    ? 'rgba(0,197,102,0.08)'
                    : 'rgba(0,120,60,0.06)',
                  border: `1px solid ${colors.borderGreen}`,
                  borderRadius: '10px',
                  marginBottom: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    color: colors.textSecondary,
                    fontSize: '0.82rem',
                  }}>
                    Invoice Total
                  </span>
                  <span style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: colors.green,
                  }}>
                    {formatNaira(Number(invoiceAmount))}
                  </span>
                </div>
              )}

              <label style={lbl}>NOTE TO CLIENT (OPTIONAL)</label>
              <textarea
                placeholder="e.g. Thank you for choosing us. Payment is due within 7 days."
                value={invoiceNote}
                onChange={e => setInvoiceNote(e.target.value)}
                id="invoice-note"
                name="invoice-note"
                rows={2}
                style={{
                  ...inp,
                  resize: 'none',
                  lineHeight: 1.6,
                  marginBottom: '1.25rem',
                }}
                onFocus={e => e.target.style.borderColor = colors.green}
                onBlur={e => e.target.style.borderColor = colors.border}
              />

              <button
                onClick={createInvoice}
                disabled={saving || !invoiceService.trim() || !invoiceAmount}
                style={{
                  ...primaryBtn,
                  opacity: saving || !invoiceService.trim() || !invoiceAmount ? 0.5 : 1,
                  cursor: saving || !invoiceService.trim() || !invoiceAmount
                    ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => {
                  if (!saving && invoiceService.trim() && invoiceAmount) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {saving ? 'Creating Invoice...' : '⚡ Create Invoice & Get Payment Link'}
              </button>

              <button
                onClick={() => setStep(3)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  color: colors.textMuted,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.82rem',
                  marginTop: '0.5rem',
                }}
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── STEP 5 — Done ── */}
          {step === 5 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: isDark
                  ? 'rgba(0,197,102,0.12)'
                  : 'rgba(0,120,60,0.08)',
                border: `2px solid ${colors.borderGreen}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                fontSize: '2.2rem',
              }}>
                🎉
              </div>

              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: colors.green,
                marginBottom: '0.4rem',
              }}>
                Your Ledga is live!
              </h3>

              <p style={{
                color: colors.textSecondary,
                fontSize: '0.88rem',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}>
                {createdInvoice
                  ? `Invoice ${createdInvoice.invoice_number} is ready for ${formatNaira(createdInvoice.total)}. Send the payment link to ${clientName || 'your client'} right now on WhatsApp.`
                  : 'Your account is set up. Go to Invoices to create your first payment request.'}
              </p>

              {createdInvoice && (
                <>
                  {/* Payment link preview */}
                  <div style={{
                    background: isDark
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                  }}
                    onClick={() => {
                      const link = `${window.location.origin}/pay/${createdInvoice.id}`
                      navigator.clipboard?.writeText(link)
                    }}
                  >
                    <span style={{ fontSize: '0.85rem' }}>🔗</span>
                    <span style={{
                      color: colors.textMuted,
                      fontSize: '0.75rem',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'left',
                    }}>
                      {window.location.origin}/pay/{createdInvoice.id}
                    </span>
                    <span style={{
                      color: colors.green,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      fontFamily: 'Syne, sans-serif',
                    }}>
                      Copy
                    </span>
                  </div>

                  {/* WhatsApp share */}
                  <button
                    onClick={shareOnWhatsApp}
                    style={{
                      ...primaryBtn,
                      background: '#25D366',
                      boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    💬 Send Invoice on WhatsApp
                  </button>
                </>
              )}

              {/* What unlocks next */}
              <div style={{
                background: isDark
                  ? 'rgba(124,106,247,0.06)'
                  : 'rgba(91,78,199,0.04)',
                border: `1px solid ${isDark
                  ? 'rgba(124,106,247,0.15)'
                  : 'rgba(91,78,199,0.12)'}`,
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1rem',
                textAlign: 'left',
              }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: colors.purple,
                  marginBottom: '0.6rem',
                }}>
                  🔓 Features that unlock as you grow
                </div>
                {[
                  { threshold: 'After 3 invoices', feature: 'Cash Flow Forecasting & Runway' },
                  { threshold: 'After 5 invoices', feature: 'AI Financial Advisor' },
                  { threshold: 'After 10 invoices', feature: 'Business Credit Score' },
                  { threshold: 'After 1 month', feature: 'Full Intelligence Dashboard' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.4rem 0',
                    borderBottom: i < 3
                      ? `1px solid ${colors.border}`
                      : 'none',
                  }}>
                    <span style={{
                      color: colors.textSecondary,
                      fontSize: '0.78rem',
                    }}>
                      {item.feature}
                    </span>
                    <span style={{
                      color: colors.purple,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      fontFamily: 'Syne, sans-serif',
                    }}>
                      {item.threshold}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                style={primaryBtn}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Enter My Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}