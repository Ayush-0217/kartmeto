import { useState } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import type { AppCtx } from '../lib/useCommunity'
import { useAuth } from '../auth/AuthProvider'
import { useProfile } from '../lib/useProfile'
import { supabase } from '../lib/supabase'
import { PLATFORMS, platformOf } from '../lib/platforms'
import PlatformLogo from '../components/PlatformLogo'
import InviteSheet from '../components/InviteSheet'

const TIMERS = [5, 10, 15]
const MEMBER_OPTS = [3, 5, 0] // 0 = no limit

// Placeholder defaults: mockup has no fee inputs (the host can change them in the pool room while it is open)
const DEFAULT_DELIVERY_FEE = 40
const DEFAULT_FREE_THRESHOLD = 199

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}
function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 9l7 7 7-7" />
    </svg>
  )
}
function CrownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" />
      <path d="M5 18h14" />
    </svg>
  )
}

export default function CreateOrder() {
  const { community } = useOutletContext<AppCtx>()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // Accept either the platform name or its chip label; fall back to the first store
  const qp = params.get('platform')
  const [platform, setPlatform] = useState(
    PLATFORMS.find((p) => p.name === qp || p.chip === qp)?.name ?? PLATFORMS[0].name,
  )
  const [timer, setTimer] = useState(10)
  const [maxMembers, setMaxMembers] = useState(5)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newOrderId, setNewOrderId] = useState<string | null>(null)

  async function createPool() {
    if (!community?.id || !user?.id || saving || newOrderId) return
    setSaving(true)
    setError(null)
    const now = new Date()
    const end = new Date(now.getTime() + timer * 60000)
    const { data, error: insErr } = await supabase
      .from('order_requests')
      .insert({
        creator_id: user.id,
        community_id: community.id,
        platform,
        title: `${platform} Pool`,
        items: '',
        est_cart_value: 0,
        free_delivery_threshold: DEFAULT_FREE_THRESHOLD,
        delivery_fee: DEFAULT_DELIVERY_FEE,
        max_members: maxMembers || null, // null = no limit (needs max_members to be nullable, see 01_required.sql)
        window_start: now.toISOString(),
        window_end: end.toISOString(),
        status: 'open',
      })
      .select('id')
      .single()
    setSaving(false)
    if (insErr) { setError(insErr.message); return }
    setNewOrderId(data.id)
  }

  return (
    <div style={{ paddingTop: 4 }}>
      <div className="create-topbar">
        <button className="create-cancel" onClick={() => navigate(-1)}>Cancel</button>
        <span className="create-title">Start a Pool</span>
        <span style={{ width: 48 }} />
      </div>

      <label className="form-label" style={{ marginTop: 20 }}>Select Store</label>
      <div className="store-grid">
        {PLATFORMS.map((p) => (
          <button key={p.name} className={`store-opt ${platform === p.name ? 'on' : ''}`} onClick={() => setPlatform(p.name)}>
            <PlatformLogo p={p} kind="tile" />
            <span>{p.chip}</span>
          </button>
        ))}
      </div>

      <label className="form-label" style={{ marginTop: 22 }}>Delivery Location</label>
      <div className="loc-row">
        <PinIcon />
        <span style={{ flex: 1 }}>{community?.name ?? '—'}{profile?.room_no ? `, Room ${profile.room_no}` : ''}</span>
        <ChevronDownIcon />
      </div>

      <label className="form-label" style={{ marginTop: 22 }}>Timer Duration</label>
      <div className="chip-opts">
        {TIMERS.map((t) => (
          <button key={t} className={`chip-opt ${timer === t ? 'on' : ''}`} onClick={() => setTimer(t)}>{t} Mins</button>
        ))}
      </div>

      <label className="form-label" style={{ marginTop: 18 }}>Max Members</label>
      <div className="chip-opts">
        {MEMBER_OPTS.map((m) => (
          <button key={m} className={`chip-opt ${maxMembers === m ? 'on' : ''}`} onClick={() => setMaxMembers(m)}>
            {m === 0 ? 'No Limit' : `${m} People`}
          </button>
        ))}
      </div>

      <div className="host-perk">
        <CrownIcon />
        <span>Host Perk: Get priority free delivery slot as the pool creator!</span>
      </div>

      {error && <p className="error" style={{ marginTop: 14 }}>{error}</p>}

      <button className="cta" style={{ marginTop: 20 }} disabled={saving} onClick={createPool}>
        {saving ? 'Creating…' : 'Create Pool & Share Link'}
      </button>

      {newOrderId && (
        <InviteSheet
          orderId={newOrderId}
          platformName={platformOf(platform).name}
          communityName={community?.name ?? ''}
          onClose={() => navigate(`/pool/${newOrderId}`, { replace: true })}
        />
      )}
    </div>
  )
}
