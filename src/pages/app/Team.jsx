import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

function Team() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ member_email: '', member_name: '', role: 'member' })
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState('Starter')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadTeam()
      loadPlan()
    }
  }, [user])

  const loadTeam = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setMembers(data || [])
    setLoading(false)
  }

  const loadPlan = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    if (data?.plan) setPlan(data.plan)
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (plan !== 'Business') {
      alert('Team members is a Business plan feature. Upgrade to add team members.')
      return
    }
    if (members.length >= 5) {
      alert('Business plan supports up to 5 team members.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('team_members')
      .insert({ ...form, owner_id: user.id })
    if (!error) {
      setForm({ member_email: '', member_name: '', role: 'member' })
      setShowForm(false)
      loadTeam()
    }
    setSaving(false)
  }

  const removeMe = async (id) => {
    if (!window.confirm('Remove this team member?')) return
    await supabase.from('team_members').delete().eq('id', id)
    loadTeam()
  }

  const inp = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#0F1510',
    color: '#F0F5F2',
    fontSize: '0.9rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    marginBottom: '0.75rem',
  }

  return (
    <AppLayout>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
            color: '#F0F5F2',
          }}>
            Team Members
          </h1>
          <p style={{ color: '#8A9E92', fontSize: '0.9rem' }}>
            {members.length}/5 members •{' '}
            <span style={{ color: plan === 'Business' ? '#00C566' : '#f5a623' }}>
              {plan} Plan
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.7rem 1.3rem',
            background: plan === 'Business' ? '#00C566' : 'rgba(245,166,35,0.1)',
            color: plan === 'Business' ? '#080C0A' : '#f5a623',
            borderRadius: '10px',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: plan === 'Business'
              ? 'none'
              : '1px solid rgba(245,166,35,0.3)',
            cursor: 'pointer',
          }}
        >
          {plan === 'Business' ? '+ Invite Member' : '🔒 Upgrade to Invite'}
        </button>
      </div>

      {/* Upgrade Banner for non-Business */}
      {plan !== 'Business' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(0,197,102,0.05))',
          border: '1px solid rgba(245,166,35,0.2)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              color: '#F0F5F2',
              marginBottom: '0.25rem',
            }}>
              Team members is a Business plan feature
            </div>
            <div style={{ color: '#8A9E92', fontSize: '0.88rem' }}>
              Upgrade to Business (₦9,000/month) to invite up to 5 team members
            </div>
          </div>
          <a href="/billing" style={{
            padding: '0.65rem 1.2rem',
            background: '#f5a623',
            color: '#080C0A',
            borderRadius: '8px',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.88rem',
            textDecoration: 'none',
          }}>
            Upgrade Now
          </a>
        </div>
      )}

      {/* Invite Form */}
      {showForm && plan === 'Business' && (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(0,197,102,0.2)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            color: '#F0F5F2',
            marginBottom: '1.2rem',
            fontSize: '1rem',
          }}>
            Invite Team Member
          </h3>
          <form onSubmit={handleInvite}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.5rem',
            }}>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  NAME
                </label>
                <input
                  placeholder="Team member name"
                  value={form.member_name}
                  onChange={e => setForm({ ...form, member_name: e.target.value })}
                  required
                  style={inp}
                />
              </div>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  placeholder="their@email.com"
                  value={form.member_email}
                  onChange={e => setForm({ ...form, member_email: e.target.value })}
                  required
                  style={inp}
                />
              </div>
              <div>
                <label style={{ color: '#8A9E92', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  ROLE
                </label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  style={inp}
                >
                  <option value="member">Member — view only</option>
                  <option value="editor">Editor — create invoices</option>
                  <option value="admin">Admin — full access</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: '#00C566',
                  color: '#080C0A',
                  borderRadius: '8px',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Inviting...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: 'transparent',
                  color: '#8A9E92',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      {loading ? (
        <div style={{ color: '#8A9E92', textAlign: 'center', marginTop: '3rem' }}>
          Loading team...
        </div>
      ) : members.length === 0 ? (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          color: '#8A9E92',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👥</div>
          <p>No team members yet.</p>
        </div>
      ) : (
        <div style={{
          background: '#141A16',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {members.map((member, i) => (
            <div key={member.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: i < members.length - 1
                ? '1px solid rgba(255,255,255,0.05)'
                : 'none',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0,197,102,0.1)',
                  border: '1px solid rgba(0,197,102,0.2)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00C566',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}>
                  {member.member_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{
                    color: '#F0F5F2',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                  }}>
                    {member.member_name}
                  </div>
                  <div style={{ color: '#8A9E92', fontSize: '0.8rem' }}>
                    {member.member_email}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  background: 'rgba(0,197,102,0.08)',
                  border: '1px solid rgba(0,197,102,0.15)',
                  color: '#00C566',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '100px',
                  fontFamily: 'Syne, sans-serif',
                  textTransform: 'capitalize',
                }}>
                  {member.role}
                </span>
                <button
                  onClick={() => removeMe(member.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#8A9E92',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff8080'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8A9E92'}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}

export default Team
