import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function POS() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [inventory, setInventory] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [todaySales, setTodaySales] = useState([])
  const searchRef = useRef(null)
  const barcodeRef = useRef(null)

  useEffect(() => {
    if (user) {
      loadInventory()
      loadTodaySales()
    }
  }, [user])

  // Auto-focus barcode input
  useEffect(() => {
    barcodeRef.current?.focus()
  }, [])

  const loadInventory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .gt('quantity', 0)
        .order('name')
      if (error) {
        console.error('Inventory load error:', error)
        setInventory([])
      } else {
        setInventory(data || [])
      }
    } catch (err) {
      console.error('POS crash:', err)
      setInventory([])
    }
    setLoading(false)
  }

  const loadTodaySales = async () => {
    if (!user) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('cash_receipts')
        .select('*')
        .eq('user_id', user.id)
        .gte('received_date', today)
        .eq('payment_method', 'pos_sale')
      if (error) {
        console.error('POS sales load error:', error)
        setTodaySales([])
      } else {
        setTodaySales(data || [])
      }
    } catch (err) {
      console.error('POS today sales crash:', err)
      setTodaySales([])
    }
  }

  // Filtered inventory for search
  const filtered = inventory.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  // Handle barcode scan or SKU lookup
  const handleBarcodeSubmit = (e) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return

    const found = inventory.find(
      item => item.sku === barcodeInput.trim() ||
        item.name.toLowerCase() === barcodeInput.trim().toLowerCase()
    )

    if (found) {
      addToCart(found)
      setBarcodeInput('')
    } else {
      alert(`No item found with code: ${barcodeInput}. Make sure you have added it to Inventory with a SKU code.`)
    }
    barcodeRef.current?.focus()
  }

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) {
        if (existing.qty >= item.quantity) {
          alert(`Only ${item.quantity} ${item.unit} of ${item.name} in stock`)
          return prev
        }
        return prev.map(c => c.id === item.id
          ? { ...c, qty: c.qty + 1 }
          : c
        )
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => {
      return prev
        .map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
        .filter(c => c.qty > 0)
    })
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(c => c.id !== id))
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.selling_price * item.qty), 0)
  const cartCost = cart.reduce((sum, item) => sum + (item.cost_price * item.qty), 0)
  const cartProfit = cartTotal - cartCost
  const change = amountPaid ? Number(amountPaid) - cartTotal : 0

  const processSale = async () => {
    if (cart.length === 0) return
    setProcessingPayment(true)

    const receiptNumber = `SALE-${Date.now()}`
    const description = cart.map(i => `${i.qty}x ${i.name}`).join(', ')

    try {
      // 1. Log as cash receipt
      await supabase.from('cash_receipts').insert({
        user_id: user.id,
        amount: cartTotal,
        description,
        payment_method: 'pos_sale',
        received_date: new Date().toISOString().split('T')[0],
        notes: `POS Sale ${receiptNumber} — Profit: NGN ${cartProfit.toLocaleString()}`,
      })

      // 2. Reduce inventory quantities
      await Promise.all(
        cart.map(item =>
          supabase
            .from('inventory')
            .update({ quantity: item.quantity - item.qty })
            .eq('id', item.id)
        )
      )

      // 3. Log inventory movements
      await Promise.all(
        cart.map(item =>
          supabase.from('inventory_movements').insert({
            user_id: user.id,
            inventory_id: item.id,
            movement_type: 'sale',
            quantity: item.qty,
            notes: `POS Sale ${receiptNumber}`,
          })
        )
      )

      setLastSale({
        receiptNumber,
        items: [...cart],
        total: cartTotal,
        profit: cartProfit,
        paymentMethod,
        amountPaid: Number(amountPaid) || cartTotal,
        change: Math.max(change, 0),
        time: new Date().toLocaleTimeString('en-NG'),
      })

      setCart([])
      setAmountPaid('')
      setShowReceipt(true)
      loadInventory()
      loadTodaySales()
    } catch (err) {
      console.error('Sale error:', err)
      alert('Sale failed. Please try again.')
    }
    setProcessingPayment(false)
  }

  const formatNaira = (n) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(n || 0)

  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.amount), 0)

  return (
    <AppLayout>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)',
          color: colors.textPrimary,
          marginBottom: '0.2rem',
        }}>
          🏪 Point of Sale
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
          Scan barcodes or search products · Every sale auto-updates inventory and profit
        </p>
      </div>

      {/* Today summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.25rem',
      }}>
        {[
          {
            icon: '💰',
            label: "Today's Revenue",
            value: formatNaira(todayRevenue),
            color: colors.green,
          },
          {
            icon: '🧾',
            label: "Sales Today",
            value: todaySales.length,
            color: colors.textPrimary,
          },
          {
            icon: '🛒',
            label: 'In Cart',
            value: cart.length,
            color: cart.length > 0 ? colors.accent : colors.textMuted,
          },
        ].map((item, i) => (
          <div key={i} style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '0.85rem',
            boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: '1rem', marginBottom: '0.3rem' }}>
              {item.icon}
            </div>
            <div style={{
              color: colors.textMuted,
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              marginBottom: '0.2rem',
            }}>
              {item.label}
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1rem',
              color: item.color,
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '1rem',
        alignItems: 'start',
      }}>

        {/* LEFT — Product selection */}
        <div>
          {/* Barcode scanner input */}
          <div style={{
            background: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.04)',
            border: `1px solid ${colors.borderGreen}`,
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '0.75rem',
          }}>
            <div style={{
              color: colors.green,
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              fontFamily: 'Syne, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              📡 Barcode Scanner Input
              <span style={{
                color: colors.textMuted,
                fontWeight: 400,
                fontSize: '0.68rem',
              }}>
                — plug in USB barcode scanner and scan here
              </span>
            </div>
            <form onSubmit={handleBarcodeSubmit} style={{
              display: 'flex',
              gap: '0.5rem',
            }}>
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan barcode or type SKU code..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bgInput,
                  color: colors.textPrimary,
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.7rem 1.2rem',
                  background: colors.green,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Add →
              </button>
            </form>
          </div>

          {/* Product search */}
          <input
            ref={searchRef}
            placeholder="Search products by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              background: colors.bgCard,
              color: colors.textPrimary,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.9rem',
              outline: 'none',
              marginBottom: '0.75rem',
              boxSizing: 'border-box',
            }}
          />

          {/* Product grid */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: colors.textMuted,
            }}>
              Loading products...
            </div>
          ) : inventory.length === 0 ? (
            <div style={{
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '3rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
              <p style={{
                color: colors.textPrimary,
                fontWeight: 600,
                marginBottom: '0.4rem',
              }}>
                No products in inventory
              </p>
              <p style={{
                color: colors.textMuted,
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}>
                Add products in Inventory with SKU codes to use the POS
              </p>
              <a
                href="/inventory"
                style={{
                  display: 'inline-block',
                  padding: '0.6rem 1.25rem',
                  background: colors.accent,
                  color: colors.accentText,
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                Go to Inventory →
              </a>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '0.65rem',
              maxHeight: '60vh',
              overflowY: 'auto',
              paddingRight: '0.25rem',
            }}>
              {filtered.map(item => {
                const inCart = cart.find(c => c.id === item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    style={{
                      background: inCart
                        ? isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)'
                        : colors.bgCard,
                      border: `1px solid ${inCart ? colors.borderGreen : colors.border}`,
                      borderRadius: '12px',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!inCart) {
                        e.currentTarget.style.borderColor = colors.borderGreen
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!inCart) {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {inCart && (
                      <div style={{
                        position: 'absolute',
                        top: '0.4rem',
                        right: '0.4rem',
                        background: colors.green,
                        color: '#fff',
                        borderRadius: '100px',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                      }}>
                        {inCart.qty}
                      </div>
                    )}
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: colors.textPrimary,
                      marginBottom: '0.3rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      color: colors.green,
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      marginBottom: '0.2rem',
                    }}>
                      {formatNaira(item.selling_price)}
                    </div>
                    <div style={{
                      color: colors.textMuted,
                      fontSize: '0.68rem',
                    }}>
                      {item.quantity} {item.unit} left
                      {item.sku && ` · ${item.sku}`}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT — Cart and checkout */}
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: '80px',
        }}>
          {/* Cart header */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isDark
              ? 'rgba(255,255,255,0.02)'
              : 'rgba(0,0,0,0.02)',
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: colors.textPrimary,
            }}>
              🛒 Current Sale
            </h3>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.danger,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart items */}
          <div style={{
            minHeight: '200px',
            maxHeight: '35vh',
            overflowY: 'auto',
          }}>
            {cart.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: colors.textMuted,
                fontSize: '0.85rem',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  🛒
                </div>
                Tap a product or scan to add
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{
                  padding: '0.75rem 1.25rem',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      color: colors.textPrimary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      color: colors.textMuted,
                      fontSize: '0.7rem',
                    }}>
                      {formatNaira(item.selling_price)} each
                    </div>
                  </div>

                  {/* Qty controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    flexShrink: 0,
                  }}>
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        background: colors.bgCard2,
                        color: colors.textPrimary,
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}
                    >
                      −
                    </button>
                    <span style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: colors.textPrimary,
                      minWidth: '20px',
                      textAlign: 'center',
                    }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.borderGreen}`,
                        background: isDark
                          ? 'rgba(0,197,102,0.1)'
                          : 'rgba(0,120,60,0.08)',
                        color: colors.green,
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: colors.textPrimary,
                    minWidth: '65px',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}>
                    {formatNaira(item.selling_price * item.qty)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          {cart.length > 0 && (
            <div style={{ padding: '1rem 1.25rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.4rem',
              }}>
                <span style={{ color: colors.textMuted, fontSize: '0.82rem' }}>
                  Subtotal ({cart.reduce((sum, c) => sum + c.qty, 0)} items)
                </span>
                <span style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  fontSize: '0.88rem',
                }}>
                  {formatNaira(cartTotal)}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
              }}>
                <span style={{ color: colors.textMuted, fontSize: '0.78rem' }}>
                  Profit this sale
                </span>
                <span style={{
                  color: colors.green,
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}>
                  {formatNaira(cartProfit)}
                </span>
              </div>

              {/* Payment method */}
              <div style={{
                display: 'flex',
                gap: '0.4rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
              }}>
                {[
                  { id: 'cash', label: '💵 Cash' },
                  { id: 'transfer', label: '🏦 Transfer' },
                  { id: 'pos', label: '💳 POS' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.4rem',
                      borderRadius: '8px',
                      border: `1px solid ${paymentMethod === m.id
                        ? colors.borderGreen : colors.border}`,
                      background: paymentMethod === m.id
                        ? isDark ? 'rgba(0,197,102,0.1)' : 'rgba(0,120,60,0.08)'
                        : 'transparent',
                      color: paymentMethod === m.id
                        ? colors.green : colors.textMuted,
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Amount paid (cash) */}
              {paymentMethod === 'cash' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="number"
                    placeholder={`Amount given (min ${formatNaira(cartTotal)})`}
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      background: colors.bgInput,
                      color: colors.textPrimary,
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: amountPaid ? '0.4rem' : 0,
                    }}
                  />
                  {amountPaid && Number(amountPaid) >= cartTotal && (
                    <div style={{
                      color: colors.green,
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      padding: '0.4rem 0.6rem',
                      background: isDark
                        ? 'rgba(0,197,102,0.08)'
                        : 'rgba(0,120,60,0.06)',
                      borderRadius: '6px',
                      border: `1px solid ${colors.borderGreen}`,
                    }}>
                      Change: {formatNaira(change)}
                    </div>
                  )}
                  {amountPaid && Number(amountPaid) < cartTotal && (
                    <div style={{
                      color: colors.danger,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      Amount too low by {formatNaira(cartTotal - Number(amountPaid))}
                    </div>
                  )}
                </div>
              )}

              {/* Charge button */}
              <button
                onClick={processSale}
                disabled={processingPayment ||
                  (paymentMethod === 'cash' && amountPaid && Number(amountPaid) < cartTotal)}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: processingPayment ? colors.greenDark : colors.green,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: processingPayment ? 'not-allowed' : 'pointer',
                  boxShadow: processingPayment
                    ? 'none'
                    : `0 4px 16px ${colors.green}40`,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={e => {
                  if (!processingPayment) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {processingPayment
                  ? '⏳ Processing...'
                  : `✓ Charge ${formatNaira(cartTotal)}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Receipt modal */}
      {showReceipt && lastSale && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: colors.bgCard,
            border: `1px solid ${colors.borderGreen}`,
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '360px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: colors.green,
              marginBottom: '0.25rem',
            }}>
              Sale Complete!
            </div>
            <div style={{
              color: colors.textMuted,
              fontSize: '0.78rem',
              marginBottom: '1.5rem',
            }}>
              {lastSale.receiptNumber} · {lastSale.time}
            </div>

            <div style={{
              background: colors.bgCard2,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem',
              textAlign: 'left',
            }}>
              {lastSale.items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.4rem',
                  fontSize: '0.82rem',
                  color: colors.textSecondary,
                }}>
                  <span>{item.qty}x {item.name}</span>
                  <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
                    {formatNaira(item.selling_price * item.qty)}
                  </span>
                </div>
              ))}
              <div style={{
                borderTop: `1px solid ${colors.border}`,
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                }}>
                  Total
                </span>
                <span style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  color: colors.green,
                  fontSize: '0.9rem',
                }}>
                  {formatNaira(lastSale.total)}
                </span>
              </div>
              {lastSale.change > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.3rem',
                  color: colors.textMuted,
                  fontSize: '0.78rem',
                }}>
                  <span>Change</span>
                  <span style={{ color: colors.warning, fontWeight: 600 }}>
                    {formatNaira(lastSale.change)}
                  </span>
                </div>
              )}
              <div style={{
                marginTop: '0.5rem',
                color: colors.textMuted,
                fontSize: '0.72rem',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>Profit this sale</span>
                <span style={{ color: colors.green, fontWeight: 700 }}>
                  {formatNaira(lastSale.profit)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowReceipt(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: colors.green,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .pos-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppLayout>
  )
}

export default POS