import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <strong>kartmeto</strong>
        <button className="link" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>
      <main className="content"><Outlet /></main>
      <nav className="bottom-nav">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/join">Community</NavLink>
      </nav>
    </div>
  )
}
