import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'Forever free',
    color: 'rgba(255,255,255,0.07)',
    textColor: '#F0F5F2',
    features: [
      '5 invoices per month',
      '2 clients',
      'Basic expense tracking',
      'Payment links (Naira)',
      'Email support',
    ],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '₦3,500',
    sub: 'per month',
    color: '#00C566',
    textColor: '#080C0A',
    features: [
      'Unlimited invoices',
      'Unlimited clients',
      'Full expense tracker',
      'Profit & loss dashboard',
      'Payment links (Naira + USD)',
      'WhatsApp invoice sharing',
      'Priority support',
    ],
    cta: 'Get Early Access',
    highlight: true,
  },
  {
    name: 'Business',
    price: '₦9,000',
    sub: 'per month',
    color: 'rgba(255,255,255,0.07)',
    textColor: '#F0F5F2',
    features: [
      'Everything in Growth',
      'Team members (up to 5)',
      'Multi-business support',
      'Custom invoice branding',
      'Monthly financial report',
      'Dedicated account manager',
    ],
    cta: 'Join Waitlist',
    highlight: false,
  },
];

function Pricing() {
  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="pricing" style={{
      padding: '100px 5%',
      background: '#0F1510',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            color: '#00C566',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '1rem',
          }}>
            Pricing
          </span>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            letterSpacing: '-1px',
            color: '#F0F5F2',
            lineHeight: 1.2,
            marginBottom: '1rem',
          }}>
            Priced for Nigerian businesses
          </h2>
          <p style={{ color: '#8A9E92', fontSize: '1rem' }}>
            No dollar pricing. No confusion. Pay in Naira and cancel anytime.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}>
          {plans.map((plan, i) => (
            <div
              key={i}
              style={{
                background: plan.highlight ? 'transparent' : '#141A16',
                border: plan.highlight
                  ? '2px solid #00C566'
                  : '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px',
                padding: '2rem',
                position: 'relative',
                transform: plan.highlight ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              {plan.highlight && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#00C566',
                  color: '#080C0A',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '0.3rem 1rem',
                  borderRadius: '100px',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.5px',
                }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                color: plan.highlight ? '#00C566' : '#8A9E92',
                marginBottom: '1rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                {plan.name}
              </div>

              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(2rem, 3vw, 2.5rem)',
                color: '#F0F5F2',
                letterSpacing: '-1px',
                lineHeight: 1,
                marginBottom: '0.3rem',
              }}>
                {plan.price}
              </div>
              <div style={{
                color: '#8A9E92',
                fontSize: '0.85rem',
                marginBottom: '1.8rem',
              }}>
                {plan.sub}
              </div>

              <ul style={{ listStyle: 'none', marginBottom: '2rem' }}>
                {plan.features.map((feat, j) => (
                  <li key={j} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    color: '#8A9E92',
                    fontSize: '0.9rem',
                    marginBottom: '0.8rem',
                    lineHeight: 1.5,
                  }}>
                    <Check
                      size={16}
                      style={{
                        color: '#00C566',
                        flexShrink: 0,
                        marginTop: '3px',
                      }}
                    />
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                onClick={scrollToWaitlist}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  background: plan.highlight ? '#00C566' : 'transparent',
                  color: plan.highlight ? '#080C0A' : '#F0F5F2',
                  border: plan.highlight
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.15)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (plan.highlight) {
                    e.currentTarget.style.background = '#00A855';
                  } else {
                    e.currentTarget.style.borderColor = 'rgba(0,197,102,0.4)';
                    e.currentTarget.style.color = '#00C566';
                  }
                }}
                onMouseLeave={e => {
                  if (plan.highlight) {
                    e.currentTarget.style.background = '#00C566';
                  } else {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = '#F0F5F2';
                  }
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;