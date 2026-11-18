import { useEffect, useState } from 'react'
import './host.css'

export type HostMember = {
  userId: string
  name: string
  avatarUrl?: string | null
  joinedAt?: string
  status: 'unpaid' | 'marked_paid' | 'confirmed'
  isHost?: boolean
}

type Props = {
  members: HostMember[]
  finalFee: number                 // delivery fee each joiner pays (estimate)
  saved: number | null             // estimated delivery saving, null = unknown
  threshold?: number | null        // free-delivery cart value
  cartTotal?: number               // current cart value (used for the "Smart Bump" notice)
  busyId?: string | null
  onRemove: (userId: string) => void
  onConfirm: (userId: string) => void
  onOpenProfile: (userId: string) => void
  onShare: () => void
  onCancelPool?: () => void
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308']
const colorOf = (id: string) => COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length]
const timeOf = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '')

export default function HostCommandCenter(p: Props) {
  const [armed, setArmed] = useState<string | null>(null)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(null), 3000)
    return () => clearTimeout(t)
  }, [armed])

  const short = p.threshold && p.cartTotal !== undefined && p.cartTotal < p.threshold ? Math.ceil(p.threshold - p.cartTotal) : 0

  return (
    <div className="hcc">
      <div className="hcc-title">
        <svg width="48" height="54" viewBox="0 0 24 28" fill="none" stroke="#f97810" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 1.5l9 3.5v7.2c0 6-4 10.6-9 13.3-5-2.7-9-7.3-9-13.3V5l9-3.5z" /><path d="M7.5 13l1.4-4.2 3.1 2.6 3.1-2.6 1.4 4.2z" fill="#f97810" /></svg>
        <div>
          <h2>Host Command Center</h2>
          <p>Manage your pool members and payments</p>
        </div>
      </div>

      <div className="hcc-stats">
        <div><b className="o"><svg width="22" height="22" viewBox="0 0 24 24" fill="#f97810"><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M2 19a6 6 0 0 1 12 0zM11 19a6 6 0 0 1 11 0z" /></svg>{p.members.length}</b><span>Total Members</span></div>
        <div><b className="o">₹{p.finalFee}</b><span>Final Fee</span></div>
        <div><b className="g"><svg width="22" height="22" viewBox="0 0 24 24" fill="#4ade80"><path d="M20 4C9 4 4 9 4 16c0 1.5.3 3 1 4 1-6 5-10 10-12-4 3-7 7-8 12 9 0 13-6 13-16z" /></svg>{p.saved === null ? '—' : `₹${p.saved}`}</b><span>Est. Saved</span></div>
      </div>

      {short > 0 && (
        <div className="hcc-bump">
          <b>Cart dropped below ₹{p.threshold}.</b>
          <span>Add items worth ₹{short} yourself to avoid the delivery fee{p.onCancelPool ? ', or cancel the pool.' : '.'}</span>
          {p.onCancelPool && <button onClick={p.onCancelPool}>Cancel Pool</button>}
        </div>
      )}

      <div className="hcc-list">
        {p.members.map((m) => (
          <div className="hcc-row" key={m.userId}>
            <button className="hcc-av" onClick={() => p.onOpenProfile(m.userId)} aria-label={`${m.name} profile`}>
              {m.avatarUrl ? <img src={m.avatarUrl} alt="" /> : <span style={{ background: colorOf(m.userId) }}>{(m.name[0] ?? '?').toUpperCase()}</span>}
            </button>
            <div className="hcc-who">
              <b>{m.name}</b>
              <small>Joined{m.joinedAt ? ` • ${timeOf(m.joinedAt)}` : ''}</small>
            </div>
            <div className="hcc-state">
              {m.isHost ? (
                <span className="chip-host">Host</span>
              ) : m.status === 'confirmed' ? (
                <span className="st paid"><i><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0e11" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></i>Paid</span>
              ) : m.status === 'marked_paid' ? (
                <>
                  <span className="st wait"><i><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0e11" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 1.5" /></svg></i>Awaiting</span>
                  <button className="hcc-btn green" disabled={p.busyId === m.userId} onClick={() => p.onConfirm(m.userId)}>Confirm Paid</button>
                </>
              ) : (
                <>
                  <span className="st unpaid"><i><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></i>Unpaid</span>
                  <button
                    className="hcc-btn"
                    disabled={p.busyId === m.userId}
                    onClick={() => (armed === m.userId ? (setArmed(null), p.onRemove(m.userId)) : setArmed(m.userId))}
                  >
                    {armed === m.userId ? 'Tap again to remove' : 'Remove User'}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="hcc-dock">
        <button className="hcc-share" onClick={p.onShare}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" /></svg>
          Share Pool Link
        </button>
      </div>
    </div>
  )
}