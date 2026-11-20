import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ACTIVE_COMMUNITY_KEY, type AppCtx } from '../lib/useCommunity'

export default function JoinCommunity() {
  const nav = useNavigate()
  const location = useLocation()
  const { community, reload } = useOutletContext<AppCtx>()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Layout passes the page the user originally wanted (e.g. a shared /pool/:id link)
  const from = (location.state as { from?: string } | null)?.from
  const dest = from && from.startsWith('/') && from !== '/join' ? from : '/'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    const { data, error } = await supabase.rpc('join_community', { code: code.trim() })
    if (error) { setBusy(false); setError(error.message); return }
    // join_community returns the hostel id: make it the active one
    try { if (data) localStorage.setItem(ACTIVE_COMMUNITY_KEY, String(data)) } catch { /* storage blocked */ }
    await reload()
    setBusy(false)
    nav(dest, { replace: true })
  }

  return (
    <div className="center-card">
      <h2>Join your hostel</h2>
      <p className="muted">Enter the passcode from your hostel / PG / society admin.</p>
      <form onSubmit={submit}>
        <input
          required
          placeholder="Passcode"
          autoCapitalize="characters"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn" disabled={busy}>{busy ? 'Joining…' : 'Join'}</button>
        {error && <p className="error">{error}</p>}
      </form>
      {community && (
        <p style={{ marginTop: 14 }}>
          <Link to="/" className="textbtn">← Back to {community.name}</Link>
        </p>
      )}
    </div>
  )
}
