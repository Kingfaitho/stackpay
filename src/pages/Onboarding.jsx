import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../supabaseClient'
import {
  Check, FileText, TrendingUp, Brain, DollarSign,
  ChevronRight, ChevronLeft, Zap, MessageCircle,
  BarChart2, Shield, Users, Camera, Scissors,
  UtensilsCrossed, Sparkles, Briefcase, Palette,
  Laptop, PartyPopper, Store, HardHat, GraduationCap,
  HeartPulse, Truck, Clapperboard, Lightbulb, Link2, Unlock
} from 'lucide-react'

const BUSINESS_TYPES = [
  { id: 'photography', label: 'Photography & Videography', icon: Camera },
  { id: 'fashion', label: 'Fashion & Tailoring', icon: Scissors },
  { id: 'catering', label: 'Catering & Food Business', icon: UtensilsCrossed },
  { id: 'beauty', label: 'Beauty & Hair Salon', icon: Sparkles },
  { id: 'consulting', label: 'Consulting & Coaching', icon: Briefcase },
  { id: 'design', label: 'Freelance Design', icon: Palette },
  { id: 'tech', label: 'Software & Tech', icon: Laptop },
  { id: 'events', label: 'Event Planning', icon: PartyPopper },
  { id: 'retail', label: 'Retail & Shop', icon: Store },
  { id: 'construction', label: 'Construction & Engineering', icon: HardHat },
  { id: 'education', label: 'Education & Tutoring', icon: GraduationCap },
  { id: 'health', label: 'Healthcare & Wellness', icon: HeartPulse },
  { id: 'transport', label: 'Transport & Logistics', icon: Truck },
  { id: 'media', label: 'Media & Content', icon: Clapperboard },
  { id: 'other', label: 'Other Business', icon: Zap },
]

const STEPS = [
  { id: 1, title: 'Welcome to Ledga', subtitle: 'Your financial brain starts here' },
  { id: 2, title: 'About Your Business', subtitle: 'Help us personalise your experience' },
  { id: 3, title: 'Add Your First Client', subtitle: 'Who do you do business with?' },
  { id: 4, title: 'Create Your First Invoice', subtitle: 'Send your first payment request in 60 seconds' },
  { id: 5, title: 'You Are Ready', subtitle: 'Your Ledga is set up and working' },
]

const FEATURES = [
  {
    icon: FileText,
    color: '#00C566',
    title: 'Professional invoices',
    body: 'Send payment links clients can pay instantly',
  },
  {
    icon: DollarSign,
    color: '#7C6AF7',
    title: 'Know your real profit',
    body: 'See exactly what you earned after every cost',
  },
  {
    icon: TrendingUp,
    color: '#f5a623',
    title: '90-day cash forecast',
    body: 'Know how long your business can survive',
  },
  {
    icon: Brain,
    color: '#00C566',
    title: 'AI financial advisor',
    body: '3 specific actions weekly based on your numbers',
  },
]

