import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function JoinCommunity() {
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.rpc('join_community', { code })
    setBusy(false)
    if (error) setError(error.message)
    else nav('/', { replace: true })
  }

  return (
    <div className="center-card">
      <h2>Join your community</h2>
      <p className="muted">Enter the invite code from your hostel / PG / society admin.</p>
      <form onSubmit={submit}>
        <input required placeholder="Invite code" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn" disabled={busy}>{busy ? 'Joining…' : 'Join'}</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}