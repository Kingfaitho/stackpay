import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../supabaseClient'
import {
  Search, FileText, Users, Receipt, Wallet, TrendingUp,
  Target, BarChart2, Package, Bell, ShoppingCart, Zap,
  StickyNote, RefreshCw, UsersRound, CreditCard, HelpCircle,
  Settings, CheckSquare, X
} from 'lucide-react'

const FEATURE_MAP = {
  '/invoices':        { Icon: FileText,    color: '#00C566' },
  '/clients':         { Icon: Users,       color: '#7C6AF7' },
  '/expenses':        { Icon: Receipt,     color: '#ff8080' },
  '/cash-receipts':   { Icon: Wallet,      color: '#00C566' },
  '/cashflow':        { Icon: TrendingUp,  color: '#f5a623' },
  '/budget':          { Icon: Target,      color: '#f5a623' },
  '/reports':         { Icon: BarChart2,   color: '#7C6AF7' },
  '/inventory':       { Icon: Package,     color: '#00C566' },
  '/collections':     { Icon: Bell,        color: '#f5a623' },
  '/pos':             { Icon: ShoppingCart,color: '#7C6AF7' },
  '/work-orders':     { Icon: Zap,         color: '#f5a623' },
  '/notes':           { Icon: StickyNote,  color: '#00C566' },
  '/recurring':       { Icon: RefreshCw,   color: '#7C6AF7' },
  '/team':            { Icon: UsersRound,  color: '#00C566' },
  '/billing':         { Icon: CreditCard,  color: '#7C6AF7' },
  '/help':            { Icon: HelpCircle,  color: '#f5a623' },
  '/profile':         { Icon: Settings,    color: '#7C6AF7' },
}

const FEATURES = [
  { label: 'Invoices',            path: '/invoices' },
  { label: 'Clients',             path: '/clients' },
  { label: 'Expenses',            path: '/expenses' },
  { label: 'Cash Receipts',       path: '/cash-receipts' },
  { label: 'Cash Flow & Runway',  path: '/cashflow' },
  { label: 'Budget Planner',      path: '/budget' },
  { label: 'Reports',             path: '/reports' },
  { label: 'Inventory',           path: '/inventory' },
  { label: 'Collections',         path: '/collections' },
  { label: 'Point of Sale',       path: '/pos' },
  { label: 'Work Orders',         path: '/work-orders' },
  { label: 'Notes & Tasks',       path: '/notes' },
  { label: 'Recurring Invoices',  path: '/recurring' },
  { label: 'Team',                path: '/team' },
  { label: 'Billing & Plans',     path: '/billing' },
  { label: 'Help & Feedback',     path: '/help' },
  { label: 'Settings',            path: '/profile' },
]

const categoryColors = {
  Feature:   '#7C6AF7',
  Invoice:   '#00C566',
  Client:    '#f5a623',
  Expense:   '#ff8080',
  Inventory: '#f5a623',
  Note:      '#7C6AF7',
  Task:      '#7C6AF7',
}

