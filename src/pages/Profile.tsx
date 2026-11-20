import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useProfile } from '../lib/useProfile'
import { colorOf } from '../lib/pool'
import type { AppCtx } from '../lib/useCommunity'

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9cbd0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9z" />
    </svg>
  )
}
function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9cbd0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" />
    </svg>
  )
}
function PeopleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9cbd0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17.5" cy="9" r="2.7" /><path d="M15 13.2A5.2 5.2 0 0 1 21.5 18" />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9cbd0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" /><path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}
function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9cbd0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" /><path d="M9.3 9a2.7 2.7 0 1 1 3.9 2.4c-.9.5-1.2 1-1.2 1.9" /><circle cx="12" cy="17" r="0.3" fill="#c9cbd0" />
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" />
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b6e76" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

type Field = 'name' | 'room' | 'upi'

const FIELD_META: Record<Field, { label: string; placeholder: string; inputMode?: 'text' | 'email' }> = {
  name: { label: 'Your name', placeholder: 'e.g. Rahul Sharma' },
  room: { label: 'Room number', placeholder: 'e.g. 204' },
  upi: { label: 'UPI ID (hosts receive pool payments here)', placeholder: 'yourname@okaxis', inputMode: 'email' },
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

export default function Profile() {
  const { user } = useAuth()
  const { community } = useOutletContext<AppCtx>()
  const { profile, loading, saveName, saveRoom, saveUpi } = useProfile(user?.id)
  const [notifOn, setNotifOn] = useState(true) // visual-only, not persisted

  const [editing, setEditing] = useState<Field | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Real stats from completed pools (user_trust RPC); shows "—" until loaded or if unavailable
  const [stats, setStats] = useState<{ saved: number; pools: number } | null>(null)
  useEffect(() => {
    if (!user?.id) return
    let live = true
    supabase.rpc('user_trust', { p_user_id: user.id }).then(({ data, error }) => {
      if (!live || error || !data) return
      const d = data as { saved_est?: number; pools_joined?: number }
      setStats({ saved: Number(d.saved_est ?? 0), pools: Number(d.pools_joined ?? 0) })
    })
    return () => { live = false }
  }, [user?.id])

  const name = profile?.display_name || user?.email?.split('@')[0] || 'Member'
  const roomLine = community?.name
    ? `${community.name}${profile?.room_no ? `, Room ${profile.room_no}` : ''}`
    : 'Join a hostel to see this'

  function startEdit(f: Field) {
    setMsg(null)
    setEditing(f)
    setDraft(
      f === 'name' ? (profile?.display_name ?? '')
        : f === 'room' ? (profile?.room_no ?? '')
        : (profile?.default_upi_id ?? ''),
    )
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    setMsg(null)
    const err =
      editing === 'name' ? await saveName(draft)
        : editing === 'room' ? await saveRoom(draft)
        : await saveUpi(draft)
    setSaving(false)
    if (err) setMsg({ ok: false, text: err })
    else { setMsg({ ok: true, text: 'Saved' }); setEditing(null) }
  }

  const rowProps = (f: Field) => ({
    role: 'button' as const,
    tabIndex: 0,
    style: { cursor: 'pointer' },
    onClick: () => startEdit(f),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') startEdit(f) },
  })

  return (
    <div style={{ paddingTop: 20, paddingBottom: 16 }}>
      <div className="profile-head">
        {profile?.avatar_url ? (
          <img className="profile-avatar" src={profile.avatar_url} alt="" />
        ) : (
          <div className="profile-avatar fallback" style={{ background: colorOf(user?.id ?? 'x') }}>
            {name[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <div className="profile-name">{loading ? '…' : name}</div>
          <div className="profile-sub"><PinIcon /> {roomLine}</div>
          <button className="textbtn" style={{ width: 'auto', minHeight: 0, padding: 0, marginTop: 4, textAlign: 'left' }} onClick={() => startEdit('name')}>Edit name</button>
        </div>
      </div>

      <div className="stats-box">
        <div className="stat">
          <div className="stat-num save">{stats ? inr(stats.saved) : '—'}</div>
          <div className="stat-label">Total Delivery Charges Saved</div>
        </div>
        <div className="stats-divider" />
        <div className="stat">
          <div className="stat-num">{stats ? stats.pools : '—'}</div>
          <div className="stat-label">Pools Joined</div>
        </div>
      </div>

      <div className="setting-list">
        <div className="setting-row" {...rowProps('room')}>
          <span className="setting-icon"><HomeIcon /></span>
          <span className="setting-text">Hostel & Room Address</span>
          <span className="setting-value">
            {profile?.room_no ? `${community?.name ?? ''}, Room ${profile.room_no}` : (community?.name ? `${community.name} • Add room` : '—')}
          </span>
          <ChevronIcon />
        </div>
        <div className="setting-row" {...rowProps('upi')}>
          <span className="setting-icon"><CardIcon /></span>
          <span className="setting-text">Payment Methods</span>
          <span className="setting-value">{profile?.default_upi_id ? profile.default_upi_id : 'Add UPI ID'}</span>
          <ChevronIcon />
        </div>
        <div className="setting-row">
          <span className="setting-icon"><PeopleIcon /></span>
          <span className="setting-text">Pool Preferences</span>
          <span className="setting-value">Coming soon</span>
          <ChevronIcon />
        </div>
        <div className="setting-row">
          <span className="setting-icon"><BellIcon /></span>
          <span className="setting-text">Notification Settings</span>
          <button
            className={`toggle ${notifOn ? 'on' : ''}`}
            onClick={() => setNotifOn((v) => !v)}
            aria-label="Toggle notifications"
          >
            <span className="toggle-knob" />
          </button>
        </div>
        <div className="setting-row">
          <span className="setting-icon"><HelpIcon /></span>
          <span className="setting-text">Help & Support</span>
          <ChevronIcon />
        </div>
      </div>

      {editing && (
        <div className="pay-card" style={{ marginTop: 16 }}>
          <label className="item-label">{FIELD_META[editing].label}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="item-input"
              autoFocus
              inputMode={FIELD_META[editing].inputMode}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save() }}
              placeholder={FIELD_META[editing].placeholder}
            />
            <button className="cta-sm" style={{ width: 90, margin: 0 }} disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          <button className="textbtn" style={{ marginTop: 8 }} onClick={() => { setEditing(null); setMsg(null) }}>Cancel</button>
          {editing === 'room' && (
            <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              Your room is shown only to the host of a pool you join, at handover time.
            </p>
          )}
        </div>
      )}

      {msg && <p className={msg.ok ? 'muted' : 'error'} style={{ marginTop: 12 }}>{msg.text}</p>}

      <button className="logout-btn" onClick={() => supabase.auth.signOut()}>
        <LogoutIcon /> Log Out
      </button>
    </div>
  )
}
