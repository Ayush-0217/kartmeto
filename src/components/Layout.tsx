import { Link, NavLink, Navigate, Outlet, Route, useLocation } from 'react-router-dom'
import { useCommunity, type AppCtx } from '../lib/useCommunity'
import HostDemo from '../hostdemo'

const ICONS: Record<string, string> = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V11z',
  pools: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M16 14h1a5 5 0 0 1 5 5v1',
  activity: 'M9 4h6v3H9zM7 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1M9 12h6M9 16h4',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
}

function Icon({ name }: { name: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  )
}

export default function Layout() {
  const { community, loading, reload } = useCommunity()
  const { pathname } = useLocation()

  if (loading) return <p className="muted" style={{ padding: 16 }}>Loading…</p>
  if (!community && pathname !== '/join') return <Navigate to="/join" replace />

  const ctx: AppCtx = { community, reload }

  return (
    <div className="app">
      <header className="hdr">
        <img src="/logo-horizontal.png" alt="KartMeto" className="hdr-logo" />
        <Link to="/join" className="hostel-pill">
          {community?.name ?? 'Join hostel'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l7 7 7-7" /></svg>
        </Link>
      </header>
      <main className="content"><Outlet context={ctx} /></main>
      <nav className="bottom-nav">
        <NavLink to="/" end><Icon name="home" />Home</NavLink>
        <NavLink to="/pools"><Icon name="pools" />Active Pools</NavLink>
        <NavLink to="/activity"><Icon name="activity" />Activity</NavLink>
        <NavLink to="/profile"><Icon name="profile" />Profile</NavLink>
      </nav>
    </div>
  )
}

<Route path="/demo/host" element={<HostDemo />} />