export default function Onboarding() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // If user already completed onboarding or has invoices, skip straight to dashboard
  useEffect(() => {
    if (!user) return
    const check = async () => {
      const { data: profileData } = await supabase
        .from('profiles').select('onboarding_complete').eq('id', user.id).single()
      if (profileData?.onboarding_complete === true) {
        navigate('/dashboard', { replace: true })
        return
      }
      const { count } = await supabase
        .from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      if (count && count > 0) {
        await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
        navigate('/dashboard', { replace: true })
      }
    }
    check()
  }, [user, navigate])

  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [customType, setCustomType] = useState('')
  const [phone, setPhone] = useState('')

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientId, setClientId] = useState(null)

  const [invoiceService, setInvoiceService] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceNote, setInvoiceNote] = useState('')
  const [createdInvoice, setCreatedInvoice] = useState(null)

  const formatNaira = (n) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(n || 0)

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
    await supabase
      .from('profiles')
      .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setSaving(false)
    setStep(5)
  }

  const shareOnWhatsApp = () => {
    if (!createdInvoice) return
    const paymentLink = `${window.location.origin}/pay/${createdInvoice.public_token}`
    const message = encodeURIComponent(
      `Hi ${clientName || 'there'} 👋\n\n` +
      `Please find your invoice below:\n\n` +
      `📋 Invoice: ${createdInvoice.invoice_number}\n` +
      `💰 Amount: ${formatNaira(createdInvoice.total)}\n` +
      `📅 Due: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG')}\n\n` +
      `Click to pay securely: ${paymentLink}\n\nPowered by Ledga 🇳🇬`
    )
    const waNumber = clientPhone
      ? clientPhone.replace(/[^0-9]/g, '').replace(/^0/, '234')
      : ''
    window.open(
      waNumber ? `https://wa.me/${waNumber}?text=${message}` : `https://wa.me/?text=${message}`,
      '_blank'
    )
  }

  const inp = {
    width: '100%',
    padding: '0.95rem 1.1rem',
    borderRadius: '14px',
    border: `1.5px solid ${colors.border}`,
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    color: colors.textPrimary,
    fontSize: '0.95rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '1rem',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backdropFilter: 'blur(4px)',
  }

  const lbl = {
    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    fontSize: '0.68rem',
    fontWeight: 700,
    display: 'block',
    marginBottom: '0.4rem',
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    fontFamily: 'DM Sans, sans-serif',
  }

  const primaryBtn = {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #00c566, #00a352)',
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(0,197,102,0.35)',
    transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
    letterSpacing: '-0.3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  }

  const STEP_LABELS = ['Welcome', 'Business', 'Client', 'Invoice']

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'DM Sans, sans-serif',
      background: isDark ? '#060908' : '#F0EDE5',
    }}>

      {/* ── LEFT BRAND PANEL ── */}
      <div
        className="ob-left"
        style={{
          width: '42%',
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #0B1F13 0%, #071209 55%, #0C1A10 100%)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '2.5rem 2.5rem 2rem',
          overflow: 'hidden',
        }}
      >
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: '5%', left: '-15%',
          width: '420px', height: '420px', borderRadius: '50%',
          background: 'rgba(0,197,102,0.10)', filter: 'blur(90px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '-10%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'rgba(124,106,247,0.07)', filter: 'blur(70px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '45%', right: '10%',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(0,197,102,0.05)', filter: 'blur(50px)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 900,
          fontSize: '1.7rem',
          color: '#fff',
          letterSpacing: '-1px',
          position: 'relative',
          zIndex: 1,
        }}>
          Led<span style={{ color: '#00C566' }}>ga</span>
        </div>

        {/* Hero copy */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            background: 'rgba(0,197,102,0.12)',
            border: '1px solid rgba(0,197,102,0.2)',
            borderRadius: '100px',
            marginBottom: '1.25rem',
            width: 'fit-content',
          }}>
            <div style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: '#00C566',
              boxShadow: '0 0 8px rgba(0,197,102,0.8)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{
              color: '#00C566',
              fontSize: '0.7rem',
              fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.5px',
            }}>
              BUILT FOR NIGERIAN BUSINESSES
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(1.7rem, 2.8vw, 2.5rem)',
            color: '#fff',
            lineHeight: 1.12,
            letterSpacing: '-1.5px',
            marginBottom: '1rem',
          }}>
            The financial brain your business deserves
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: '0.92rem',
            lineHeight: 1.75,
            marginBottom: '2.5rem',
            maxWidth: '340px',
          }}>
            Invoice clients, track expenses, and know your real profit - all in one place.
          </p>

          {/* Feature cards - floating */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { Icon: FileText, label: 'Create invoices in 60 seconds', delay: '0s' },
              { Icon: BarChart2, label: 'Track real profit daily', delay: '0.6s' },
              { Icon: TrendingUp, label: '90-day cash flow forecast', delay: '1.2s' },
              { Icon: Shield, label: 'Secure - free to start forever', delay: '1.8s' },
            ].map(({ Icon, label, delay }, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                animation: `floatCard 3.5s ease-in-out ${delay} infinite`,
              }}>
                <div style={{
                  width: '30px', height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(0,197,102,0.12)',
                  border: '1px solid rgba(0,197,102,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} color="#00C566" strokeWidth={2} />
                </div>
                <span style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.82rem',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 500,
                }}>
                  {label}
                </span>
                <Check size={13} color="#00C566" strokeWidth={2.5} style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          color: 'rgba(255,255,255,0.2)',
          fontSize: '0.7rem',
          fontFamily: 'DM Sans, sans-serif',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Shield size={11} strokeWidth={2} /> Secure
          </span>
          <span>·</span>
          <span>Free to start</span>
          <span>·</span>
          <span>No credit card</span>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        overflowY: 'auto',
      }}>

        {/* Mobile logo (hidden on desktop) */}
        <div className="ob-mobile-logo" style={{
          padding: '1.5rem 1.5rem 0',
          display: 'none',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 900,
            fontSize: '1.5rem',
            color: colors.textPrimary,
            letterSpacing: '-1px',
          }}>
            Led<span style={{ color: colors.green }}>ga</span>
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2rem 2.5rem',
          maxWidth: '520px',
          width: '100%',
          margin: '0 auto',
        }}>

          {/* Step indicator */}
          {step < 5 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                marginBottom: '0.75rem',
              }}>
                {STEP_LABELS.map((label, i) => {
                  const s = i + 1
                  const done = step > s
                  const active = step === s
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 1 : 0 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: done
                          ? colors.green
                          : active
                          ? isDark ? 'rgba(0,197,102,0.15)' : 'rgba(0,150,70,0.1)'
                          : 'transparent',
                        border: `2px solid ${done || active ? colors.green : colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.35s cubic-bezier(.4,0,.2,1)',
                      }}>
                        {done
                          ? <Check size={14} color="#fff" strokeWidth={2.5} />
                          : <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: active ? colors.green : colors.textMuted,
                              fontFamily: 'Syne, sans-serif',
                            }}>{s}</span>
                        }
                      </div>
                      {i < STEP_LABELS.length - 1 && (
                        <div style={{
                          flex: 1,
                          height: '2px',
                          background: done
                            ? colors.green
                            : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                          transition: 'background 0.35s',
                          margin: '0 4px',
                        }} />
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                {STEP_LABELS.map((label, i) => (
                  <span key={i} style={{
                    fontSize: '0.65rem',
                    fontWeight: step === i + 1 ? 700 : 500,
                    color: step === i + 1
                      ? colors.green
                      : step > i + 1
                      ? isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'
                      : colors.textMuted,
                    fontFamily: 'Syne, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    transition: 'color 0.3s',
                    textAlign: i === 0 ? 'left' : i === STEP_LABELS.length - 1 ? 'right' : 'center',
                  }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Animated step content */}
          <div key={step} style={{ animation: 'fadeInUp 0.32s ease forwards' }}>

            {/* ── STEP 1 - Welcome ── */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 900,
                    fontSize: 'clamp(1.6rem, 3vw, 2rem)',
                    color: colors.textPrimary,
                    letterSpacing: '-1px',
                    lineHeight: 1.15,
                    marginBottom: '0.6rem',
                  }}>
                    Know your real profit.<br />
                    Get paid faster.
                  </h2>
                  <p style={{
                    color: colors.textSecondary,
                    fontSize: '0.92rem',
                    lineHeight: 1.7,
                  }}>
                    Ledga gives Nigerian business owners the financial tools big companies use - simple, fast, and built for you.
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.7rem',
                  marginBottom: '2rem',
                }}>
                  {FEATURES.map((f, i) => (
                    <div key={i} style={{
                      padding: '1rem',
                      borderRadius: '16px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                    }}>
                      <div style={{
                        width: '34px', height: '34px',
                        borderRadius: '10px',
                        background: `${f.color}18`,
                        border: `1px solid ${f.color}28`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.65rem',
                      }}>
                        <f.icon size={15} color={f.color} strokeWidth={2} />
                      </div>
                      <div style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: colors.textPrimary,
                        marginBottom: '0.2rem',
                      }}>
                        {f.title}
                      </div>
                      <div style={{
                        color: colors.textMuted,
                        fontSize: '0.7rem',
                        lineHeight: 1.5,
                      }}>
                        {f.body}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  style={primaryBtn}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,197,102,0.45)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,197,102,0.35)'
                  }}
                >
                  Set Up My Business
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>

                <p style={{
                  textAlign: 'center',
                  color: colors.textMuted,
                  fontSize: '0.72rem',
                  marginTop: '0.85rem',
                }}>
                  Takes 2 minutes · Free forever · No card needed
                </p>
              </div>
            )}

            {/* ── STEP 2 - Business Info ── */}
            {step === 2 && (
              <div>
                <div style={{ marginBottom: '1.75rem' }}>
                  <h2 style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    color: colors.textPrimary,
                    letterSpacing: '-0.5px',
                    marginBottom: '0.35rem',
                  }}>
                    About your business
                  </h2>
                  <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
                    We use this to personalise your dashboard and invoices.
                  </p>
                </div>

                <label style={lbl}>YOUR FULL NAME *</label>
                <input
                  placeholder="e.g. Chidi Okonkwo"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  id="owner-name"
                  name="owner-name"
                  style={inp}
                  onFocus={e => {
                    e.target.style.borderColor = colors.green
                    e.target.style.boxShadow = `0 0 0 3px ${colors.green}18`
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
                />

                <label style={lbl}>BUSINESS NAME *</label>
                <input
                  placeholder="e.g. Chidi Photography Studio"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  id="business-name"
                  name="business-name"
                  style={inp}
                  onFocus={e => {
                    e.target.style.borderColor = colors.green
                    e.target.style.boxShadow = `0 0 0 3px ${colors.green}18`
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
                />

                <label style={lbl}>PHONE NUMBER (OPTIONAL)</label>
                <input
                  placeholder="08012345678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  id="phone"
                  name="phone"
                  type="tel"
                  style={inp}
                  onFocus={e => {
                    e.target.style.borderColor = colors.green
                    e.target.style.boxShadow = `0 0 0 3px ${colors.green}18`
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
                />

                <label style={{ ...lbl, marginBottom: '0.65rem' }}>WHAT TYPE OF BUSINESS? *</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}>
                  {BUSINESS_TYPES.map(type => (
                    <div
                      key={type.id}
                      onClick={() => setBusinessType(type.id)}
                      style={{
                        padding: '0.7rem 0.5rem',
                        borderRadius: '12px',
                        border: `1.5px solid ${businessType === type.id ? colors.green : colors.border}`,
                        background: businessType === type.id
                          ? isDark ? 'rgba(0,197,102,0.1)' : 'rgba(0,150,70,0.07)'
                          : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.18s',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>
                        <type.icon
                          size={18}
                          strokeWidth={2}
                          color={businessType === type.id ? colors.green : colors.textMuted}
                        />
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: businessType === type.id ? colors.green : colors.textSecondary,
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
                    opacity: saving || !businessName.trim() || !ownerName.trim() || !businessType ? 0.45 : 1,
                    cursor: saving || !businessName.trim() || !ownerName.trim() || !businessType ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!saving && businessName.trim() && ownerName.trim() && businessType) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,197,102,0.45)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,197,102,0.35)'
                  }}
                >
                  {saving ? 'Saving...' : 'Continue'}
                  {!saving && <ChevronRight size={18} strokeWidth={2.5} />}
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <ChevronLeft size={15} /> Back
                </button>
              </div>
            )}

            {/* ── STEP 3 - First Client ── */}
            {step === 3 && (
              <div>
                <div style={{ marginBottom: '1.75rem' }}>
                  <h2 style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    color: colors.textPrimary,
                    letterSpacing: '-0.5px',
                    marginBottom: '0.35rem',
                  }}>
                    Add your first client
                  </h2>
                  <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
                    Who do you do business with?
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.65rem',
                  padding: '0.9rem 1rem',
                  background: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,150,70,0.05)',
                  border: `1px solid ${isDark ? 'rgba(0,197,102,0.15)' : 'rgba(0,150,70,0.12)'}`,
                  borderRadius: '12px',
                  marginBottom: '1.25rem',
                  alignItems: 'flex-start',
                }}>
                  <Lightbulb size={16} color={colors.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ color: colors.textSecondary, fontSize: '0.82rem', lineHeight: 1.6 }}>
                    Think of someone who owes you money right now or someone you are about to invoice. Add them here.
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
                  onFocus={e => {
                    e.target.style.borderColor = colors.green
                    e.target.style.boxShadow = `0 0 0 3px ${colors.green}18`
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
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
                  onFocus={e => {
                    e.target.style.borderColor = colors.green
                    e.target.style.boxShadow = `0 0 0 3px ${colors.green}18`
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
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
                  onFocus={e => {
                    e.target.style.borderColor = colors.green
                    e.target.style.boxShadow = `0 0 0 3px ${colors.green}18`
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
                />

                <button
                  onClick={saveClient}
                  disabled={saving || !clientName.trim()}
                  style={{
                    ...primaryBtn,
                    opacity: saving || !clientName.trim() ? 0.45 : 1,
                    cursor: saving || !clientName.trim() ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!saving && clientName.trim()) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,197,102,0.45)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,197,102,0.35)'
                  }}
                >
                  {saving ? 'Saving...' : (
                    <>
                      <Users size={17} strokeWidth={2} />
                      Add Client & Continue
                    </>
                  )}
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
                  Skip, add client later →
                </button>
              </div>
            )}

            {/* ── STEP 4 - First Invoice ── */}
            {step === 4 && (
              <div>
                <div style={{ marginBottom: '1.75rem' }}>
                  <h2 style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    color: colors.textPrimary,
                    letterSpacing: '-0.5px',
                    marginBottom: '0.35rem',
                  }}>
                    Create your first invoice
                  </h2>
                  <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
                    {clientName
                      ? `For ${clientName} - you'll get a payment link to send on WhatsApp.`
                      : "You'll get a payment link to send directly on WhatsApp."}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.65rem',
                  padding: '0.9rem 1rem',
                  background: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,150,70,0.05)',
                  border: `1px solid ${isDark ? 'rgba(0,197,102,0.15)' : 'rgba(0,150,70,0.12)'}`,
                  borderRadius: '12px',
                  marginBottom: '1.25rem',
                }}>
                  <Zap size={16} color={colors.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ color: colors.textSecondary, fontSize: '0.82rem', lineHeight: 1.6 }}>
                    After this you will have a live payment link - paste it on WhatsApp and get paid.
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
                  onFocus={e => {
                    e.target.style.borderColor = colors.green
                    e.target.style.boxShadow = `0 0 0 3px ${colors.green}18`
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
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
                  onFocus={e => {
                    e.target.style.borderColor = colors.green
                    e.target.style.boxShadow = `0 0 0 3px ${colors.green}18`
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
                />

                {invoiceAmount && Number(invoiceAmount) > 0 && (
                  <div style={{
                    padding: '0.85rem 1.1rem',
                    background: isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,150,70,0.06)',
                    border: `1.5px solid ${isDark ? 'rgba(0,197,102,0.2)' : 'rgba(0,150,70,0.15)'}`,
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ color: colors.textSecondary, fontSize: '0.82rem' }}>Invoice Total</span>
                    <span style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 800,
                      fontSize: '1.15rem',
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
                  style={{ ...inp, resize: 'none', lineHeight: 1.6, marginBottom: '1.25rem' }}
                  onFocus={e => {
                    e.target.style.borderColor = colors.green
                    e.target.style.boxShadow = `0 0 0 3px ${colors.green}18`
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
                />

                <button
                  onClick={createInvoice}
                  disabled={saving || !invoiceService.trim() || !invoiceAmount}
                  style={{
                    ...primaryBtn,
                    opacity: saving || !invoiceService.trim() || !invoiceAmount ? 0.45 : 1,
                    cursor: saving || !invoiceService.trim() || !invoiceAmount ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!saving && invoiceService.trim() && invoiceAmount) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,197,102,0.45)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,197,102,0.35)'
                  }}
                >
                  {saving ? 'Creating Invoice...' : (
                    <>
                      <Zap size={17} strokeWidth={2} />
                      Create Invoice & Get Payment Link
                    </>
                  )}
                </button>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => setStep(3)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'transparent',
                      color: colors.textMuted,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.from('profiles')
                        .update({ onboarding_complete: true })
                        .eq('id', user.id)
                      navigate('/dashboard', { replace: true })
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'transparent',
                      color: colors.textMuted,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '0.82rem',
                    }}
                  >
                    Skip, go to dashboard →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5 - Done ── */}
            {step === 5 && (
              <div style={{ textAlign: 'center' }}>

                {/* Success ring */}
                <div style={{
                  position: 'relative',
                  width: '90px',
                  height: '90px',
                  margin: '0 auto 1.5rem',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: `2px solid ${colors.green}`,
                    animation: 'ringPulse 2s ease-in-out infinite',
                    opacity: 0.4,
                  }} />
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: isDark ? 'rgba(0,197,102,0.12)' : 'rgba(0,150,70,0.08)',
                    border: `2px solid ${isDark ? 'rgba(0,197,102,0.3)' : 'rgba(0,150,70,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    <Check size={36} color={colors.green} strokeWidth={2.5} />
                  </div>
                </div>

                <h2 style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 900,
                  fontSize: '1.8rem',
                  color: colors.textPrimary,
                  letterSpacing: '-0.8px',
                  marginBottom: '0.5rem',
                }}>
                  You're all set
                </h2>

                <p style={{
                  color: colors.textSecondary,
                  fontSize: '0.9rem',
                  lineHeight: 1.7,
                  marginBottom: '1.75rem',
                  maxWidth: '360px',
                  margin: '0 auto 1.75rem',
                }}>
                  {createdInvoice
                    ? `Invoice ${createdInvoice.invoice_number} is ready for ${formatNaira(createdInvoice.total)}. Send the payment link to ${clientName || 'your client'} right now on WhatsApp.`
                    : 'Your account is set up. Go to Invoices to create your first payment request.'}
                </p>

                {createdInvoice && (
                  <>
                    {/* Payment link chip */}
                    <div
                      onClick={() => {
                        const link = `${window.location.origin}/pay/${createdInvoice.public_token}`
                        navigator.clipboard?.writeText(link)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.85rem 1rem',
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        marginBottom: '1rem',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = colors.borderGreen}
                      onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
                    >
                      <Link2 size={15} color={colors.green} strokeWidth={2} style={{ flexShrink: 0 }} />
                      <span style={{
                        color: colors.textMuted,
                        fontSize: '0.75rem',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {window.location.origin}/pay/{createdInvoice.public_token}
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

                    <button
                      onClick={shareOnWhatsApp}
                      style={{
                        ...primaryBtn,
                        background: 'linear-gradient(135deg, #25D366, #1ebe5d)',
                        boxShadow: '0 4px 24px rgba(37,211,102,0.35)',
                        marginBottom: '0.75rem',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,211,102,0.45)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,211,102,0.35)'
                      }}
                    >
                      <MessageCircle size={18} strokeWidth={2} />
                      Send Invoice on WhatsApp
                    </button>
                  </>
                )}

                {/* Unlock roadmap */}
                <div style={{
                  background: isDark ? 'rgba(124,106,247,0.06)' : 'rgba(91,78,199,0.04)',
                  border: `1px solid ${isDark ? 'rgba(124,106,247,0.15)' : 'rgba(91,78,199,0.12)'}`,
                  borderRadius: '14px',
                  padding: '1rem 1.1rem',
                  marginBottom: '1rem',
                  textAlign: 'left',
                }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: colors.purple,
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}>
                    <Unlock size={13} strokeWidth={2.5} /> Features that unlock as you grow
                  </div>
                  {[
                    { threshold: 'After 3 invoices', feature: 'Cash Flow Forecasting' },
                    { threshold: 'After 5 invoices', feature: 'AI Financial Advisor' },
                    { threshold: 'After 10 invoices', feature: 'Business Credit Score' },
                    { threshold: 'After 1 month', feature: 'Full Intelligence Dashboard' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.45rem 0',
                      borderBottom: i < 3 ? `1px solid ${colors.border}` : 'none',
                    }}>
                      <span style={{ color: colors.textSecondary, fontSize: '0.78rem' }}>
                        {item.feature}
                      </span>
                      <span style={{
                        color: colors.purple,
                        fontSize: '0.65rem',
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
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,197,102,0.45)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,197,102,0.35)'
                  }}
                >
                  Enter My Dashboard
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ob-left { display: none !important; }
          .ob-mobile-logo { display: block !important; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes ringPulse {
          0%   { transform: scale(1);    opacity: 0.4; }
          50%  { transform: scale(1.25); opacity: 0;   }
          100% { transform: scale(1);    opacity: 0.4; }
        }
        input::placeholder, textarea::placeholder {
          color: rgba(128,128,128,0.5);
        }
      `}</style>
    </div>
  )
}
