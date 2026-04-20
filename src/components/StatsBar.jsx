const stats = [
  { number: '39M+', label: 'Nigerian SMEs need this' },
  { number: '₦0', label: 'Cost to join waitlist' },
  { number: '1', label: 'Dashboard for everything' },
  { number: '500', label: 'Free early access spots' },
];

function StatsBar() {
  return (
    <section style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: '#0F1510',
      padding: '50px 5%',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '2rem',
        textAlign: 'center',
      }}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(2rem, 3vw, 2.8rem)',
              color: '#00C566',
              letterSpacing: '-1px',
              marginBottom: '0.3rem',
            }}>
              {s.number}
            </div>
            <div style={{
              color: '#8A9E92',
              fontSize: '0.88rem',
              fontWeight: 400,
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsBar;