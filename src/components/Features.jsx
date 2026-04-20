import { FileText, CreditCard, BarChart3, Users, Zap, Shield } from 'lucide-react';

const features = [
  {
    icon: <FileText size={22} />,
    title: 'Smart Invoicing',
    desc: 'Create professional invoices in seconds. Add your logo, set due dates, and send directly to clients via WhatsApp or email.',
  },
  {
    icon: <CreditCard size={22} />,
    title: 'Naira Payment Links',
    desc: 'Generate a payment link your customers tap to pay instantly. Powered by Paystack. Money lands in your account same day.',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Expense Tracking',
    desc: 'Log every cost — data, transport, stock, rent. See exactly where your money is going and stop bleeding cash silently.',
  },
  {
    icon: <Users size={22} />,
    title: 'Client Management',
    desc: 'Store all your clients in one place. See their full payment history, outstanding balances, and contact details instantly.',
  },
  {
    icon: <Zap size={22} />,
    title: 'Profit Dashboard',
    desc: 'See your real profit at a glance — total income, total expenses, and what actually remains. No accountant needed.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Secure & Private',
    desc: 'Your business data is encrypted and belongs to you alone. We will never sell your data or share it with third parties.',
  },
];

function Features() {
  return (
    <section id="features" style={{
      padding: '100px 5%',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Section Label */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: '60px',
      }}>
        <span style={{
          color: '#00C566',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '0.8rem',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Everything You Need
        </span>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
          letterSpacing: '-1px',
          color: '#F0F5F2',
          maxWidth: '600px',
          lineHeight: 1.2,
          marginBottom: '1rem',
        }}>
          One tool. Every financial task your business needs.
        </h2>
        <p style={{
          color: '#8A9E92',
          fontSize: '1rem',
          maxWidth: '480px',
          lineHeight: 1.7,
        }}>
          Most Nigerian SMEs use 4–6 different apps to do what StackPay does alone.
          Stop the chaos.
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
      }}>
        {features.map((f, i) => (
          <div
            key={i}
            style={{
              background: '#141A16',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '2rem',
              transition: 'border-color 0.3s, transform 0.3s',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(0,197,102,0.3)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              background: 'rgba(0,197,102,0.1)',
              border: '1px solid rgba(0,197,102,0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00C566',
              marginBottom: '1.2rem',
            }}>
              {f.icon}
            </div>
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '1.05rem',
              color: '#F0F5F2',
              marginBottom: '0.6rem',
            }}>
              {f.title}
            </h3>
            <p style={{
              color: '#8A9E92',
              fontSize: '0.9rem',
              lineHeight: 1.7,
            }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;