function ResultIcon({ result }) {
  const fm = FEATURE_MAP[result.path]
  if (fm) {
    const { Icon, color } = fm
    return (
      <div style={{
        width: '32px', height: '32px',
        borderRadius: '9px',
        background: `${color}18`,
        border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={15} color={color} strokeWidth={1.8} />
      </div>
    )
  }
  return (
    <div style={{
      width: '32px', height: '32px',
      borderRadius: '9px',
      background: 'rgba(128,128,128,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.85rem',
      flexShrink: 0,
    }}>
      {result.icon}
    </div>
  )
}

function GlobalSearch() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef(null)
  const wrapperRef = useRef(null)
  const debounceRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ⌘K to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
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
      supabase.from('invoices').select('id, invoice_number, total, status, created_at, clients(name)')
        .eq('user_id', user.id).or(`invoice_number.ilike.%${q}%`).limit(5),
      supabase.from('clients').select('id, name, email, phone, company')
        .eq('user_id', user.id).or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`).limit(5),
      supabase.from('expenses').select('id, title, amount, category, date')
        .eq('user_id', user.id).or(`title.ilike.%${q}%,category.ilike.%${q}%`).limit(5),
      supabase.from('inventory').select('id, name, quantity, selling_price, category')
        .eq('user_id', user.id).or(`name.ilike.%${q}%,sku.ilike.%${q}%,category.ilike.%${q}%`).limit(5),
      supabase.from('business_notes').select('id, title, content, type')
        .eq('user_id', user.id).or(`title.ilike.%${q}%,content.ilike.%${q}%`).limit(3),
    ])

    const allResults = []

    FEATURES.filter(f => f.label.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach(f => allResults.push({ ...f, type: 'feature', category: 'Feature' }))

    ;(invoices || []).forEach(inv => allResults.push({
      type: 'invoice', category: 'Invoice',
      label: inv.invoice_number,
      sublabel: `${inv.clients?.name || 'No client'} · ₦${Number(inv.total).toLocaleString()} · ${inv.status}`,
      path: '/invoices',
    }))
    ;(clients || []).forEach(c => allResults.push({
      type: 'client', category: 'Client',
      label: c.name,
      sublabel: c.company ? `${c.company} · ${c.email || c.phone || ''}` : c.email || c.phone || 'No contact info',
      path: '/clients',
    }))
    ;(expenses || []).forEach(exp => allResults.push({
      type: 'expense', category: 'Expense',
      label: exp.title,
      sublabel: `₦${Number(exp.amount).toLocaleString()} · ${exp.category} · ${exp.date}`,
      path: '/expenses',
    }))
    ;(inventory || []).forEach(item => allResults.push({
      type: 'inventory', category: 'Inventory',
      label: item.name,
      sublabel: `${item.quantity} in stock · ₦${Number(item.selling_price).toLocaleString()}`,
      path: '/inventory',
    }))
    ;(notes || []).forEach(note => allResults.push({
      type: 'note', category: note.type === 'task' ? 'Task' : 'Note',
      icon: note.type === 'task' ? '✅' : '📝',
      label: note.title,
      sublabel: note.content ? note.content.substring(0, 60) + (note.content.length > 60 ? '…' : '') : '',
      path: '/notes',
    }))

    setResults(allResults)
    setSelectedIndex(0)
    setLoading(false)
  }, [user])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 220)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex].path)
      setOpen(false)
      setQuery('')
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const showDropdown = open && (query.length >= 1 || results.length > 0)

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>

      {/* Search input bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0 1rem',
        height: '40px',
        background: isDark
          ? open ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.05)'
          : open ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.05)',
        border: `1.5px solid ${open ? colors.borderGreen : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: '12px',
        transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
        boxShadow: open
          ? `0 0 0 3px ${isDark ? 'rgba(0,197,102,0.12)' : 'rgba(0,150,70,0.1)'}`
          : 'none',
        backdropFilter: 'blur(12px)',
        cursor: 'text',
      }}
        onClick={() => { inputRef.current?.focus(); setOpen(true) }}
      >
        {loading
          ? <div style={{
              width: '15px', height: '15px',
              border: `2px solid ${colors.borderGreen}`,
              borderTopColor: colors.green,
              borderRadius: '50%',
              animation: 'sp-spin 0.7s linear infinite',
              flexShrink: 0,
            }} />
          : <Search size={15} color={open ? colors.green : colors.textMuted} strokeWidth={2} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
        }

        <input
          ref={inputRef}
          type="text"
          placeholder="Search anything..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: colors.textPrimary,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.875rem',
            minWidth: 0,
          }}
        />

        {query ? (
          <button
            onClick={e => { e.stopPropagation(); setQuery(''); setResults([]); inputRef.current?.focus() }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              color: colors.textMuted,
              flexShrink: 0,
            }}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        ) : (
          <kbd style={{
            padding: '2px 6px',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            border: `1px solid ${colors.border}`,
            borderRadius: '5px',
            fontSize: '0.6rem',
            color: colors.textMuted,
            fontFamily: 'DM Sans, sans-serif',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          zIndex: 600,
          background: isDark ? '#141A16' : '#fff',
          border: `1.5px solid ${isDark ? 'rgba(0,197,102,0.2)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.4)'
            : '0 24px 64px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06)',
          animation: 'dropIn 0.18s ease forwards',
          maxHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* Empty / hint state */}
          {query.length < 2 && (
            <div style={{ padding: '1.25rem', textAlign: 'center' }}>
              <Search size={24} color={colors.textMuted} strokeWidth={1.5} style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ color: colors.textMuted, fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                Type to search invoices, clients, expenses...
              </p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['invoices', 'clients', 'expenses', 'notes'].map(hint => (
                  <span
                    key={hint}
                    onClick={() => { setQuery(hint); inputRef.current?.focus() }}
                    style={{
                      padding: '0.25rem 0.6rem',
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '100px',
                      fontSize: '0.72rem',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'DM Sans, sans-serif',
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
          )}

          {/* No results */}
          {query.length >= 2 && results.length === 0 && !loading && (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
                No results for "{query}"
              </p>
            </div>
          )}

          {/* Results list */}
          {results.length > 0 && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {results.map((result, i) => (
                <div
                  key={i}
                  onClick={() => {
                    navigate(result.path)
                    setOpen(false)
                    setQuery('')
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.7rem 1rem',
                    cursor: 'pointer',
                    background: i === selectedIndex
                      ? isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,150,70,0.06)'
                      : 'transparent',
                    borderBottom: i < results.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none',
                    transition: 'background 0.12s',
                  }}
                >
                  <ResultIcon result={result} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.85rem',
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
                        fontSize: '0.7rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '1px',
                      }}>
                        {result.sublabel}
                      </div>
                    )}
                  </div>

                  <span style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '100px',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    fontFamily: 'Syne, sans-serif',
                    background: `${categoryColors[result.category] || colors.textMuted}15`,
                    border: `1px solid ${categoryColors[result.category] || colors.textMuted}28`,
                    color: categoryColors[result.category] || colors.textMuted,
                    flexShrink: 0,
                  }}>
                    {result.category}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer hint */}
          {results.length > 0 && (
            <div style={{
              padding: '0.5rem 1rem',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
              display: 'flex',
              gap: '1rem',
              fontSize: '0.62rem',
              color: colors.textMuted,
              background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>ESC close</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes sp-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  )
}

export default GlobalSearch
