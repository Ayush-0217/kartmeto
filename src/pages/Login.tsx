import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

export default function Login() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="center-card">
      <h1>kartmeto</h1>
      <p className="muted">Order together with people nearby. Save on delivery.</p>
      {sent ? (
        <p>Check <b>{email}</b> for your login link.</p>
      ) : (
        <form onSubmit={submit}>
          <input type="email" required placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send magic link'}</button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  )
}
