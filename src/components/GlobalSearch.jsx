import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../supabaseClient'

function GlobalSearch({ onClose }) {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const search = useCallback(async (q) => {
    if (!q.trim() || q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)

    const term = q.toLowerCase()

    const [
      { data: invoices },
      { data: clients },
      { data: expenses },
      { data: inventory },
      { data: notes },
    ] = await Promise.all([
      supabase
        .from('invoices')
        .select('id, invoice_number, total, status, created_at, clients(name)')
        .eq('user_id', user.id)
        .or(`invoice_number.ilike.%${q}%`)
        .limit(5),
      supabase
        .from('clients')
        .select('id, name, email, phone, company')
        .eq('user_id', user.id)
        .or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`)
        .limit(5),
      supabase
        .from('expenses')
        .select('id, title, amount, category, date')
        .eq('user_id', user.id)
        .or(`title.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(5),
      supabase
        .from('inventory')
        .select('id, name, quantity, selling_price, category')
        .eq('user_id', user.id)
        .or(`name.ilike.%${q}%,sku.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(5),
      supabase
        .from('business_notes')
        .select('id, title, content, type')
        .eq('user_id', user.id)
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .limit(3),
    ])

    const allResults = []

    // Feature shortcuts
    const features = [
      { label: 'Invoices', path: '/invoices', icon: '📄', category: 'Feature' },
      { label: 'Clients', path: '/clients', icon: '👥', category: 'Feature' },
      { label: 'Expenses', path: '/expenses', icon: '💸', category: 'Feature' },
      { label: 'Cash Receipts', path: '/cash-receipts', icon: '💵', category: 'Feature' },
      { label: 'Cash Flow & Runway', path: '/cashflow', icon: '💧', category: 'Feature' },
      { label: 'Budget Planner', path: '/budget', icon: '🎯', category: 'Feature' },
      { label: 'Reports', path: '/reports', icon: '📊', category: 'Feature' },
      { label: 'Inventory', path: '/inventory', icon: '📦', category: 'Feature' },
      { label: 'Collections', path: '/collections', icon: '🏃', category: 'Feature' },
      { label: 'Point of Sale', path: '/pos', icon: '🏪', category: 'Feature' },
      { label: 'Work Orders', path: '/work-orders', icon: '⚡', category: 'Feature' },
      { label: 'Notes & Tasks', path: '/notes', icon: '📝', category: 'Feature' },
      { label: 'Client Insights', path: '/client-insights', icon: '🔍', category: 'Feature' },
      { label: 'Recurring Invoices', path: '/recurring', icon: '🔄', category: 'Feature' },
      { label: 'Team', path: '/team', icon: '🤝', category: 'Feature' },
      { label: 'Settings', path: '/profile', icon: '⚙️', category: 'Feature' },
      { label: 'Help & Feedback', path: '/help', icon: '🆘', category: 'Feature' },
      { label: 'Billing & Plans', path: '/billing', icon: '💳', category: 'Feature' },
    ].filter(f => f.label.toLowerCase().includes(term))

    allResults.push(...features.slice(0, 3).map(f => ({ ...f, type: 'feature' })))

    // Invoices
    ;(invoices || []).forEach(inv => {
      allResults.push({
        type: 'invoice',
        icon: inv.status === 'paid' ? '✅' : '📄',
        label: inv.invoice_number,
        sublabel: `${inv.clients?.name || 'No client'} · ₦${Number(inv.total).toLocaleString()} · ${inv.status}`,
        path: '/invoices',
        category: 'Invoice',
      })
    })

    // Clients
    ;(clients || []).forEach(client => {
      allResults.push({
        type: 'client',
        icon: '👤',
        label: client.name,
        sublabel: client.company
          ? `${client.company} · ${client.email || client.phone || ''}`
          : client.email || client.phone || 'No contact info',
        path: '/clients',
        category: 'Client',
      })
    })

    // Expenses
    ;(expenses || []).forEach(exp => {
      allResults.push({
        type: 'expense',
        icon: '💸',
        label: exp.title,
        sublabel: `₦${Number(exp.amount).toLocaleString()} · ${exp.category} · ${exp.date}`,
        path: '/expenses',
        category: 'Expense',
      })
    })

    // Inventory
    ;(inventory || []).forEach(item => {
      allResults.push({
        type: 'inventory',
        icon: '📦',
        label: item.name,
        sublabel: `${item.quantity} in stock · ₦${Number(item.selling_price).toLocaleString()} · ${item.category}`,
        path: '/inventory',
        category: 'Inventory',
      })
    })

    // Notes
    ;(notes || []).forEach(note => {
      allResults.push({
        type: 'note',
        icon: note.type === 'task' ? '✅' : '📝',
        label: note.title,
        sublabel: note.content
          ? note.content.substring(0, 60) + (note.content.length > 60 ? '...' : '')
          : `${note.type === 'task' ? 'Task' : 'Note'}`,
        path: '/notes',
        category: note.type === 'task' ? 'Task' : 'Note',
      })
    })

    setResults(allResults)
    setSelectedIndex(0)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 250)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex].path)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const categoryColors = {
    Feature: colors.purple,
    Invoice: colors.green,
    Client: colors.accent,
    Expense: colors.danger,
    Inventory: colors.warning,
    Note: colors.textMuted,
    Task: colors.purple,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '10vh 1rem 2rem',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '580px',
        background: colors.bgCard,
        border: `1px solid ${colors.borderGreen}`,
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: isDark
          ? '0 40px 80px rgba(0,0,0,0.8)'
          : '0 40px 80px rgba(0,0,0,0.2)',
      }}>

        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search invoices, clients, expenses, features..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: colors.textPrimary,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '1rem',
            }}
          />
          {loading && (
            <span style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: `2px solid ${colors.borderGreen}`,
              borderTopColor: colors.green,
              animation: 'spi-spin 0.7s linear infinite',
              display: 'inline-block',
              flexShrink: 0,
            }} />
          )}
          <div style={{
            padding: '0.2rem 0.5rem',
            background: colors.bgCard2,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            fontSize: '0.65rem',
            color: colors.textMuted,
            fontFamily: 'DM Sans, sans-serif',
            flexShrink: 0,
          }}>
            ESC
          </div>
        </div>

        {/* Results */}
        {query.length < 2 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            <p style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
              Type to search across your entire Ledga account
            </p>
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '1rem',
            }}>
              {['invoices', 'clients', 'expenses', 'inventory', 'notes'].map(hint => (
                <span
                  key={hint}
                  onClick={() => setQuery(hint)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    background: colors.bgCard2,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    color: colors.textMuted,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = colors.green
                    e.currentTarget.style.borderColor = colors.borderGreen
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = colors.textMuted
                    e.currentTarget.style.borderColor = colors.border
                  }}
                >
                  {hint}
                </span>
              ))}
            </div>
          </div>
        ) : results.length === 0 && !loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🤷</div>
            <p style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
              No results for "{query}"
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {results.map((result, i) => (
              <div
                key={i}
                onClick={() => {
                  navigate(result.path)
                  onClose()
                }}
                style={{
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  cursor: 'pointer',
                  background: i === selectedIndex
                    ? isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)'
                    : 'transparent',
                  borderBottom: `1px solid ${colors.border}`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                  {result.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    color: colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {result.label}
                  </div>
                  {result.sublabel && (
                    <div style={{
                      color: colors.textMuted,
                      fontSize: '0.72rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {result.sublabel}
                    </div>
                  )}
                </div>
                <span style={{
                  background: `${categoryColors[result.category] || colors.textMuted}15`,
                  border: `1px solid ${categoryColors[result.category] || colors.textMuted}30`,
                  color: categoryColors[result.category] || colors.textMuted,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '100px',
                  fontFamily: 'Syne, sans-serif',
                  flexShrink: 0,
                }}>
                  {result.category}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '0.65rem 1.25rem',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          gap: '1rem',
          fontSize: '0.68rem',
          color: colors.textMuted,
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>ESC close</span>
        </div>
      </div>

      <style>{`
        @keyframes spi-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default GlobalSearch
