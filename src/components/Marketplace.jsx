const automations = [
  {
    icon: '🛍',
    category: 'Retail & Fashion',
    title: 'Instagram DM Auto-Reply',
    desc: 'Automatically reply to price inquiries on Instagram DMs with your product prices, availability and payment link.',
    price: '₦15,000/mo',
    tag: 'Most Popular',
    tagColor: '#00C566',
  },
  {
    icon: '🍽',
    category: 'Food & Catering',
    title: 'WhatsApp Order System',
    desc: 'Customers send their order via WhatsApp, the system collects their details, confirms the order and sends payment link automatically.',
    price: '₦12,000/mo',
    tag: 'Hot 🔥',
    tagColor: '#f5a623',
  },
  {
    icon: '💆',
    category: 'Beauty & Wellness',
    title: 'Appointment Booking Bot',
    desc: 'Clients book appointments 24/7 via WhatsApp or your website. Sends reminders, confirmations and accepts deposits automatically.',
    price: '₦18,000/mo',
    tag: 'New',
    tagColor: '#7C6AF7',
  },
  {
    icon: '📦',
    category: 'Logistics & Delivery',
    title: 'Delivery Status Tracker',
    desc: 'Automatically sends customers real-time delivery updates via WhatsApp from pickup to drop-off. Reduces customer service calls by 80%.',
    price: '₦20,000/mo',
    tag: 'Coming Soon',
    tagColor: '#4A6055',
  },
  {
    icon: '🏠',
    category: 'Real Estate',
    title: 'Property Inquiry Handler',
    desc: 'Captures property inquiries from social media and websites, qualifies leads automatically and books viewings into your calendar.',
    price: '₦25,000/mo',
    tag: 'Coming Soon',
    tagColor: '#4A6055',
  },
  {
    icon: '📚',
    category: 'Tutoring & Education',
    title: 'Student Enrollment System',
    desc: 'Automates student registration, fee collection, class reminders and progress reports via WhatsApp for tutors and schools.',
    price: '₦10,000/mo',
    tag: 'Coming Soon',
    tagColor: '#4A6055',
  },
]

function Marketplace() {
  return (
    <section id="marketplace" style={{
      padding: '100px 5%',
      background: '#0D1410',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,197,102,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,197,102,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '70px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(245,166,35,0.1)',
            border: '1px solid rgba(245,166,35,0.25)',
            borderRadius: '100px',
            padding: '0.35rem 1rem',
            fontSize: '0.8rem',
            color: '#f5a623',
            fontWeight: 600,
            marginBottom: '1.5rem',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '0.5px',
          }}>
            ⚡️ Automation Marketplace
          </div>

          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            letterSpacing: '-1px',
            color: '#EDF2EF',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}>
            Plug-and-play automations{' '}
            <br />
            <span style={{ color: '#f5a623' }}>built for your type of business</span>
          </h2>
          <p style={{
            color: '#7A9485',
            fontSize: '1rem',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.8,
          }}>
            Don't just track money — grow faster. Pick an automation built
            for your industry and let technology run your business while you focus on customers.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
          {automations.map((item, i) => (
            <div
              key={i}
              style={{
                background: '#111815',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px',
                padding: '1.8rem',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(0,197,102,0.25)'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Top row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.2rem',
              }}>
                <div style={{
                  fontSize: '2rem',
                  lineHeight: 1,
                }}>
                  {item.icon}
                </div>
                <div style={{
                  background: `${item.tagColor}15`,
                  border: `1px solid ${item.tagColor}30`,
                  color: item.tagColor,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '100px',
                  fontFamily: 'Syne, sans-serif',
                  letterSpacing: '0.3px',
                }}>
                  {item.tag}
                </div>
              </div>

              <div style={{
                color: '#4A6055',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}>
                {item.category}
              </div>

              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: '#EDF2EF',
                marginBottom: '0.75rem',
                lineHeight: 1.3,
              }}>
                {item.title}
              </h3>

              <p style={{
                color: '#7A9485',
                fontSize: '0.88rem',
                lineHeight: 1.7,
                marginBottom: '1.5rem',
              }}>
                {item.desc}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: '#EDF2EF',
                }}>
                  {item.price}
                </div>
                <button style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: item.tag === 'Coming Soon'
                    ? 'transparent'
                    : 'rgba(0,197,102,0.1)',
                  border: item.tag === 'Coming Soon'
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(0,197,102,0.25)',
                  color: item.tag === 'Coming Soon' ? '#4A6055' : '#00C566',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  fontFamily: 'Syne, sans-serif',
                  cursor: item.tag === 'Coming Soon' ? 'default' : 'pointer',
                }}>
                  {item.tag === 'Coming Soon' ? 'Notify Me' : 'Get Started'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          padding: '2.5rem',
          background: 'linear-gradient(135deg, rgba(0,197,102,0.05) 0%, rgba(124,106,247,0.05) 100%)',
          border: '1px solid rgba(0,197,102,0.12)',
          borderRadius: '20px',
        }}>
          <p style={{
            color: '#7A9485',
            fontSize: '0.95rem',
            marginBottom: '0.5rem',
          }}>
            Don't see your business type?
          </p>
          <p style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#EDF2EF',
          }}>
            We build custom automations. <span style={{ color: '#00C566' }}>Tell us what you need →</span>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Marketplace
