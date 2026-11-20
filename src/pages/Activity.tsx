import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AppCtx } from '../lib/useCommunity'
import { useAuth } from '../auth/AuthProvider'
import { useActivity } from '../lib/useActivity'
import { platformOf } from '../lib/platforms'
import { profOf, colorOf } from '../lib/pool'
import { supabase } from '../lib/supabase'
import PlatformLogo from '../components/PlatformLogo'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6M20 4L10 14M6 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1" />
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}
function WalletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" />
    </svg>
  )
}

const hostWording = (msg: string) => msg.replace(/captain/gi, (m) => (m[0] === 'C' ? 'Host' : 'host'))

// Estimated delivery-fee saving for one member of a pool
function savedOf(o: {
  delivery_fee: number
  est_cart_value: number
  free_delivery_threshold: number | null
  group_order_participants?: unknown[]
}) {
  const count = Math.max(1, o.group_order_participants?.length ?? 1)
  const free = !!o.free_delivery_threshold && o.est_cart_value >= o.free_delivery_threshold
  const perFee = free ? 0 : Math.ceil(o.delivery_fee / count)
  return Math.max(0, o.delivery_fee - perFee)
}

export default function Activity() {
  const { community } = useOutletContext<AppCtx>()
  const { user } = useAuth()
  const { ongoing, past, loading, reload } = useActivity(community?.id, user?.id)
  const [tab, setTab] = useState<'ongoing' | 'past'>('ongoing')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function advanceOrder(orderId: string, newStatus: string) {
    setBusyId(orderId)
    setErr(null)
    const { error } = await supabase.rpc('captain_advance_status', {
      p_order_id: orderId,
      p_new_status: newStatus,
    })
    setBusyId(null)
    if (error) setErr(hostWording(error.message))
    else reload()
  }

  return (
    <div style={{ paddingTop: 4, paddingBottom: 8 }}>
      <h2 className="ap-title">Activity</h2>

      <div className="act-tabs">
        <button className={`act-tab ${tab === 'ongoing' ? 'on' : ''}`} onClick={() => setTab('ongoing')}>
          Ongoing ({ongoing.length})
        </button>
        <button className={`act-tab ${tab === 'past' ? 'on' : ''}`} onClick={() => setTab('past')}>
          Past Pools ({past.length})
        </button>
      </div>

      {err && <p className="error" style={{ marginBottom: 12 }}>{err}</p>}
      {loading && <p className="muted" style={{ padding: 12 }}>Loading…</p>}

      {!loading && tab === 'ongoing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ongoing.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <p className="muted">Abhi koi ongoing pool nahi hai.</p>
            </div>
          )}

          {ongoing.map((o) => {
            const plat = platformOf(o.platform)
            const isHost = user?.id === o.creator_id
            const parts = o.group_order_participants ?? []
            const extra = Math.max(0, parts.length - 4)
            const saved = savedOf(o)

            const isPlaced = ['placed', 'out_for_delivery', 'received', 'distributed'].includes(o.status)
            const isOfd = ['out_for_delivery', 'received', 'distributed'].includes(o.status)
            const isArrived = ['received', 'distributed'].includes(o.status)

            return (
              <div key={o.id} className="card live-pool">
                <div className="live-head">
                  <span className="live-dot" />
                  <span className="live-label">{isHost ? 'HOSTING POOL' : 'LIVE ORDER POOL'}</span>
                  <span className="live-sep">|</span>
                  <span className="live-platform">{plat.name}</span>
                  <Link to={`/pool/${o.id}`} className="live-link" aria-label="Open pool room"><ExternalIcon /></Link>
                </div>

                <h3 className="live-title">{o.title || `${plat.name} Pool #${o.id.slice(0, 4).toUpperCase()}`}</h3>

                <div className="avatars">
                  {parts.slice(0, 4).map((m) => {
                    const prof = profOf(m as any)
                    return prof?.avatar_url ? (
                      <img key={m.user_id} className="avatar" src={prof.avatar_url} alt="" />
                    ) : (
                      <span key={m.user_id} className="avatar" style={{ background: colorOf(m.user_id) }}>
                        {(prof?.display_name?.[0] ?? '?').toUpperCase()}
                      </span>
                    )
                  })}
                  {extra > 0 && <span className="avatar more">+{extra}</span>}
                </div>

                <ol className="timeline">
                  <li className={`tl-step ${isPlaced ? 'done' : 'active'}`}>
                    <span className="tl-dot">{isPlaced ? <CheckIcon /> : <span className="tl-pip" />}</span>
                    <div className="tl-text">
                      <div className="tl-title">{isPlaced ? 'Pool Locked & Order Placed' : 'Pool Locked • Order being placed'}</div>
                    </div>
                  </li>
                  <li className={`tl-step ${isArrived ? 'done' : isOfd ? 'active' : 'pending'}`}>
                    <span className="tl-dot">{isArrived ? <CheckIcon /> : isOfd ? <span className="tl-pip" /> : null}</span>
                    <div className="tl-text">
                      <div className="tl-title">Out for Delivery by {plat.name} rider</div>
                    </div>
                  </li>
                  <li className={`tl-step ${isArrived ? 'active' : 'pending'}`}>
                    <span className="tl-dot">{isArrived ? <span className="tl-pip" /> : null}</span>
                    <div className="tl-text">
                      <div className="tl-title">Arriving at {community?.name ?? 'Hostel'} Main Gate</div>
                    </div>
                  </li>
                </ol>

                <hr className="live-hr" />
                <div className="live-fee">
                  <WalletIcon />
                  <span>
                    Your split: ₹{o.my_share_amount ?? 0} • You saved <b className="save">₹{saved}</b> on delivery fee
                  </span>
                </div>

                {isHost ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {(o.status === 'locked' || o.status === 'ordering') && (
                      <Link to={`/pool/${o.id}`} className="cta-sm">
                        {o.status === 'locked' ? 'Open Command Center →' : 'Open Cart to Build →'}
                      </Link>
                    )}
                    {o.status === 'placed' && (
                      <button className="cta-sm" disabled={busyId === o.id} onClick={() => advanceOrder(o.id, 'out_for_delivery')}>
                        {busyId === o.id ? 'Updating…' : 'Mark Out for Delivery'}
                      </button>
                    )}
                    {o.status === 'out_for_delivery' && (
                      <button className="cta-sm" disabled={busyId === o.id} onClick={() => advanceOrder(o.id, 'received')}>
                        {busyId === o.id ? 'Updating…' : 'Order Arrived'}
                      </button>
                    )}
                    {o.status === 'received' && (
                      <Link to={`/pool/${o.id}`} className="cta-sm">
                        Start Smart Handover (PIN) →
                      </Link>
                    )}
                  </div>
                ) : (
                  <Link to={`/pool/${o.id}`} className="cta-sm outline" style={{ marginTop: 10 }}>
                    View Items & Code
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && tab === 'past' && (
        <div className="done-list" style={{ marginTop: 4 }}>
          {past.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <p className="muted">Abhi koi completed pool nahi hai.</p>
            </div>
          )}
          {past.map((o) => {
            const plat = platformOf(o.platform)
            return (
              <Link key={o.id} to={`/pool/${o.id}`} className="done-pool">
                <PlatformLogo p={plat} kind="card" />
                <div className="done-text">
                  <div className="done-when">{o.title || `${plat.name} Pool`}</div>
                  <div className="done-saved">Saved ₹{savedOf(o)}</div>
                </div>
                <span className="done-badge"><CheckIcon /> Delivered</span>
                <ChevronIcon />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
