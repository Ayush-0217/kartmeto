import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { PLATFORMS, platformOf } from '../lib/platforms'
import { useNow } from '../lib/useNow'
import { usePools } from '../lib/usePools'
import { feeInfo, fmtLeft } from '../lib/pool'
import { useAuth } from '../auth/AuthProvider'
import Avatar from '../components/Avatar'
import PlatformLogo from '../components/PlatformLogo'
import type { AppCtx } from '../lib/useCommunity'

export default function Home() {
  const { community } = useOutletContext<AppCtx>()
  const { user } = useAuth()
  const nav = useNavigate()
  const now = useNow()
  const { pools, loading } = usePools(community?.id)
  const [q, setQ] = useState('')
  const live = pools.filter((p) => new Date(p.window_end).getTime() > now)
  const top = live.slice(0, 2) // usePools sorts most-joined first

  function search(e: FormEvent) {
    e.preventDefault()
    const text = q.trim()
    nav(text ? `/pools?q=${encodeURIComponent(text)}` : '/pools')
  }

  return (
    <>
      <form className="search" onSubmit={search} role="search">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7.5" /><path d="M21 21l-4.3-4.3" /></svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search pools, stores, or items…"
          aria-label="Search pools"
          style={{ flex: 1, minWidth: 0, width: 'auto', minHeight: 0, height: '100%', margin: 0, padding: 0, borderRadius: 0, background: 'transparent', border: 0, outline: 0, color: 'var(--fg)', font: 'inherit' }}
        />
      </form>

      <h3 className="sec">
        Active Pools Near You ({live.length})
        {live.length > 2 && (
          <Link to="/pools" className="textbtn" style={{ float: 'right', width: 'auto', minHeight: 0, margin: 0, fontSize: 13 }}>See all →</Link>
        )}
      </h3>
      {loading ? <p className="muted">Loading…</p> : live.length === 0 ? (
        <div className="card muted">No active pools right now. Start one from a store below.</div>
      ) : (
        <div className="pools">
          {top.map((p) => {
            const pf = platformOf(p.platform)
            const members = [...(p.group_order_participants ?? [])].sort((a, b) => (a.joined_at ?? '').localeCompare(b.joined_at ?? ''))
            const mine = members.some((m) => m.user_id === user?.id)
            const thr = p.free_delivery_threshold
            const pct = thr ? Math.min(100, Math.round((p.est_cart_value / thr) * 100)) : 0
            const fi = feeInfo(p, members.length)
            return (
              <div className="pool" key={p.id}>
                <div className="pool-mark"><PlatformLogo p={pf} kind="wordmark" /></div>
                <div className="pool-title">
                  {p.platform} • <span className="ending">Ending in {fmtLeft(new Date(p.window_end).getTime() - now)}</span>
                </div>
                <div className="avatars">
                  {members.slice(0, 3).map((m) => <Avatar key={m.user_id} m={m} />)}
                  {members.length > 3 && <span className="avatar more">+{members.length - 3}</span>}
                </div>
                <div className="fee">{p.delivery_fee > 0 ? `₹${fi.perPerson} delivery fee` : 'Delivery fee not set'}</div>
                <div className="bar"><div style={{ width: `${pct}%` }} /></div>
                <button className="cta-sm" onClick={() => nav(`/pool/${p.id}`)}>{mine ? 'Open Pool' : 'Join & Save'}</button>
              </div>
            )
          })}
        </div>
      )}

      <h3 className="sec">Order Together From</h3>
      <div className="tiles">
        {PLATFORMS.map((t) => {
          const n = live.filter((p) => platformOf(p.platform).name === t.name).length
          return (
            <Link key={t.name} className="tile" to={`/create?platform=${encodeURIComponent(t.name)}`}>
              <span className="tile-text">
                <b>{t.name}</b>
                <span className="count">{n} active {n === 1 ? 'pool' : 'pools'}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
