import { useTheme } from '../context/ThemeContext'
import { Link } from 'react-router-dom'

function Privacy() {
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
          Privacy Policy
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '0.85rem', marginBottom: '2.5rem' }}>
          Last updated: {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        {[
          { title: 'What We Collect', body: 'When you create an account: your name, business name, and email. When you use StackPay: invoices, client details, expenses, inventory, and payment transactions. Technical data for security purposes.' },
          { title: 'How We Use Your Information', body: 'To provide the StackPay service. To send account and payment notifications. To generate AI-powered business insights. To calculate your Business Credit Score. We do NOT use your data for advertising and we do NOT sell it.' },
          { title: 'How We Protect Your Data', body: 'All data is stored on Supabase servers with encryption at rest. All connections use TLS encryption. Passwords are hashed and never stored in plain text. Row-level security ensures you only access your own data.' },
          { title: 'Third Party Services', body: 'Paystack processes payments — your card details never touch our servers. Supabase handles database and authentication. OpenRouter processes anonymized business metrics for AI advice. We never send personally identifiable information to AI services.' },
          { title: 'Your Rights', body: 'You have the right to access, export, correct, and delete your data at any time. Email support@stackpay.ng to exercise these rights.' },
          { title: 'Business Credit Score', body: 'Your credit score is calculated from data you provide and is visible only to you. We will never share it with any third party without your explicit consent.' },
          { title: 'Contact', body: 'For privacy questions: support@stackpay.ng. We respond within 48 hours.' },
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

export default Privacy
