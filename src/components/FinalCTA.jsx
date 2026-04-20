import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

function FinalCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!email) return;

  const { error } = await supabase
    .from('waitlist')
    .insert([{ email }]);

  if (error) {
    if (error.code === '23505') {
      setSubmitted(true);
    } else {
      alert('Something went wrong. Please try again.');
      console.error(error);
    }
  } else {
    setSubmitted(true);
    setEmail('');
  }
};

  return (
    <section style={{
      padding: '100px 5%',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0,197,102,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
          letterSpacing: '-1px',
          color: '#F0F5F2',
          lineHeight: 1.2,
          marginBottom: '1.2rem',
        }}>
          Your business deserves better than WhatsApp notes and scattered receipts
        </h2>
        <p style={{
          color: '#8A9E92',
          fontSize: '1rem',
          marginBottom: '2.5rem',
          lineHeight: 1.7,
        }}>
          Join 500 Nigerian business owners getting early access to StackPay.
          Free to start. No credit card required.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {!submitted ? (
            <>
              <input
                type="email"
                placeholder="Your business email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  minWidth: '220px',
                  maxWidth: '320px',
                  padding: '0.85rem 1.2rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#141A16',
                  color: '#F0F5F2',
                  fontSize: '0.95rem',
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#00C566',
                  color: '#080C0A',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  fontFamily: 'Syne, sans-serif',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#00A855'}
                onMouseLeave={e => e.currentTarget.style.background = '#00C566'}
              >
                Claim My Spot <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#00C566',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0.85rem 1.5rem',
              background: 'rgba(0,197,102,0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(0,197,102,0.25)',
            }}>
              <CheckCircle size={20} /> You're in! Talk soon 🎉
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

export default FinalCTA;