import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import type { AppCtx } from '../lib/useCommunity'
import { useAuth } from '../auth/AuthProvider'
import { useOrderRoom } from '../lib/useOrderRoom'
import { profOf, colorOf, fmtLeft } from '../lib/pool'
import { platformOf } from '../lib/platforms'
import { supabase } from '../lib/supabase'
import PlatformLogo from '../components/PlatformLogo'
import AddItemsModal from '../components/AddItemsModal'
import InviteSheet from '../components/InviteSheet'

function parseItems(text: string): { name: string; price: number; qty: number }[] {
  try { const v = JSON.parse(text || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
const itemsTotal = (items: { price: number; qty: number }[]) => items.reduce((s, it) => s + it.price * it.qty, 0)

// Server messages say "captain" (DB naming); users should see "host"
const hostWording = (msg: string) => msg.replace(/captain/gi, (m) => (m[0] === 'C' ? 'Host' : 'host'))

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9cbd0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 19l-7-7 7-7" />
    </svg>
  )
}
function ShareIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#c9cbd0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
      <path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4" />
    </svg>
  )
}

export default function PoolRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { community } = useOutletContext<AppCtx>()
  const { user } = useAuth()
  const { order, participants, captainUpi: hostUpi, loading, notFound, reload } = useOrderRoom(id)

  const [now, setNow] = useState(Date.now())
  const [showItems, setShowItems] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [upiInput, setUpiInput] = useState('')
  const [feeInput, setFeeInput] = useState('')
  const [thrInput, setThrInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <p className="muted" style={{ padding: 16 }}>Loading…</p>
  if (notFound || !order) return (
    <div style={{ paddingTop: 24 }}>
      <p className="muted">Ye pool mil nahi raha.</p>
      <button className="textbtn" onClick={() => navigate('/pools')}>Active Pools pe wapas jao</button>
    </div>
  )

  const plat = platformOf(order.platform)
  const isHost = user?.id === order.creator_id
  const me = participants.find((p) => p.user_id === user?.id)
  const myItems = me ? parseItems(me.items_text) : []
  const count = Math.max(1, participants.length)
  const freeNow = !!order.free_delivery_threshold && order.est_cart_value >= order.free_delivery_threshold
  const perPersonFee = freeNow ? 0 : Math.ceil(order.delivery_fee / count)
  const savedEst = Math.max(0, order.delivery_fee - perPersonFee)
  const moreForFree = order.free_delivery_threshold ? Math.max(0, order.free_delivery_threshold - order.est_cart_value) : 0
  const pct = order.max_members ? Math.min(100, (participants.length / order.max_members) * 100) : 100
  const msLeft = new Date(order.window_end).getTime() - now
  const hostProf = profOf({ user_id: order.creator_id, profiles: participants.find((p) => p.user_id === order.creator_id)?.profiles } as any)
  const hostName = hostProf?.display_name ?? 'Host'
  // Money the host should collect from other members (their shares)
  const collectTotal = participants.filter((p) => p.user_id !== order.creator_id).reduce((s, p) => s + p.share_amount, 0)

  // Run an RPC, show its error text if it fails, reload on success
  async function run(fn: string, args: Record<string, unknown>) {
    setBusy(true)
    setErr(null)
    const { error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) { setErr(hostWording(error.message)); return false }
    reload()
    return true
  }

  const joinPool = () => run('join_order', { p_order_id: order.id })
  const leavePool = () => run('leave_order', { p_order_id: order.id })
  const iHavePaid = () => run('mark_paid', { p_order_id: order.id })
  const confirmPayment = (uid: string) => run('captain_confirm_payment', { p_order_id: order.id, p_user_id: uid })
  const advance = (status: string) => run('captain_advance_status', { p_order_id: order.id, p_new_status: status })

  function payNow() {
    if (!hostUpi || !me) return
    const url = `upi://pay?pa=${encodeURIComponent(hostUpi)}&pn=${encodeURIComponent(hostName)}&am=${me.share_amount}&cu=INR&tn=${encodeURIComponent('KartMeto pool ' + order!.id.slice(0, 6))}`
    window.location.href = url
  }
  async function saveUpi() {
    if (!upiInput.trim()) return
    setErr(null)
    const { error } = await supabase.from('captains').update({ upi_id: upiInput.trim() }).eq('order_request_id', order!.id)
    if (error) { setErr(hostWording(error.message)); return }
    reload()
  }
  async function saveFee() {
    const fee = Number(feeInput || order!.delivery_fee)
    const thr = Number(thrInput || order!.free_delivery_threshold || 0)
    if (Number.isNaN(fee) || Number.isNaN(thr)) { setErr('Amount sahi daalo'); return }
    if (await run('set_order_fee', { p_order_id: order!.id, p_fee: fee, p_threshold: thr })) {
      setFeeInput(''); setThrInput('')
    }
  }

  // "locked" aur "ordering" dono collection/preparation states hain — banner in dono me dikhna chahiye
  const lockedOrPlaced = ['locked', 'ordering', 'placed'].includes(order.status)
  const ofd = order.status === 'out_for_delivery'
  const doneStates = ['received', 'distributed', 'completed'].includes(order.status)

  // Payment block for a member (never shown to the host)
  const memberPayBlock = (btnLabel: string) => (
    <>
      {me?.payment_status === 'unpaid' && (
        <>
          <button className="cta" style={{ marginTop: 10 }} onClick={payNow}>{btnLabel}</button>
          <button className="cta-sm outline" style={{ marginTop: 8 }} disabled={busy} onClick={iHavePaid}>I Have Paid</button>
        </>
      )}
      {me?.payment_status === 'marked_paid' && <div className="pay-badge wait">Waiting for host to confirm…</div>}
      {me?.payment_status === 'confirmed' && <div className="pay-badge ok">✓ Payment confirmed</div>}
    </>
  )

  return (
    <div style={{ paddingTop: 16, paddingBottom: 120 }}>
      <div className="room-topbar">
        <button className="room-back" onClick={() => navigate('/pools')}><BackIcon /></button>
        <span className="room-title">{plat.name} Pool #{order.id.slice(0, 4).toUpperCase()}</span>
        <button className="room-back" onClick={() => setShowInvite(true)}><ShareIcon /></button>
      </div>

      <div className="room-card">
        <div className="room-card-head">
          <PlatformLogo p={plat} kind="card" />
          <div style={{ flex: 1 }}>
            <div className="room-card-title">{order.title || `${community?.name ?? ''} Common Order`}</div>
            <div className="muted" style={{ fontSize: 13 }}>Hosted by {hostName}</div>
          </div>
          {!doneStates && !ofd && (
            <div className="room-timer">⏱ {msLeft > 0 ? fmtLeft(msLeft) : '00:00'} left</div>
          )}
        </div>

        {order.status === 'open' && (
          <>
            <div className="fee-line">
              Est. delivery share: <b className="save">₹{perPersonFee}</b> <span className="muted">(Base fee ₹{order.delivery_fee})</span>
            </div>
            {savedEst > 0 && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>You save about ₹{savedEst} vs ordering alone (estimate)</div>}
            {order.free_delivery_threshold ? (
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {freeNow ? 'Cart is above the free-delivery limit' : `₹${moreForFree} more in the cart to reach the free-delivery limit`}
              </div>
            ) : null}
            <div className="bar" style={{ marginTop: 8 }}><div style={{ width: `${pct}%` }} /></div>
            <div className="joined-line">{participants.length}{order.max_members ? `/${order.max_members}` : ''} people joined</div>
            {msLeft <= 0 && <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>Timer khatam. Ab naye join/items band hain, Host order lock kar sakta hai.</div>}
          </>
        )}

        {order.status === 'locked' && (
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Pool locked hai. Members payment kar rahe hain — jab sab confirm ho jayein, host order place karega.
          </div>
        )}

        {order.status === 'ordering' && (
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Sab payments confirm ho gayi hain. Host abhi {plat.name} app mein order place kar raha hai.
          </div>
        )}

        {lockedOrPlaced && order.status === 'placed' && (
          <div className="locked-banner">
            <span className="lb-check">✓</span>
            <div>
              <div className="lb-title">Pool Locked & Order Placed!</div>
              <div className="muted" style={{ fontSize: 13 }}>{hostName} has placed the {plat.name} order.</div>
            </div>
          </div>
        )}

        {ofd && (
          <ol className="timeline" style={{ marginTop: 14 }}>
            <li className="tl-step done"><span className="tl-dot">✓</span><div className="tl-text"><div className="tl-title">Pool Locked & Order Placed</div></div></li>
            <li className="tl-step active"><span className="tl-dot"><span className="tl-pip" /></span><div className="tl-text"><div className="tl-title">Out for Delivery by {plat.name} rider</div></div></li>
            <li className="tl-step pending"><span className="tl-dot" /><div className="tl-text"><div className="tl-title">Arriving at Hostel Main Gate</div></div></li>
          </ol>
        )}

        {doneStates && (
          <div className="locked-banner">
            <span className="lb-check">✓</span>
            <div className="lb-title">Delivered</div>
          </div>
        )}
      </div>

      {err && <p className="error" style={{ marginTop: 12 }}>{err}</p>}

      {order.status === 'open' && (
        <>
          <div className="avatars" style={{ margin: '18px 0 4px' }}>
            {participants.slice(0, 5).map((p) => {
              const prof = profOf(p)
              return (
                <div key={p.user_id} style={{ textAlign: 'center' }}>
                  {prof?.avatar_url ? (
                    <img className="avatar" src={prof.avatar_url} alt="" />
                  ) : (
                    <span className="avatar" style={{ background: colorOf(p.user_id) }}>{(prof?.display_name?.[0] ?? '?').toUpperCase()}</span>
                  )}
                  <div className="avatar-name">{prof?.display_name?.split(' ')[0] ?? 'Member'}</div>
                </div>
              )
            })}
          </div>

          <h3 className="sec">Items in this pool</h3>
          <div className="plist">
            {participants.filter((p) => p.user_id !== user?.id).map((p) => {
              const items = parseItems(p.items_text)
              if (items.length === 0) return null
              const prof = profOf(p)
              return (
                <div key={p.user_id} className="plist-row">
                  {prof?.avatar_url ? <img className="plist-avatar" src={prof.avatar_url} alt="" /> : <span className="plist-avatar" style={{ background: colorOf(p.user_id) }}>{(prof?.display_name?.[0] ?? '?').toUpperCase()}</span>}
                  <span><b>{prof?.display_name?.split(' ')[0] ?? 'Member'}:</b> {items.map((i) => i.name).join(', ')} (₹{itemsTotal(items)})</span>
                </div>
              )
            })}
            {participants.filter((p) => p.user_id !== user?.id).every((p) => parseItems(p.items_text).length === 0) && (
              <p className="muted">Abhi tak kisi ne items add nahi kiye.</p>
            )}
          </div>

          <h3 className="sec">Your Items for this pool</h3>
          {!me && <button className="cta" disabled={busy || msLeft <= 0} onClick={joinPool}>{busy ? 'Joining…' : 'Join Pool'}</button>}

          {me && myItems.length === 0 && (
            <button className="add-item-btn" style={{ margin: 0 }} onClick={() => setShowItems(true)}>+ Add your items from {plat.name}</button>
          )}

          {me && myItems.length > 0 && (
            <>
              <div className="order-summary">
                {myItems.map((it, i) => (
                  <div className="sum-row" key={i}><span>{it.name} x{it.qty}</span><b>₹{it.price * it.qty}</b></div>
                ))}
                <hr className="live-hr" style={{ margin: '10px 0' }} />
                <div className="sum-row"><span>Your Items Total</span><b>₹{itemsTotal(myItems)}</b></div>
                <div className="sum-row"><span>Your Split Delivery Fee (est.)</span><b>₹{me.share_amount - itemsTotal(myItems)}</b></div>
                <div className="sum-row" style={{ fontSize: 16 }}><span>Total</span><b className="save">₹{me.share_amount}</b></div>
              </div>
              <button className="cta-sm outline" style={{ marginTop: 10 }} onClick={() => setShowItems(true)}>Edit items</button>

              {isHost ? (
                <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
                  Aap host ho, to apna hissa (₹{me.share_amount}) aap seedha {plat.name} app mein pay karoge. Yahan pay karne ki zaroorat nahi.
                </p>
              ) : hostUpi ? (
                <div className="pay-card">
                  <div className="pay-title">Pay to Host</div>
                  {memberPayBlock(`Pay ₹${me.share_amount} via UPI`)}
                </div>
              ) : (
                <p className="muted" style={{ marginTop: 10 }}>Host ka UPI ID abhi set nahi hua.</p>
              )}
            </>
          )}

          {me && !isHost && me.payment_status === 'unpaid' && (
            <button className="textbtn" style={{ marginTop: 14 }} disabled={busy} onClick={leavePool}>Leave Pool</button>
          )}
        </>
      )}

      {(lockedOrPlaced || ofd) && me && myItems.length > 0 && (
        <div className="pay-card" style={{ marginTop: 16 }}>
          <div className="pay-title">Bill & Split Breakdown</div>
          <div className="sum-row"><span>Your Share</span><b>₹{itemsTotal(myItems)} (Items) + ₹{me.share_amount - itemsTotal(myItems)} (Delivery)</b></div>
          <div className="sum-row" style={{ fontSize: 16 }}><span>Total</span><b className="save">₹{me.share_amount}</b></div>
          {isHost ? (
            <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
              Aap host ho, apna hissa seedha {plat.name} app mein pay karo.
            </p>
          ) : hostUpi ? (
            memberPayBlock(`Pay ₹${me.share_amount} to Host`)
          ) : null}
        </div>
      )}

      {isHost && (
        <div className="capt-panel">
          <div className="capt-head">Host Panel</div>

          {!hostUpi && (
            <div style={{ marginBottom: 14 }}>
              <label className="item-label">Set your UPI ID to receive payments</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="item-input" value={upiInput} onChange={(e) => setUpiInput(e.target.value)} placeholder="yourname@okaxis" />
                <button className="cta-sm" style={{ width: 90, margin: 0 }} onClick={saveUpi}>Save</button>
              </div>
            </div>
          )}

          {order.status === 'open' && (
            <div style={{ marginBottom: 14 }}>
              <label className="item-label">Delivery fee and free-delivery limit (₹)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="item-input" inputMode="numeric" value={feeInput} onChange={(e) => setFeeInput(e.target.value)} placeholder={`Fee ${order.delivery_fee}`} />
                <input className="item-input" inputMode="numeric" value={thrInput} onChange={(e) => setThrInput(e.target.value)} placeholder={`Limit ${order.free_delivery_threshold ?? 0}`} />
                <button className="cta-sm" style={{ width: 90, margin: 0 }} disabled={busy} onClick={saveFee}>Set</button>
              </div>
            </div>
          )}

          <div className="sum-row" style={{ marginBottom: 8 }}>
            <span>Collect from members</span><b className="save">₹{collectTotal}</b>
          </div>

          {participants.map((p) => {
            const prof = profOf(p)
            const isHostRow = p.user_id === order.creator_id
            return (
              <div key={p.user_id} className="capt-row">
                <span>{isHostRow ? `${prof?.display_name ?? 'You'} (You, Host)` : (prof?.display_name ?? 'Member')}</span>
                {isHostRow
                  ? <span className="pay-chip confirmed">host</span>
                  : <span className={`pay-chip ${p.payment_status}`}>{p.payment_status}</span>}
                {!isHostRow && p.payment_status === 'marked_paid' && (
                  <button className="confirm-btn" onClick={() => confirmPayment(p.user_id)}>Confirm</button>
                )}
              </div>
            )
          })}

          {/* open -> locked: pool lock karo, members se payment collection shuru */}
          {order.status === 'open' && (
            <button className="cta" style={{ marginTop: 14 }} disabled={busy} onClick={() => advance('locked')}>
              Lock Pool (Start Collecting Payments)
            </button>
          )}

          {/* locked -> ordering: sab members ka payment confirmed hone ke baad hi ye allowed hoga (DB check karta hai) */}
          {order.status === 'locked' && (
            <button className="cta" style={{ marginTop: 14 }} disabled={busy} onClick={() => advance('ordering')}>
              Start Ordering
            </button>
          )}

          {/* ordering -> placed: host ne actual {plat.name} app mein order place kar diya */}
          {order.status === 'ordering' && (
            <button className="cta" style={{ marginTop: 14 }} disabled={busy} onClick={() => advance('placed')}>
              Mark Order Placed
            </button>
          )}

          {order.status === 'placed' && <button className="cta" style={{ marginTop: 14 }} disabled={busy} onClick={() => advance('out_for_delivery')}>Mark Out for Delivery</button>}
          {order.status === 'out_for_delivery' && <button className="cta" style={{ marginTop: 14 }} disabled={busy} onClick={() => advance('received')}>Order Arrived</button>}
          {order.status === 'received' && <button className="cta" style={{ marginTop: 14 }} disabled={busy} onClick={() => advance('completed')}>Mark Completed</button>}
        </div>
      )}

      {showItems && order && (
        <AddItemsModal orderId={order.id} platformName={plat.name} communityName={community?.name ?? ''} onClose={() => setShowItems(false)} onDone={() => { setShowItems(false); reload() }} />
      )}
      {showInvite && order && (
        <InviteSheet orderId={order.id} platformName={plat.name} communityName={community?.name ?? ''} onClose={() => setShowInvite(false)} />
      )}
    </div>
  )
}
