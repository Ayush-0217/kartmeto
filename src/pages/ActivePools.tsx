import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { PLATFORMS, platformOf } from '../lib/platforms'
import { useNow } from '../lib/useNow'
import { usePools } from '../lib/usePools'
import { feeInfo, fmtLeft } from '../lib/pool'
import Avatar from '../components/Avatar'
import PlatformLogo from '../components/PlatformLogo'
import type { AppCtx } from '../lib/useCommunity'

export default function ActivePools() {
  const { community } = useOutletContext<AppCtx>()
  const nav = useNavigate()
  const now = useNow()
  const [filter, setFilter] = useState('All')
  const { pools, loading } = usePools(community?.id)

  const live = pools.filter((p) => new Date(p.window_end).getTime() > now)
  const chips = PLATFORMS
    .map((pf) => ({ pf, n: live.filter((p) => platformOf(p.platform).name === pf.name).length }))
    .filter((c) => c.n > 0)
  const active = chips.some((c) => c.pf.name === filter) ? filter : 'All'
  const shown = active === 'All' ? live : live.filter((p) => platformOf(p.platform).name === active)

  return (
    <>
      <h2 className="ap-title">Active Pools</h2>
      <p className="ap-sub">Live group orders in {community?.name}</p>

      <div className="chips">
        <button className={`chip ${active === 'All' ? 'on' : ''}`} onClick={() => setFilter('All')}>All Stores ({live.length})</button>
        {chips.map((c) => (
          <button key={c.pf.name} className={`chip ${active === c.pf.name ? 'on' : ''}`} onClick={() => setFilter(c.pf.name)}>
            {c.pf.chip} ({c.n})
          </button>
        ))}
      </div>

      {loading ? <p className="muted">Loading…</p> : shown.length === 0 ? (
        <div className="card muted">No active pools right now.</div>
      ) : (
        <div className="ap-list">
          {shown.map((p) => {
            const pf = platformOf(p.platform)
            const members = [...(p.group_order_participants ?? [])].sort((a, b) => (a.joined_at ?? '').localeCompare(b.joined_at ?? ''))
            const max = p.max_members ?? 5
            const pct = Math.min(100, Math.round((members.length / max) * 100))
            const fi = feeInfo(p, members.length)
            return (
              <div className="apool" key={p.id}>
                <div className="apool-head">
                  <PlatformLogo p={pf} kind="card" />
                  <span className="apool-name">{p.platform}</span>
                  <span className="apool-time">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                    {fmtLeft(new Date(p.window_end).getTime() - now)} left
                  </span>
                </div>
                <div className="apool-title">{p.title || p.items}</div>
                <div className="avatars">
                  {members.slice(0, 3).map((m) => <Avatar key={m.user_id} m={m} />)}
                  {members.length > 3 && <span className="avatar more">+{members.length - 3}</span>}
                </div>
                <div className="apool-bar">
                  <div className="bar"><div style={{ width: `${pct}%` }} /></div>
                  <span>{members.length}/{max}</span>
                </div>
                <div className="apool-fee">
                  Delivery Fee: ₹{fi.perPerson}{' '}
                  <em>{fi.free ? '(FREE)' : fi.saved > 0 ? `(Saved ₹${fi.saved})` : ''}</em>
                </div>
                <button className="cta-sm" onClick={() => nav(`/pool/${p.id}`)}>Join Pool</button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
