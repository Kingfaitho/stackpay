import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

const CATEGORIES = [
  'Raw Materials', 'Finished Products', 'Packaging',
  'Equipment', 'Electronics', 'Clothing & Fabric',
  'Food & Beverages', 'Office Supplies', 'Spare Parts', 'Other'
]

const UNITS = [
  'piece', 'pair', 'set', 'kg', 'g', 'litre', 'ml',
  'metre', 'yard', 'box', 'carton', 'bag', 'roll', 'dozen'
]

// ── Stat card outside to avoid hooks-in-map ──────────────────────────────────
function StatCard({ icon, label, value, sub, color, colors, isDark }) {
  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: '14px',
      padding: '1.1rem',
      boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{icon}</div>
      <div style={{
        color: colors.textLabel,
        fontSize: '0.68rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: '0.3rem',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: '1.1rem',
        color: color || colors.textPrimary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: colors.textMuted, fontSize: '0.72rem', marginTop: '0.2rem' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Inventory() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stock')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showMovementModal, setShowMovementModal] = useState(null)
  const [movementForm, setMovementForm] = useState({
    movement_type: 'stock_in',
    quantity: '',
    notes: '',
  })

  const [form, setForm] = useState({
    name: '',
    category: 'General',
    sku: '',
    quantity: '',
    unit: 'piece',
    cost_price: '',
    selling_price: '',
    low_stock_threshold: '5',
    supplier_name: '',
    supplier_phone: '',
    notes: '',
  })

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: inv }, { data: mov }] = await Promise.all([
      supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('name'),
      supabase
        .from('inventory_movements')
        .select('*, inventory(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setItems(inv || [])
    setMovements(mov || [])
    setLoading(false)
  }, [user])

  const resetForm = () => {
    setForm({
      name: '',
      category: 'General',
      sku: '',
      quantity: '',
      unit: 'piece',
      cost_price: '',
      selling_price: '',
      low_stock_threshold: '5',
      supplier_name: '',
      supplier_phone: '',
      notes: '',
    })
    setSaveError('')
    setEditingItem(null)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({
      name: item.name || '',
      category: item.category || 'General',
      sku: item.sku || '',
      quantity: item.quantity || '',
      unit: item.unit || 'piece',
      cost_price: item.cost_price || '',
      selling_price: item.selling_price || '',
      low_stock_threshold: item.low_stock_threshold || '5',
      supplier_name: item.supplier_name || '',
      supplier_phone: item.supplier_phone || '',
      notes: item.notes || '',
    })
    setShowForm(true)
    setSaveError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (saving) return
    if (!form.name.trim()) {
      setSaveError('Item name is required')
      return
    }
    setSaving(true)
    setSaveError('')

    const payload = {
      name: form.name.trim(),
      category: form.category,
      sku: form.sku.trim() || null,
      quantity: Number(form.quantity) || 0,
      unit: form.unit,
      cost_price: Number(form.cost_price) || 0,
      selling_price: Number(form.selling_price) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
      supplier_name: form.supplier_name.trim() || null,
      supplier_phone: form.supplier_phone.trim() || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    let error
    if (editingItem) {
      const res = await supabase
        .from('inventory')
        .update(payload)
        .eq('id', editingItem.id)
        .eq('user_id', user.id)
      error = res.error
    } else {
      const res = await supabase
        .from('inventory')
        .insert({ ...payload, user_id: user.id })
      error = res.error

      // Log initial stock movement
      if (!error && Number(form.quantity) > 0) {
        await supabase.from('inventory_movements').insert({
          user_id: user.id,
          inventory_id: res.data?.[0]?.id,
          movement_type: 'stock_in',
          quantity: Number(form.quantity),
          notes: 'Initial stock',
        })
      }
    }

    if (error) {
      setSaveError(`Failed to save: ${error.message}`)
      setSaving(false)
      return
    }

    setShowForm(false)
    resetForm()
    await loadData()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item? All movement history will also be deleted.')) return
    await supabase.from('inventory').delete().eq('id', id)
    loadData()
  }

  const handleMovement = async () => {
    if (!movementForm.quantity || Number(movementForm.quantity) <= 0) return
    if (!showMovementModal) return

    const item = showMovementModal
    const qty = Number(movementForm.quantity)
    const isOut = ['stock_out', 'sale', 'damaged'].includes(movementForm.movement_type)
    const newQty = isOut
      ? Math.max(item.quantity - qty, 0)
      : item.quantity + qty

    await Promise.all([
      supabase
        .from('inventory')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', item.id),
      supabase.from('inventory_movements').insert({
        user_id: user.id,
        inventory_id: item.id,
        movement_type: movementForm.movement_type,
        quantity: qty,
        notes: movementForm.notes || null,
      }),
    ])

    setShowMovementModal(null)
    setMovementForm({ movement_type: 'stock_in', quantity: '', notes: '' })
    await loadData()
  }

  const formatNaira = (n) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(n || 0)

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.supplier_name || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter
    return matchSearch && matchCat
  })

  const lowStockItems = items.filter(i => i.quantity <= i.low_stock_threshold && i.quantity >= 0)
  const outOfStock = items.filter(i => i.quantity === 0)
  const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.cost_price), 0)
  const totalSellingValue = items.reduce((sum, i) => sum + (i.quantity * i.selling_price), 0)
  const potentialProfit = totalSellingValue - totalValue

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { label: 'OUT OF STOCK', color: colors.danger }
    if (item.quantity <= item.low_stock_threshold) return { label: 'LOW STOCK', color: colors.warning }
    return { label: 'IN STOCK', color: colors.green }
  }

  const getMargin = (item) => {
    if (!item.selling_price || !item.cost_price) return null
    return (((item.selling_price - item.cost_price) / item.selling_price) * 100).toFixed(0)
  }

  const movementColors = {
    stock_in: { color: colors.green, icon: '📦', label: 'Stock In' },
    stock_out: { color: colors.warning, icon: '📤', label: 'Stock Out' },
    sale: { color: colors.green, icon: '💰', label: 'Sale' },
    adjustment: { color: colors.purple, icon: '🔧', label: 'Adjustment' },
    damaged: { color: colors.danger, icon: '⚠️', label: 'Damaged' },
  }

  const card = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: '1.25rem',
  }

  const inp = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    background: colors.bgInput,
    color: colors.textPrimary,
    fontSize: '0.9rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '0.75rem',
    boxSizing: 'border-box',
  }

  const lbl = {
    color: colors.textLabel,
    fontSize: '0.72rem',
    fontWeight: 600,
    display: 'block',
    marginBottom: '0.3rem',
    letterSpacing: '0.3px',
  }

  return (
    <AppLayout>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
            color: colors.textPrimary,
            marginBottom: '0.25rem',
          }}>
            📦 Inventory
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
            Track your stock, costs, selling prices, and know when to reorder
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          style={{
            padding: '0.75rem 1.3rem',
            background: colors.accent,
            color: colors.accentText,
            borderRadius: '10px',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Add Item
        </button>
      </div>

      {/* Low stock alert banner */}
      {lowStockItems.length > 0 && (
        <div style={{
          background: isDark ? 'rgba(245,166,35,0.06)' : 'rgba(184,122,0,0.05)',
          border: `1px solid ${colors.warning}40`,
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: colors.warning,
              marginBottom: '0.15rem',
            }}>
              {outOfStock.length > 0
                ? `${outOfStock.length} item${outOfStock.length > 1 ? 's' : ''} out of stock`
                : ''}
              {outOfStock.length > 0 && lowStockItems.length > outOfStock.length ? ' · ' : ''}
              {lowStockItems.length - outOfStock.length > 0
                ? `${lowStockItems.length - outOfStock.length} item${lowStockItems.length - outOfStock.length > 1 ? 's' : ''} running low`
                : ''}
            </div>
            <div style={{ color: colors.textSecondary, fontSize: '0.8rem' }}>
              {lowStockItems.slice(0, 3).map(i => i.name).join(', ')}
              {lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : ''}
            </div>
          </div>
          <button
            onClick={() => setCategoryFilter('all')}
            style={{
              padding: '0.4rem 0.85rem',
              background: `${colors.warning}15`,
              border: `1px solid ${colors.warning}40`,
              color: colors.warning,
              borderRadius: '7px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            View All
          </button>
        </div>
      )}

      {/* Summary stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.5rem',
      }}>
        <StatCard
          icon="📊" label="Total Items" value={items.length}
          colors={colors} isDark={isDark}
        />
        <StatCard
          icon="💰" label="Stock Value (Cost)"
          value={formatNaira(totalValue)}
          sub="What you paid"
          color={colors.textPrimary}
          colors={colors} isDark={isDark}
        />
        <StatCard
          icon="🏷️" label="Stock Value (Selling)"
          value={formatNaira(totalSellingValue)}
          sub="What you can earn"
          color={colors.green}
          colors={colors} isDark={isDark}
        />
        <StatCard
          icon="📈" label="Potential Profit"
          value={formatNaira(potentialProfit)}
          sub="If all stock sells"
          color={potentialProfit > 0 ? colors.green : colors.danger}
          colors={colors} isDark={isDark}
        />
        <StatCard
          icon="🚨" label="Low / Out of Stock"
          value={lowStockItems.length}
          sub={`${outOfStock.length} out of stock`}
          color={lowStockItems.length > 0 ? colors.warning : colors.green}
          colors={colors} isDark={isDark}
        />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: '1.25rem',
        background: colors.bgCard2,
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        padding: '4px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {[
          { id: 'stock', label: '📦 Stock List' },
          { id: 'movements', label: '🔄 Movements' },
          { id: 'insights', label: '💡 Insights' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? colors.bgCard : 'transparent',
              color: activeTab === tab.id ? colors.textPrimary : colors.textMuted,
              fontFamily: 'Syne, sans-serif',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              boxShadow: activeTab === tab.id && !isDark ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{
          ...card,
          border: `1px solid ${editingItem ? `${colors.purple}50` : colors.borderGreen}`,
          padding: '1.5rem',
        }}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            color: colors.textPrimary,
            fontSize: '1rem',
            marginBottom: '1.5rem',
          }}>
            {editingItem ? `✏️ Edit — ${editingItem.name}` : '+ New Inventory Item'}
          </h3>

          {saveError && (
            <div style={{
              background: isDark ? 'rgba(255,80,80,0.08)' : 'rgba(204,34,0,0.06)',
              border: `1px solid ${colors.danger}40`,
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: colors.danger,
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}>
              ⚠️ {saveError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Row 1 - Name + Category */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}>
              <div>
                <label style={lbl} htmlFor="inv-name">ITEM NAME *</label>
                <input
                  id="inv-name"
                  name="inv-name"
                  placeholder="e.g. Ankara Fabric, iPhone 15 Case"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl} htmlFor="inv-category">CATEGORY</label>
                <select
                  id="inv-category"
                  name="inv-category"
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl} htmlFor="inv-sku">SKU / CODE (Optional)</label>
                <input
                  id="inv-sku"
                  name="inv-sku"
                  placeholder="e.g. FAB-001"
                  value={form.sku}
                  onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                  style={inp}
                />
              </div>
            </div>

            {/* Row 2 - Quantity + Unit + Threshold */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.75rem',
            }}>
              <div>
                <label style={lbl} htmlFor="inv-qty">
                  {editingItem ? 'CURRENT QUANTITY' : 'OPENING STOCK'}
                </label>
                <input
                  id="inv-qty"
                  name="inv-qty"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.quantity}
                  onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl} htmlFor="inv-unit">UNIT</label>
                <select
                  id="inv-unit"
                  name="inv-unit"
                  value={form.unit}
                  onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  {UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl} htmlFor="inv-threshold">LOW STOCK ALERT AT</label>
                <input
                  id="inv-threshold"
                  name="inv-threshold"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={form.low_stock_threshold}
                  onChange={e => setForm(p => ({ ...p, low_stock_threshold: e.target.value }))}
                  style={inp}
                />
              </div>
            </div>

            {/* Row 3 - Pricing */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}>
              <div>
                <label style={lbl} htmlFor="inv-cost">COST PRICE (NGN)</label>
                <input
                  id="inv-cost"
                  name="inv-cost"
                  type="number"
                  min="0"
                  placeholder="What you paid"
                  value={form.cost_price}
                  onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl} htmlFor="inv-sell">SELLING PRICE (NGN)</label>
                <input
                  id="inv-sell"
                  name="inv-sell"
                  type="number"
                  min="0"
                  placeholder="What you charge"
                  value={form.selling_price}
                  onChange={e => setForm(p => ({ ...p, selling_price: e.target.value }))}
                  style={inp}
                />
              </div>
            </div>

            {/* Margin preview */}
            {form.cost_price && form.selling_price && (
              <div style={{
                padding: '0.75rem 1rem',
                background: Number(form.selling_price) > Number(form.cost_price)
                  ? isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.04)'
                  : isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)',
                border: `1px solid ${Number(form.selling_price) > Number(form.cost_price)
                  ? colors.borderGreen
                  : colors.danger + '40'}`,
                borderRadius: '8px',
                marginBottom: '0.75rem',
                display: 'flex',
                gap: '1.5rem',
                flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ color: colors.textMuted, fontSize: '0.7rem', fontWeight: 600 }}>
                    PROFIT PER UNIT
                  </div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: Number(form.selling_price) > Number(form.cost_price)
                      ? colors.green : colors.danger,
                  }}>
                    {formatNaira(Number(form.selling_price) - Number(form.cost_price))}
                  </div>
                </div>
                <div>
                  <div style={{ color: colors.textMuted, fontSize: '0.7rem', fontWeight: 600 }}>
                    MARGIN
                  </div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: Number(form.selling_price) > Number(form.cost_price)
                      ? colors.green : colors.danger,
                  }}>
                    {Number(form.selling_price) > 0
                      ? (((Number(form.selling_price) - Number(form.cost_price)) / Number(form.selling_price)) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
                {form.quantity && (
                  <div>
                    <div style={{ color: colors.textMuted, fontSize: '0.7rem', fontWeight: 600 }}>
                      TOTAL STOCK VALUE
                    </div>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: colors.textPrimary,
                    }}>
                      {formatNaira(Number(form.quantity) * Number(form.selling_price))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Row 4 - Supplier */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}>
              <div>
                <label style={lbl} htmlFor="inv-supplier">SUPPLIER NAME</label>
                <input
                  id="inv-supplier"
                  name="inv-supplier"
                  placeholder="e.g. Alhaji Musa Fabrics"
                  value={form.supplier_name}
                  onChange={e => setForm(p => ({ ...p, supplier_name: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl} htmlFor="inv-sphone">SUPPLIER PHONE</label>
                <input
                  id="inv-sphone"
                  name="inv-sphone"
                  type="tel"
                  placeholder="08012345678"
                  value={form.supplier_phone}
                  onChange={e => setForm(p => ({ ...p, supplier_phone: e.target.value }))}
                  style={inp}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={lbl} htmlFor="inv-notes">NOTES</label>
              <textarea
                id="inv-notes"
                name="inv-notes"
                placeholder="Any additional notes about this item..."
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                maxLength={300}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6, marginBottom: '1.5rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.75rem 1.8rem',
                  background: saving ? colors.greenDark : colors.accent,
                  color: colors.accentText,
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  minWidth: '130px',
                }}
              >
                {saving ? 'Saving...' : editingItem ? '✓ Save Changes' : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm() }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: colors.textMuted,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STOCK LIST TAB */}
      {activeTab === 'stock' && (
        <>
          {/* Search + filter */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
          }}>
            <input
              placeholder="Search items, SKU, supplier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: colors.bgCard,
                color: colors.textPrimary,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: colors.bgCard,
                color: colors.textPrimary,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.88rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={{ ...card, padding: '3rem', textAlign: 'center', color: colors.textMuted }}>
              Loading inventory...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ ...card, padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
              <p style={{ color: colors.textPrimary, fontWeight: 500, marginBottom: '0.4rem' }}>
                {search || categoryFilter !== 'all' ? 'No items match your search' : 'No inventory items yet'}
              </p>
              <p style={{ color: colors.textMuted, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {search || categoryFilter !== 'all'
                  ? 'Try a different search or category'
                  : 'Add your first item to start tracking stock, costs, and profits'}
              </p>
              {!search && categoryFilter === 'all' && (
                <button
                  onClick={() => { resetForm(); setShowForm(true) }}
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: colors.accent,
                    color: colors.accentText,
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Add First Item
                </button>
              )}
            </div>
          ) : (
            <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
              {filtered.map((item, i) => {
                const status = getStockStatus(item)
                const margin = getMargin(item)
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '1rem 1.5rem',
                      borderBottom: i < filtered.length - 1
                        ? `1px solid ${colors.border}`
                        : 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isDark
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(0,0,0,0.02)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}>
                      {/* Left — Item info */}
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginBottom: '0.3rem',
                        }}>
                          <span style={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            color: colors.textPrimary,
                          }}>
                            {item.name}
                          </span>
                          <span style={{
                            background: `${status.color}15`,
                            border: `1px solid ${status.color}30`,
                            color: status.color,
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '100px',
                            fontFamily: 'Syne, sans-serif',
                          }}>
                            {status.label}
                          </span>
                          {item.sku && (
                            <span style={{
                              color: colors.textMuted,
                              fontSize: '0.72rem',
                              fontFamily: 'DM Sans, sans-serif',
                            }}>
                              #{item.sku}
                            </span>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}>
                          <span style={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            color: status.label === 'OUT OF STOCK' ? colors.danger : colors.textPrimary,
                          }}>
                            {item.quantity} {item.unit}
                          </span>
                          <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>
                            Cost: {formatNaira(item.cost_price)}
                          </span>
                          <span style={{ color: colors.green, fontSize: '0.8rem', fontWeight: 600 }}>
                            Sell: {formatNaira(item.selling_price)}
                          </span>
                          {margin && (
                            <span style={{
                              color: Number(margin) > 0 ? colors.green : colors.danger,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              fontFamily: 'Syne, sans-serif',
                            }}>
                              {margin}% margin
                            </span>
                          )}
                          {item.category !== 'General' && (
                            <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                              {item.category}
                            </span>
                          )}
                        </div>

                        {item.supplier_name && (
                          <div style={{
                            color: colors.textMuted,
                            fontSize: '0.72rem',
                            marginTop: '0.2rem',
                          }}>
                            Supplier: {item.supplier_name}
                            {item.supplier_phone && ` · ${item.supplier_phone}`}
                          </div>
                        )}
                      </div>

                      {/* Right — Actions */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        flexShrink: 0,
                        flexWrap: 'wrap',
                      }}>
                        <button
                          onClick={() => {
                            setShowMovementModal(item)
                            setMovementForm({
                              movement_type: 'stock_in',
                              quantity: '',
                              notes: '',
                            })
                          }}
                          style={{
                            padding: '0.4rem 0.85rem',
                            background: isDark
                              ? 'rgba(0,197,102,0.06)'
                              : 'rgba(0,120,60,0.06)',
                            border: `1px solid ${colors.borderGreen}`,
                            color: colors.green,
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            borderRadius: '6px',
                            fontFamily: 'Syne, sans-serif',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ± Update Stock
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: isDark
                              ? 'rgba(124,106,247,0.06)'
                              : 'rgba(91,78,199,0.06)',
                            border: `1px solid ${isDark
                              ? 'rgba(124,106,247,0.2)'
                              : 'rgba(91,78,199,0.2)'}`,
                            color: colors.purple,
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            borderRadius: '6px',
                            fontFamily: 'Syne, sans-serif',
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            padding: '0.4rem 0.6rem',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: colors.textMuted,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            fontFamily: 'DM Sans, sans-serif',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = colors.danger
                            e.currentTarget.style.borderColor = `${colors.danger}40`
                            e.currentTarget.style.background = `${colors.danger}08`
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = colors.textMuted
                            e.currentTarget.style.borderColor = 'transparent'
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* MOVEMENTS TAB */}
      {activeTab === 'movements' && (
        <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
          {movements.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
              <p>No movements yet. Add items and update stock to see history here.</p>
            </div>
          ) : (
            movements.map((mov, i) => {
              const mc = movementColors[mov.movement_type] || movementColors.adjustment
              const isOut = ['stock_out', 'sale', 'damaged'].includes(mov.movement_type)
              return (
                <div
                  key={mov.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.85rem 1.5rem',
                    borderBottom: i < movements.length - 1
                      ? `1px solid ${colors.border}`
                      : 'none',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '9px',
                    background: `${mc.color}15`,
                    border: `1px solid ${mc.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}>
                    {mc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{
                      color: colors.textPrimary,
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      marginBottom: '0.15rem',
                    }}>
                      {mov.inventory?.name || 'Item'}
                    </div>
                    <div style={{
                      color: colors.textMuted,
                      fontSize: '0.75rem',
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}>
                      <span>{mc.label}</span>
                      {mov.notes && <><span>·</span><span>{mov.notes}</span></>}
                      <span>·</span>
                      <span>
                        {new Date(mov.created_at).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: isOut ? colors.danger : colors.green,
                    flexShrink: 0,
                  }}>
                    {isOut ? '−' : '+'}{mov.quantity}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* INSIGHTS TAB */}
      {activeTab === 'insights' && (
        <div>
          {/* Most profitable items */}
          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: colors.textPrimary,
              marginBottom: '1.25rem',
            }}>
              💎 Most Profitable Items
            </h3>
            {items.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: '0.88rem' }}>
                Add items with cost and selling prices to see profitability insights.
              </p>
            ) : (
              [...items]
                .filter(i => i.selling_price > 0 && i.cost_price > 0)
                .sort((a, b) => {
                  const marginA = (a.selling_price - a.cost_price) / a.selling_price
                  const marginB = (b.selling_price - b.cost_price) / b.selling_price
                  return marginB - marginA
                })
                .slice(0, 5)
                .map((item, i) => {
                  const margin = ((item.selling_price - item.cost_price) / item.selling_price * 100).toFixed(0)
                  const profitPerUnit = item.selling_price - item.cost_price
                  const pct = Math.min(Number(margin), 100)
                  return (
                    <div key={item.id} style={{ marginBottom: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.3rem',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            color: colors.textPrimary,
                          }}>
                            #{i + 1} {item.name}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}>
                          <span style={{
                            color: colors.textMuted,
                            fontSize: '0.75rem',
                          }}>
                            {formatNaira(profitPerUnit)}/unit
                          </span>
                          <span style={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            color: Number(margin) > 0 ? colors.green : colors.danger,
                          }}>
                            {margin}%
                          </span>
                        </div>
                      </div>
                      <div style={{
                        height: '6px',
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: Number(margin) > 30
                            ? colors.green
                            : Number(margin) > 10
                            ? colors.warning
                            : colors.danger,
                          borderRadius: '3px',
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  )
                })
            )}
          </div>

          {/* Reorder recommendations */}
          {lowStockItems.length > 0 && (
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: colors.textPrimary,
                marginBottom: '1.25rem',
              }}>
                🛒 Reorder Recommendations
              </h3>
              {lowStockItems.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1rem',
                  background: isDark ? 'rgba(245,166,35,0.04)' : 'rgba(184,122,0,0.03)',
                  border: `1px solid ${colors.warning}30`,
                  borderRadius: '10px',
                  marginBottom: '0.5rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: colors.textPrimary,
                      marginBottom: '0.15rem',
                    }}>
                      {item.name}
                    </div>
                    <div style={{ color: colors.warning, fontSize: '0.75rem', fontWeight: 600 }}>
                      {item.quantity === 0 ? 'Out of stock' : `${item.quantity} ${item.unit} left (alert at ${item.low_stock_threshold})`}
                    </div>
                    {item.supplier_name && (
                      <div style={{ color: colors.textMuted, fontSize: '0.72rem', marginTop: '0.15rem' }}>
                        Supplier: {item.supplier_name}
                        {item.supplier_phone && (
                          <a
                            href={`https://wa.me/${item.supplier_phone.replace(/[^0-9]/g, '').replace(/^0/, '234')}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: '#25D366',
                              textDecoration: 'none',
                              fontWeight: 600,
                              marginLeft: '0.5rem',
                            }}
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: colors.textMuted,
                  }}>
                    Cost: {formatNaira(item.cost_price)}/{item.unit}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Category breakdown */}
          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: colors.textPrimary,
              marginBottom: '1.25rem',
            }}>
              📊 Stock Value by Category
            </h3>
            {(() => {
              const byCategory = {}
              items.forEach(item => {
                const cat = item.category || 'General'
                if (!byCategory[cat]) byCategory[cat] = { cost: 0, sell: 0, count: 0 }
                byCategory[cat].cost += item.quantity * item.cost_price
                byCategory[cat].sell += item.quantity * item.selling_price
                byCategory[cat].count += 1
              })
              const sorted = Object.entries(byCategory)
                .sort((a, b) => b[1].sell - a[1].sell)
              const maxVal = sorted[0]?.[1]?.sell || 1
              return sorted.map(([cat, data]) => (
                <div key={cat} style={{ marginBottom: '0.85rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.3rem',
                    flexWrap: 'wrap',
                    gap: '0.3rem',
                  }}>
                    <span style={{ color: colors.textPrimary, fontSize: '0.85rem', fontWeight: 600 }}>
                      {cat}
                      <span style={{ color: colors.textMuted, fontWeight: 400, fontSize: '0.78rem', marginLeft: '0.4rem' }}>
                        ({data.count} item{data.count !== 1 ? 's' : ''})
                      </span>
                    </span>
                    <span style={{ color: colors.green, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}>
                      {formatNaira(data.sell)}
                    </span>
                  </div>
                  <div style={{
                    height: '5px',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(data.sell / maxVal) * 100}%`,
                      background: colors.green,
                      borderRadius: '3px',
                    }} />
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {showMovementModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
          onClick={e => {
            if (e.target === e.currentTarget) setShowMovementModal(null)
          }}
        >
          <div style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              color: colors.textPrimary,
              marginBottom: '0.25rem',
            }}>
              Update Stock — {showMovementModal.name}
            </h3>
            <p style={{
              color: colors.textMuted,
              fontSize: '0.78rem',
              marginBottom: '1.25rem',
            }}>
              Current: {showMovementModal.quantity} {showMovementModal.unit}
            </p>

            {/* Movement type */}
            <label style={lbl}>WHAT IS HAPPENING?</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.4rem',
              marginBottom: '1rem',
            }}>
              {Object.entries(movementColors).map(([type, config]) => (
                <div
                  key={type}
                  onClick={() => setMovementForm(p => ({ ...p, movement_type: type }))}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: `1px solid ${movementForm.movement_type === type
                      ? config.color + '50'
                      : colors.border}`,
                    background: movementForm.movement_type === type
                      ? `${config.color}12`
                      : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{config.icon}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: movementForm.movement_type === type
                      ? config.color
                      : colors.textSecondary,
                    fontFamily: 'Syne, sans-serif',
                  }}>
                    {config.label}
                  </span>
                </div>
              ))}
            </div>

            <label style={lbl} htmlFor="mov-qty">QUANTITY</label>
            <input
              id="mov-qty"
              name="mov-qty"
              type="number"
              min="1"
              placeholder="How many?"
              value={movementForm.quantity}
              onChange={e => setMovementForm(p => ({ ...p, quantity: e.target.value }))}
              style={inp}
            />

            <label style={lbl} htmlFor="mov-notes">REASON / NOTES (OPTIONAL)</label>
            <input
              id="mov-notes"
              name="mov-notes"
              placeholder="e.g. Sold to Tola, Bought from market"
              value={movementForm.notes}
              onChange={e => setMovementForm(p => ({ ...p, notes: e.target.value }))}
              style={{ ...inp, marginBottom: '1.25rem' }}
            />

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleMovement}
                disabled={!movementForm.quantity}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  background: movementForm.quantity ? colors.accent : colors.bgInput,
                  color: movementForm.quantity ? colors.accentText : colors.textMuted,
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: movementForm.quantity ? 'pointer' : 'not-allowed',
                }}
              >
                ✓ Update Stock
              </button>
              <button
                type="button"
                onClick={() => setShowMovementModal(null)}
                style={{
                  padding: '0.8rem 1.25rem',
                  background: 'transparent',
                  color: colors.textMuted,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default Inventory