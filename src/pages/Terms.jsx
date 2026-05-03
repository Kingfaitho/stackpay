import { useTheme } from '../context/ThemeContext'
import { Link } from 'react-router-dom'

function Terms() {
  const { colors } = useTheme()
  return (
    <div style={{ minHeight: '100vh', background: colors.bgPrimary, padding: '4rem 5%' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <Link to="/" style={{ color: colors.green, textDecoration: 'none', fontSize: '0.88rem' }}>
          ← Back
        </Link>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '2rem', color: colors.textPrimary,
          marginTop: '1.5rem', marginBottom: '0.5rem',
        }}>
          Terms of Service
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '0.85rem', marginBottom: '2.5rem' }}>
          Last updated: {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        {[
          { title: '1. Acceptance', body: 'By creating an account on StackPay, you agree to these Terms of Service. If you do not agree, please do not use the service.' },
          { title: '2. What StackPay Does', body: 'StackPay is a financial management tool for Nigerian small businesses. We provide invoicing, expense tracking, client management, payment processing, inventory management, and AI-powered business insights.' },
          { title: '3. Your Account', body: 'You are responsible for maintaining the security of your account. You must provide accurate information and be at least 18 years old to use StackPay.' },
          { title: '4. Payments and Subscriptions', body: 'StackPay offers a free Starter plan and paid plans billed monthly via Paystack. You may cancel at any time. We do not offer refunds for partial months. All prices are in Nigerian Naira.' },
          { title: '5. Your Data', body: 'You own your business data. We do not sell your data to third parties. You may export or delete your data at any time by contacting support@stackpay.ng.' },
          { title: '6. Acceptable Use', body: 'You may not use StackPay for illegal activities, fraud, or money laundering. Violation of these terms may result in immediate account termination.' },
          { title: '7. Limitation of Liability', body: 'StackPay provides tools, not licensed financial advice. Our AI insights are informational only. Our liability is limited to amounts paid in the 3 months preceding any claim.' },
          { title: '8. Contact', body: 'For questions: support@stackpay.ng' },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: colors.textPrimary, marginBottom: '0.6rem' }}>
              {s.title}
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: '0.92rem', lineHeight: 1.8 }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Terms
