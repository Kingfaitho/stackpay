import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../supabaseClient'
import AppLayout from '../../components/AppLayout'

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#7A9485' },
  { id: 'medium', label: 'Medium', color: '#f5a623' },
  { id: 'high', label: 'High', color: '#ff6b6b' },
]

function Notes() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const [notes, setNotes] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    type: 'note',
    title: '',
    content: '',
    priority: 'medium',
    due_date: '',
    client_id: '',
    pinned: false,
  })

  useEffect(() => {
    if (user) {
      loadNotes()
      loadClients()
    }
  }, [user])

  const loadNotes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('business_notes')
      .select('*, clients(name)')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }, [user])

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name')
    setClients(data || [])
  }

  const resetForm = () => {
    setForm({
      type: 'note',
      title: '',
      content: '',
      priority: 'medium',
      due_date: '',
      client_id: '',
      pinned: false,
    })
    setEditingNote(null)
  }

  const openEdit = (note) => {
    setEditingNote(note)
    setForm({
      type: note.type || 'note',
      title: note.title || '',
      content: note.content || '',
      priority: note.priority || 'medium',
      due_date: note.due_date || '',
      client_id: note.client_id || '',
      pinned: note.pinned || false,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (saving) return
    if (!form.title.trim()) return

    setSaving(true)
    const payload = {
      type: form.type,
      title: form.title.trim(),
      content: form.content.trim() || null,
      priority: form.priority,
      due_date: form.due_date || null,
      client_id: form.client_id || null,
      pinned: form.pinned,
      updated_at: new Date().toISOString(),
    }

    if (editingNote) {
      await supabase
        .from('business_notes')
        .update(payload)
        .eq('id', editingNote.id)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('business_notes')
        .insert({ ...payload, user_id: user.id })
    }

    setShowForm(false)
    resetForm()
    await loadNotes()
    setSaving(false)
  }

  const toggleComplete = async (note) => {
    await supabase
      .from('business_notes')
      .update({
        completed: !note.completed,
        completed_at: !note.completed ? new Date().toISOString() : null,
      })
      .eq('id', note.id)
    loadNotes()
  }

  const togglePin = async (note) => {
    await supabase
      .from('business_notes')
      .update({ pinned: !note.pinned })
      .eq('id', note.id)
    loadNotes()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return
    await supabase.from('business_notes').delete().eq('id', id)
    loadNotes()
  }

  const filtered = notes.filter(note => {
    const matchSearch = note.title.toLowerCase().includes(search.toLowerCase()) ||
      (note.content || '').toLowerCase().includes(search.toLowerCase())
    const matchView = activeView === 'all' ||
      (activeView === 'tasks' && note.type === 'task') ||
      (activeView === 'notes' && note.type === 'note') ||
      (activeView === 'pinned' && note.pinned) ||
      (activeView === 'pending' && note.type === 'task' && !note.completed)
    return matchSearch && matchView
  })

  const pendingTasks = notes.filter(n => n.type === 'task' && !n.completed)
  const overdueTasks = pendingTasks.filter(n => n.due_date && new Date(n.due_date) < new Date())
  const pinnedNotes = notes.filter(n => n.pinned)

  const getPriorityConfig = (p) =>
    PRIORITIES.find(pr => pr.id === p) || PRIORITIES[1]

  const isOverdue = (note) =>
    note.type === 'task' && !note.completed &&
    note.due_date && new Date(note.due_date) < new Date()

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
            📝 Notes & Tasks
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '0.88rem' }}>
            Business decisions, reminders, client notes, and to-dos — all in one place
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              resetForm()
              setForm(p => ({ ...p, type: 'task' }))
              setShowForm(true)
            }}
            style={{
              padding: '0.65rem 1.1rem',
              background: isDark
                ? 'rgba(124,106,247,0.1)'
                : 'rgba(91,78,199,0.08)',
              border: `1px solid ${isDark
                ? 'rgba(124,106,247,0.3)'
                : 'rgba(91,78,199,0.2)'}`,
              color: colors.purple,
              borderRadius: '10px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Task
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            style={{
              padding: '0.65rem 1.1rem',
              background: colors.accent,
              color: colors.accentText,
              borderRadius: '10px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Note
          </button>
        </div>
      </div>

      {/* Alert for overdue tasks */}
      {overdueTasks.length > 0 && (
        <div style={{
          background: isDark ? 'rgba(255,80,80,0.06)' : 'rgba(204,34,0,0.04)',
          border: `1px solid ${colors.danger}40`,
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🔴</span>
          <div style={{
            color: colors.danger,
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}>
            {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
            <span style={{
              fontWeight: 400,
              color: colors.textSecondary,
              marginLeft: '0.4rem',
              fontSize: '0.8rem',
            }}>
              — {overdueTasks.slice(0, 2).map(t => t.title).join(', ')}
              {overdueTasks.length > 2 ? ` and ${overdueTasks.length - 2} more` : ''}
            </span>
          </div>
        </div>
      )}

      {/* View tabs */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {[
          { id: 'all', label: `All (${notes.length})` },
          { id: 'pending', label: `Pending Tasks (${pendingTasks.length})` },
          { id: 'tasks', label: 'Tasks' },
          { id: 'notes', label: 'Notes' },
          { id: 'pinned', label: `📌 Pinned (${pinnedNotes.length})` },
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '100px',
              border: `1px solid ${activeView === view.id ? colors.borderGreen : colors.border}`,
              background: activeView === view.id
                ? isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)'
                : 'transparent',
              color: activeView === view.id ? colors.green : colors.textMuted,
              fontFamily: 'Syne, sans-serif',
              fontWeight: activeView === view.id ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {view.label}
          </button>
        ))}

        {/* Search */}
        <input
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
            background: colors.bgCard,
            color: colors.textPrimary,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.82rem',
            outline: 'none',
            minWidth: '160px',
          }}
        />
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${form.type === 'task' ? `${colors.purple}50` : colors.borderGreen}`,
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.25rem',
          boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            color: colors.textPrimary,
            fontSize: '1rem',
            marginBottom: '1.25rem',
          }}>
            {editingNote
              ? `✏️ Edit ${editingNote.type === 'task' ? 'Task' : 'Note'}`
              : form.type === 'task' ? '+ New Task' : '+ New Note'}
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Type toggle */}
            <div style={{
              display: 'flex',
              gap: 0,
              marginBottom: '1rem',
              background: colors.bgCard2,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '3px',
              width: 'fit-content',
            }}>
              {[
                { id: 'note', label: '📝 Note' },
                { id: 'task', label: '✅ Task' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: t.id }))}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: form.type === t.id ? colors.bgCard : 'transparent',
                    color: form.type === t.id ? colors.textPrimary : colors.textMuted,
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: form.type === t.id ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: form.type === t.id && !isDark ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Title */}
            <label style={lbl} htmlFor="note-title">
              {form.type === 'task' ? 'TASK *' : 'NOTE TITLE *'}
            </label>
            <input
              id="note-title"
              name="note-title"
              placeholder={form.type === 'task'
                ? 'e.g. Call Emeka about payment, Deliver Tola\'s dress'
                : 'e.g. Business decisions, Ideas, Meeting notes'}
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
              style={inp}
            />

            {/* Content */}
            <label style={lbl} htmlFor="note-content">DETAILS</label>
            <textarea
              id="note-content"
              name="note-content"
              placeholder="Add more details here..."
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={3}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
            />

            {/* Row — Priority + Due date + Client */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.75rem',
            }}>
              {/* Priority */}
              <div>
                <label style={lbl}>PRIORITY</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {PRIORITIES.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, priority: p.id }))}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.4rem',
                        borderRadius: '7px',
                        border: `1px solid ${form.priority === p.id ? p.color + '60' : colors.border}`,
                        background: form.priority === p.id ? `${p.color}12` : 'transparent',
                        color: form.priority === p.id ? p.color : colors.textMuted,
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date — tasks only */}
              {form.type === 'task' && (
                <div>
                  <label style={lbl} htmlFor="note-due">DUE DATE</label>
                  <input
                    id="note-due"
                    name="note-due"
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                    style={{ ...inp, marginBottom: 0 }}
                  />
                </div>
              )}

              {/* Client */}
              <div>
                <label style={lbl} htmlFor="note-client">LINKED CLIENT</label>
                <select
                  id="note-client"
                  name="note-client"
                  value={form.client_id}
                  onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
                  style={{ ...inp, cursor: 'pointer', marginBottom: 0 }}
                >
                  <option value="">— No client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pin toggle */}
            <div
              onClick={() => setForm(p => ({ ...p, pinned: !p.pinned }))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: form.pinned
                  ? isDark ? 'rgba(201,168,76,0.08)' : 'rgba(184,140,0,0.06)'
                  : 'transparent',
                border: `1px solid ${form.pinned ? '#C9A84C50' : colors.border}`,
                marginTop: '0.75rem',
                marginBottom: '1.25rem',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{form.pinned ? '📌' : '📍'}</span>
              <span style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '0.82rem',
                color: form.pinned ? '#C9A84C' : colors.textMuted,
              }}>
                {form.pinned ? 'Pinned to top' : 'Pin this note'}
              </span>
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
                {saving ? 'Saving...' : editingNote ? '✓ Save Changes' : `Save ${form.type === 'task' ? 'Task' : 'Note'}`}
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
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          color: colors.textMuted,
        }}>
          Loading notes...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            {activeView === 'tasks' ? '✅' : '📝'}
          </div>
          <p style={{ color: colors.textPrimary, fontWeight: 500, marginBottom: '0.4rem' }}>
            {search ? 'No matches found' : activeView === 'pending' ? 'No pending tasks — great work!' : 'Nothing here yet'}
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
            {search
              ? 'Try a different search'
              : 'Create a note or task to start organizing your business'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '0.85rem',
        }}>
          {filtered.map(note => {
            const priorityConfig = getPriorityConfig(note.priority)
            const overdue = isOverdue(note)

            return (
              <div
                key={note.id}
                style={{
                  background: colors.bgCard,
                  border: `1px solid ${overdue
                    ? colors.danger + '40'
                    : note.pinned
                    ? '#C9A84C40'
                    : colors.border}`,
                  borderRadius: '14px',
                  padding: '1.1rem 1.25rem',
                  boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                  opacity: note.completed ? 0.6 : 1,
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {/* Pin indicator */}
                {note.pinned && (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    fontSize: '0.85rem',
                  }}>
                    📌
                  </div>
                )}

                {/* Type + Priority */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '0.6rem',
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    background: note.type === 'task'
                      ? isDark ? 'rgba(124,106,247,0.1)' : 'rgba(91,78,199,0.08)'
                      : isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)',
                    border: `1px solid ${note.type === 'task'
                      ? isDark ? 'rgba(124,106,247,0.2)' : 'rgba(91,78,199,0.15)'
                      : colors.borderGreen}`,
                    color: note.type === 'task' ? colors.purple : colors.green,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '100px',
                    fontFamily: 'Syne, sans-serif',
                    textTransform: 'uppercase',
                  }}>
                    {note.type === 'task' ? '✅ Task' : '📝 Note'}
                  </span>

                  <span style={{
                    background: `${priorityConfig.color}15`,
                    border: `1px solid ${priorityConfig.color}30`,
                    color: priorityConfig.color,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '100px',
                    fontFamily: 'Syne, sans-serif',
                  }}>
                    {priorityConfig.label}
                  </span>

                  {overdue && (
                    <span style={{
                      background: `${colors.danger}15`,
                      border: `1px solid ${colors.danger}30`,
                      color: colors.danger,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '100px',
                      fontFamily: 'Syne, sans-serif',
                    }}>
                      OVERDUE
                    </span>
                  )}

                  {note.completed && (
                    <span style={{
                      background: `${colors.green}15`,
                      border: `1px solid ${colors.green}30`,
                      color: colors.green,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '100px',
                      fontFamily: 'Syne, sans-serif',
                    }}>
                      DONE
                    </span>
                  )}
                </div>

                {/* Title */}
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: note.completed ? colors.textMuted : colors.textPrimary,
                  marginBottom: '0.35rem',
                  textDecoration: note.completed ? 'line-through' : 'none',
                  paddingRight: note.pinned ? '1.5rem' : 0,
                }}>
                  {note.title}
                </div>

                {/* Content */}
                {note.content && (
                  <div style={{
                    color: colors.textSecondary,
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    marginBottom: '0.75rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {note.content}
                  </div>
                )}

                {/* Meta */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginBottom: '0.85rem',
                  fontSize: '0.72rem',
                  color: colors.textMuted,
                }}>
                  {note.clients?.name && (
                    <span style={{
                      background: isDark ? 'rgba(0,197,102,0.06)' : 'rgba(0,120,60,0.05)',
                      border: `1px solid ${colors.borderGreen}`,
                      color: colors.green,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '100px',
                      fontWeight: 600,
                    }}>
                      👤 {note.clients.name}
                    </span>
                  )}
                  {note.due_date && (
                    <span style={{
                      color: overdue ? colors.danger : colors.textMuted,
                      fontWeight: overdue ? 700 : 400,
                    }}>
                      📅 {new Date(note.due_date).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short',
                      })}
                    </span>
                  )}
                  <span>
                    {new Date(note.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short',
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: '0.75rem',
                }}>
                  {note.type === 'task' && (
                    <button
                      type="button"
                      onClick={() => toggleComplete(note)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: note.completed
                          ? isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
                          : isDark ? 'rgba(0,197,102,0.08)' : 'rgba(0,120,60,0.06)',
                        border: `1px solid ${note.completed ? colors.border : colors.borderGreen}`,
                        color: note.completed ? colors.textMuted : colors.green,
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'Syne, sans-serif',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {note.completed ? '↩ Reopen' : '✓ Complete'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => togglePin(note)}
                    style={{
                      padding: '0.35rem 0.6rem',
                      background: 'transparent',
                      border: `1px solid ${colors.border}`,
                      color: note.pinned ? '#C9A84C' : colors.textMuted,
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontFamily: 'Syne, sans-serif',
                      transition: 'all 0.2s',
                    }}
                    title={note.pinned ? 'Unpin' : 'Pin to top'}
                  >
                    {note.pinned ? '📌' : '📍'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEdit(note)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      background: isDark
                        ? 'rgba(124,106,247,0.06)'
                        : 'rgba(91,78,199,0.06)',
                      border: `1px solid ${isDark
                        ? 'rgba(124,106,247,0.15)'
                        : 'rgba(91,78,199,0.12)'}`,
                      color: colors.purple,
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    style={{
                      padding: '0.35rem 0.6rem',
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: colors.textMuted,
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'all 0.2s',
                      marginLeft: 'auto',
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
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}

export default Notes