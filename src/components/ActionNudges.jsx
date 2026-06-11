import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, BadgeCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../supabaseClient'

const TAX_EXEMPTION_THRESHOLD = 100_000_000 // 2026 reform: small companies under 100M turnover pay 0% CIT

// Action-first banners at the top of the dashboard: chase overdue money,
// and tell owners when their numbers qualify them for the small-company
// tax exemption. Pure reads; renders nothing when there is nothing to say.
export default function ActionNudges() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [overdue, setOverdue] = useState({ count: 0, total: 0 })
  const [yearRevenue, setYearRevenue] = useState(null)
  const [taxDismissed, setTaxDismissed] = useState(true)

  useEffect(() => {
    if (!user) return
    setTaxDismissed(
      localStorage.getItem(`ledga_tax_nudge_dismissed_${user.id}_${new Date().getFullYear()}`) === '1'
    )

    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data: unpaid } = await supabase
        .from('invoices')
        .select('total, due_date')
        .eq('user_id', user.id)
        .eq('status', 'unpaid')
        .lt('due_date', today)

      if (unpaid) {
        setOverdue({
          count: unpaid.length,
          total: unpaid.reduce((s, i) => s + Number(i.total || 0), 0),
        })
      }

      const yearStart = `${new Date().getFullYear()}-01-01`
      const { data: paid } = await supabase
        .from('invoices')
        .select('total')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('issue_date', yearStart)

      if (paid) {
        setYearRevenue(paid.reduce((s, i) => s + Number(i.total || 0), 0))
      }
    }
    load()
  }, [user])

  const dismissTax = () => {
    setTaxDismissed(true)
    if (user) {
      localStorage.setItem(
        `ledga_tax_nudge_dismissed_${user.id}_${new Date().getFullYear()}`, '1'
      )
    }
  }

  const formatNaira = (n) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(n || 0)

  const showTax = !taxDismissed && yearRevenue !== null && yearRevenue > 0
    && yearRevenue < TAX_EXEMPTION_THRESHOLD
  const showChase = overdue.count > 0

  if (!showChase && !showTax) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>

      {showChase && (
        <Link to="/collections" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.9rem 1.15rem',
          background: isDark ? 'rgba(255,80,80,0.07)' : 'rgba(204,34,0,0.05)',
          border: `1px solid ${colors.danger}35`,
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
        }}>
          <AlertTriangle size={17} color={colors.danger} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, color: colors.textPrimary, fontSize: '0.86rem' }}>
            <strong style={{ fontFamily: 'Syne, sans-serif' }}>
              {overdue.count} invoice{overdue.count !== 1 ? 's' : ''} overdue
            </strong>
            {' '}worth {formatNaira(overdue.total)}. Chase them now on WhatsApp.
          </span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            color: colors.danger, fontFamily: 'Syne, sans-serif',
            fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap',
          }}>
            Chase <ArrowRight size={14} strokeWidth={2.5} />
          </span>
        </Link>
      )}

      {showTax && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.9rem 1.15rem',
          background: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.05)',
          border: `1px solid ${colors.borderGreen}`,
          borderRadius: '12px',
        }}>
          <BadgeCheck size={17} color={colors.green} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, color: colors.textSecondary, fontSize: '0.84rem', lineHeight: 1.5 }}>
            Your recorded revenue this year is{' '}
            <strong style={{ color: colors.textPrimary }}>{formatNaira(yearRevenue)}</strong>.
            Businesses with turnover under {formatNaira(TAX_EXEMPTION_THRESHOLD)} are exempt from
            company income tax under the 2026 reform. Keep your records in Ledga and you have
            the proof.
          </span>
          <button
            onClick={dismissTax}
            aria-label="Dismiss tax notice"
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textMuted,
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              flexShrink: 0,
            }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}
