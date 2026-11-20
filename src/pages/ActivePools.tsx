import { useState } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { PLATFORMS, platformOf } from '../lib/platforms'
import { useNow } from '../lib/useNow'
import { usePools } from '../lib/usePools'
import { feeInfo, fmtLeft } from '../lib/pool'
import { useAuth } from '../auth/AuthProvider'
import Avatar from '../components/Avatar'
import PlatformLogo from '../components/PlatformLogo'
import type { AppCtx } from '../lib/useCommunity'

export default function ActivePools() {
  const { community } = useOutletContext<AppCtx>()
  const { user } = useAuth()
  const nav = useNavigate()
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState('All')
  const { pools, loading } = usePools(community?.id)

  const q = (params.get('q') ?? '').trim().toLowerCase()
  const live = pools.filter((p) => new Date(p.window_end).getTime() > now)
  const chips = PLATFORMS
    .map((pf) => ({ pf, n: live.filter((p) => platformOf(p.platform).name === pf.name).length }))
    .filter((c) => c.n > 0)
  const active = chips.some((c) => c.pf.name === filter) ? filter : 'All'
  const byStore = active === 'All' ? live : live.filter((p) => platformOf(p.platform).name === active)
  const shown = q
    ? byStore.filter((p) => `${p.platform} ${p.title ?? ''} ${p.items ?? ''}`.toLowerCase().includes(q))
    : byStore

  const createUrl = active === 'All' ? '/create' : `/create?platform=${encodeURIComponent(active)}`

  return (
    <>
      <h2 className="ap-title">Active Pools</h2>
      <p className="ap-sub">Live group orders in {community?.name}</p>

      <form className="search" onSubmit={(e) => e.preventDefault()} role="search" style={{ marginBottom: 12 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7.5" /><path d="M21 21l-4.3-4.3" /></svg>
        <input
          type="search"
          value={params.get('q') ?? ''}
          onChange={(e) => {
            const v = e.target.value
            setParams(v ? { q: v } : {}, { replace: true })
          }}
          placeholder="Search pools, stores, or items…"
          aria-label="Search pools"
          style={{ flex: 1, minWidth: 0, width: 'auto', minHeight: 0, height: '100%', margin: 0, padding: 0, borderRadius: 0, background: 'transparent', border: 0, outline: 0, color: 'var(--fg)', font: 'inherit' }}
        />
      </form>

      <div className="chips">
        <button className={`chip ${active === 'All' ? 'on' : ''}`} onClick={() => setFilter('All')}>All Stores ({live.length})</button>
        {chips.map((c) => (
          <button key={c.pf.name} className={`chip ${active === c.pf.name ? 'on' : ''}`} onClick={() => setFilter(c.pf.name)}>
            {c.pf.chip} ({c.n})
          </button>
        ))}
      </div>

      {loading ? <p className="muted">Loading…</p> : shown.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p className="muted">{q ? 'No pools match your search.' : 'No active pools right now.'}</p>
          <button className="cta-sm" style={{ marginTop: 14 }} onClick={() => nav(createUrl)}>Start a Pool +</button>
        </div>
      ) : (
        <div className="ap-list">
          {shown.map((p) => {
            const pf = platformOf(p.platform)
            const members = [...(p.group_order_participants ?? [])].sort((a, b) => (a.joined_at ?? '').localeCompare(b.joined_at ?? ''))
            const mine = members.some((m) => m.user_id === user?.id)
            const max = p.max_members ?? null // null = no limit
            const full = max !== null && members.length >= max && !mine
            const pct = max ? Math.min(100, Math.round((members.length / max) * 100)) : 100
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
                  <span>{max ? `${members.length}/${max}` : `${members.length} joined`}</span>
                </div>
                <div className="apool-fee">
                  Delivery Fee: ₹{fi.perPerson}{' '}
                  <em>{fi.free ? '(FREE)' : fi.saved > 0 ? `(Saved ₹${fi.saved})` : ''}</em>
                </div>
                <button className="cta-sm" disabled={full} onClick={() => nav(`/pool/${p.id}`)}>
                  {mine ? 'Open Pool' : full ? 'Pool Full' : 'Join Pool'}
                </button>
              </div>
            )
          })}
          <button className="cta-sm outline" onClick={() => nav(createUrl)}>Start a Pool +</button>
        </div>
      )}
    </>
  )
}
