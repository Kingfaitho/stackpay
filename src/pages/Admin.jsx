import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

const ADMIN_EMAIL = 'swiftleadglo@gmail.com'

function FeedbackSection({ colors, isDark }) {
  const [feedbackItems, setFeedbackItems] = useState([])

  useEffect(() => {
    supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setFeedbackItems(data || []))
  }, [])

  if (feedbackItems.length === 0) return null

  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: '16px',
      overflow: 'hidden',
      marginTop: '1.5rem',
    }}>
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: `1px solid ${colors.border}`,
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: '0.9rem',
        color: colors.textPrimary,
      }}>
        📣 User Feedback ({feedbackItems.length})
      </div>
      {feedbackItems.map((item, i) => (
        <div key={item.id} style={{
          padding: '0.85rem 1.5rem',
          borderBottom: i < feedbackItems.length - 1
            ? `1px solid ${colors.border}`
            : 'none',
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: '0.3rem',
            flexWrap: 'wrap',
          }}>
            <span style={{
              background: `${colors.accent}15`,
              color: colors.accent,
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.1rem 0.45rem',
              borderRadius: '100px',
              fontFamily: 'Syne, sans-serif',
              textTransform: 'uppercase',
            }}>
              {item.type}
            </span>
            <span style={{ color: colors.textMuted, fontSize: '0.72rem' }}>
              {item.user_email || 'Anonymous'}
            </span>
            <span style={{ color: colors.textMuted, fontSize: '0.72rem' }}>·</span>
            <span style={{ color: colors.textMuted, fontSize: '0.72rem' }}>
              {new Date(item.created_at).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'short',
              })}
            </span>
          </div>
          {item.subject && (
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              fontSize: '0.82rem',
              color: colors.textPrimary,
              marginBottom: '0.2rem',
            }}>
              {item.subject}
            </div>
          )}
          <div style={{
            color: colors.textSecondary,
            fontSize: '0.82rem',
            lineHeight: 1.6,
          }}>
            {item.message}
          </div>
        </div>
      ))}
    </div>
  )
}

function Admin() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0, starter: 0, growth: 0, business: 0,
  })
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) {
      navigate('/dashboard')
      return
    }
    loadProfiles()
  }, [user])

  const loadProfiles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin load error:', error)
      setLoading(false)
      return
    }

    const allProfiles = data || []
    setProfiles(allProfiles)
    setStats({
      total: allProfiles.length,
      starter: allProfiles.filter(p => !p.plan || p.plan === 'Starter').length,
      growth: allProfiles.filter(p => p.plan === 'Growth').length,
      business: allProfiles.filter(p => p.plan === 'Business').length,
    })
    setLoading(false)
  }

  const filtered = profiles.filter(p =>
    (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.owner_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const getPlanColor = (plan) => {
    if (plan === 'Business') return colors.purple
    if (plan === 'Growth') return colors.green
    return colors.textMuted
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '2rem 5%',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: isDark ? 'rgba(255,80,80,0.1)' : 'rgba(204,34,0,0.08)',
              border: `1px solid ${colors.danger}40`,
              borderRadius: '100px',
              padding: '0.25rem 0.85rem',
              fontSize: '0.72rem',
              color: colors.danger,
              fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
              marginBottom: '0.75rem',
            }}>
              🔒 ADMIN ONLY
            </div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              color: colors.textPrimary,
              marginBottom: '0.25rem',
            }}>
              StackPay Control Room
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
              All users, plans, and business data
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.65rem 1.2rem',
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            ← Dashboard
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.5rem',
        }}>
          {[
            { label: 'Total Users', value: stats.total, color: colors.textPrimary, icon: '👥' },
            { label: 'Starter (Free)', value: stats.starter, color: colors.textMuted, icon: '🆓' },
            { label: 'Growth', value: stats.growth, color: colors.green, icon: '📈' },
            { label: 'Business', value: stats.business, color: colors.purple, icon: '💎' },
            {
              label: 'Est. MRR',
              value: `₦${((stats.growth * 3500) + (stats.business * 9000)).toLocaleString()}`,
              color: colors.green,
              icon: '💰',
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '1.1rem',
              boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{item.icon}</div>
              <div style={{
                color: colors.textLabel,
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}>
                {item.label}
              </div>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '1.3rem',
                color: item.color,
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          placeholder="Search by email, business name, or owner name..."
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
            marginBottom: '1rem',
            boxSizing: 'border-box',
          }}
        />

        {/* Users table */}
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
        }}>

          {/* Add this after the users table div */}
<FeedbackSection colors={colors} isDark={isDark} />

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 120px 130px 100px',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            borderBottom: `1px solid ${colors.border}`,
          }}>
            {['Business', 'Email', 'Plan', 'Joined', 'Status'].map((h, i) => (
              <div key={i} style={{
                color: colors.textLabel,
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}>
                {h}
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: colors.textMuted,
            }}>
              Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: colors.textMuted,
            }}>
              No users found
            </div>
          ) : (
            filtered.map((profile, i) => (
              <div
                key={profile.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 120px 130px 100px',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  borderBottom: i < filtered.length - 1
                    ? `1px solid ${colors.border}`
                    : 'none',
                  alignItems: 'center',
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
                <div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {profile.business_name || '—'}
                  </div>
                  {profile.owner_name && (
                    <div style={{
                      color: colors.textMuted,
                      fontSize: '0.72rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {profile.owner_name}
                    </div>
                  )}
                </div>

                <div style={{
                  color: colors.textSecondary,
                  fontSize: '0.82rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {profile.email || '—'}
                </div>

                <div>
                  <span style={{
                    background: `${getPlanColor(profile.plan)}15`,
                    border: `1px solid ${getPlanColor(profile.plan)}30`,
                    color: getPlanColor(profile.plan),
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '100px',
                    fontFamily: 'Syne, sans-serif',
                    textTransform: 'uppercase',
                  }}>
                    {profile.plan || 'Starter'}
                  </span>
                </div>

                <div style={{
                  color: colors.textMuted,
                  fontSize: '0.78rem',
                }}>
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short', year: '2-digit',
                      })
                    : '—'}
                </div>

                <div>
                  <span style={{
                    background: profile.subscription_status === 'active'
                      ? isDark ? 'rgba(0,197,102,0.1)' : 'rgba(0,120,60,0.08)'
                      : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${profile.subscription_status === 'active'
                      ? colors.borderGreen
                      : colors.border}`,
                    color: profile.subscription_status === 'active'
                      ? colors.green
                      : colors.textMuted,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '100px',
                    fontFamily: 'Syne, sans-serif',
                    textTransform: 'uppercase',
                  }}>
                    {profile.subscription_status === 'active' ? 'Active' : 'Free'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{
          marginTop: '1rem',
          color: colors.textMuted,
          fontSize: '0.75rem',
          textAlign: 'right',
        }}>
          {filtered.length} of {profiles.length} users shown
        </div>
      </div>
    </div>
  )
}

export default Admin