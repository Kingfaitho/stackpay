import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'

function Hero() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    console.log('Email captured:', email);
    setSubmitted(true);
    setEmail('');
  };

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '120px 5% 80px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background glow effect */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0,197,102,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(0,197,102,0.1)',
        border: '1px solid rgba(0,197,102,0.25)',
        borderRadius: '100px',
        padding: '0.35rem 1rem',
        fontSize: '0.8rem',
        color: '#00C566',
        fontWeight: 600,
        marginBottom: '1.8rem',
        fontFamily: 'Syne, sans-serif',
      }}>
        <span style={{
          width: '6px', height: '6px',
          borderRadius: '50%',
          background: '#00C566',
          animation: 'pulse 2s infinite',
        }} />
        Built for Nigerian Business Owners
      </div>

      {/* Headline */}
      <h1 className="fade-up" style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: 'clamp(2.2rem, 5vw, 4rem)',
        lineHeight: 1.1,
        letterSpacing: '-1.5px',
        maxWidth: '820px',
        marginBottom: '1.5rem',
        color: '#F0F5F2',
      }}>
        Stop Losing Money to{' '}
        <span style={{
          color: '#00C566',
          position: 'relative',
        }}>
          Messy Records
        </span>
        {' '}and Unpaid Invoices
      </h1>

      {/* Subheadline */}
      <p style={{
        fontSize: 'clamp(1rem, 2vw, 1.2rem)',
        color: '#8A9E92',
        maxWidth: '560px',
        marginBottom: '2.5rem',
        fontWeight: 400,
        lineHeight: 1.7,
      }}>
        StackPay is the all-in-one business tool for Nigerian SMEs — send invoices,
        accept payments in Naira, track expenses, and know your profit. All in one place.
      </p>

      {/* Email Form */}
      <form
        id="waitlist"
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '480px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        {!submitted ? (
          <>
            <input
              type="email"
              placeholder="Enter your business email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                flex: 1,
                minWidth: '220px',
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
                fontSize: '0. 95rem',
                fontFamily: 'Syne, sans-serif',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#00A855'}
              onMouseLeave={e => e.currentTarget.style.background = '#00C566'}
            >
              <button
                type="button"
                onClick={() => navigate('/signup')}
                style={{ ... existing styles ...}}
              >
              
              Get Early Access <ArrowRight size={16} />
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
            <CheckCircle size={20} /> You're on the list! We'll reach out soon.
          </div>
        )}
      </form>

      {/* Trust signals */}
      <p style={{ color: '#8A9E92', fontSize: '0.82rem' }}>
        🔒 No spam. Free early access for the first 500 businesses.
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </section>
  );
}

export default Hero;