import { useState, type FormEvent } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { AppCtx } from '../lib/useCommunity'

export default function JoinCommunity() {
  const nav = useNavigate()
  const { reload } = useOutletContext<AppCtx>()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.rpc('join_community', { code })
    if (error) { setBusy(false); setError(error.message); return }
    await reload()
    setBusy(false)
    nav('/', { replace: true })
  }

  return (
    <div className="center-card">
      <h2>Join your hostel</h2>
      <p className="muted">Enter the passcode from your hostel / PG / society admin.</p>
      <form onSubmit={submit}>
        <input required placeholder="Passcode" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn" disabled={busy}>{busy ? 'Joining…' : 'Join'}</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}
