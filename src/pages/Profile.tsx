import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useProfile } from '../lib/useProfile'
import { colorOf } from '../lib/pool'
import type { AppCtx } from '../lib/useCommunity'

// ⚠️ Stats (saved amount, pools joined) are DUMMY for now — same approach as Activity.tsx.
// Real calculation will need a query over completed orders once we wire it up.

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

export default function Profile() {
  const { user } = useAuth()
  const { community } = useOutletContext<AppCtx>()
  const { profile, loading } = useProfile(user?.id)
  const [notifOn, setNotifOn] = useState(true) // visual-only, not persisted

  const name = profile?.display_name || user?.email?.split('@')[0] || 'Member'
  const roomLine = community?.name
    ? `${community.name}${profile?.room_no ? `, Room ${profile.room_no}` : ''}`
    : 'Join a hostel to see this'

  return (
    <div style={{ paddingTop: 20 }}>
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
        </div>
      </div>

      <div className="stats-box">
        <div className="stat">
          <div className="stat-num save">₹1,420</div>
          <div className="stat-label">Total Delivery Charges Saved</div>
        </div>
        <div className="stats-divider" />
        <div className="stat">
          <div className="stat-num">18</div>
          <div className="stat-label">Pools Joined</div>
        </div>
      </div>

      <div className="setting-list">
        <div className="setting-row">
          <span className="setting-icon"><HomeIcon /></span>
          <span className="setting-text">Hostel & Room Address</span>
          <span className="setting-value">{profile?.room_no ? `${community?.name ?? ''}, Room ${profile.room_no}` : community?.name ?? '—'}</span>
          <ChevronIcon />
        </div>
        <div className="setting-row">
          <span className="setting-icon"><CardIcon /></span>
          <span className="setting-text">Payment Methods</span>
          <span className="setting-value">UPI</span>
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

      <button className="logout-btn" onClick={() => supabase.auth.signOut()}>
        <LogoutIcon /> Log Out
      </button>
    </div>
  )
}
