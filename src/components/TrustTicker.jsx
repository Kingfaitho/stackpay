import { TrendingUp, Zap, MessageCircle, FileCheck, Droplets, Mail, ShieldCheck, Wallet } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Continuously scrolling strip of what Ledga actually does. Pure CSS motion
// (.ticker-track in global.css), pauses on hover, stops under reduced motion.
const ITEMS = [
  { icon: TrendingUp, text: 'Know your real profit' },
  { icon: Zap, text: 'Paystack payment links' },
  { icon: MessageCircle, text: 'WhatsApp payment reminders' },
  { icon: FileCheck, text: 'e-Invoice (UBL) export' },
  { icon: Droplets, text: '90-day cash flow forecast' },
  { icon: Mail, text: 'Receipts sent automatically' },
  { icon: ShieldCheck, text: 'Bank-grade security' },
  { icon: Wallet, text: 'Free to start' },
]

function TickerRow({ colors, hidden }) {
  return (
    <div aria-hidden={hidden || undefined} style={{ display: 'flex', flexShrink: 0 }}>
      {ITEMS.map((item, i) => {
        const Icon = item.icon
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.55rem',
            padding: '0 1.6rem', whiteSpace: 'nowrap',
          }}>
            <Icon size={14} color={colors.green} strokeWidth={2.5} />
            <span style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 600,
              fontSize: '0.8rem', color: colors.textSecondary,
              letterSpacing: '0.2px',
            }}>
              {item.text}
            </span>
            <span style={{
              width: '4px', height: '4px', borderRadius: '50%',
              background: colors.accent, opacity: 0.6, marginLeft: '1.6rem',
            }} />
          </div>
        )
      })}
    </div>
  )
}

export default function TrustTicker() {
  const { colors, isDark } = useTheme()

  return (
    <section style={{
      borderTop: `1px solid ${colors.border}`,
      borderBottom: `1px solid ${colors.border}`,
      background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
      padding: '0.9rem 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Edge fades so items melt in and out instead of clipping */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: '90px', zIndex: 1,
        background: `linear-gradient(90deg, ${colors.bgPrimary}, transparent)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: '90px', zIndex: 1,
        background: `linear-gradient(270deg, ${colors.bgPrimary}, transparent)`,
        pointerEvents: 'none',
      }} />

      <div className="ticker-track">
        <TickerRow colors={colors} />
        <TickerRow colors={colors} hidden />
      </div>
    </section>
  )
}
