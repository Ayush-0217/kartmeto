
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

export default function Login() {
  const { user } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hostelCode, setHostelCode] = useState('')
  const [room, setRoom] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [hostelName, setHostelName] = useState<string | null>(null)

  if (user && !busy) return <Navigate to="/" replace />

  async function handleCodeChange(val: string) {
    const clean = val.toUpperCase().trim()
    setHostelCode(clean)
    setError('')

    if (clean.length >= 3) {
      const { data, error } = await supabase.rpc(
        'hostel_name_for_code',
        { code: clean }
      )

      if (error) console.error('lookup error:', error.message)
      setHostelName((data as string | null) ?? null)
    } else {
      setHostelName(null)
    }
  }

  function switchMode(m: 'login' | 'signup') {
    setMode(m)
    setError('')
    setPassword('')
  }

  async function logIn(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setBusy(false)

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email ya password galat hai.'
          : error.message
      )
    }
  }

  async function signUp(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const { data: name, error: lookupErr } = await supabase.rpc(
      'hostel_name_for_code',
      { code: hostelCode }
    )

    if (lookupErr) {
      setBusy(false)
      setError('Lookup error: ' + lookupErr.message)
      return
    }

    if (!name) {
      setBusy(false)
      setError('Galat Hostel Passcode! Kripya apne hostel group se sahi code lein.')
      return
    }

    setHostelName(name as string)

    const { data: su, error: suErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (suErr) {
      setBusy(false)
      setError(suErr.message)
      return
    }

    if (!su.session) {
      setBusy(false)
      setError('Account ban gaya par login nahi hua. Supabase mein "Confirm email" OFF karo.')
      return
    }

    const { error: je } = await supabase.rpc('join_community', {
      code: hostelCode,
    })

    if (je) {
      await supabase.auth.signOut()
      setBusy(false)
      setError(je.message)
      return
    }

    if (room.trim() && su.user) {
      await supabase.from('member_private').upsert({
        user_id: su.user.id,
        room_no: room.trim(),
      })
    }

    setBusy(false)
  }

  return (
    <div className="login">
      <div className="login-inner">

        {/* Stacked transparent KartMeto logo */}
        <div className="login-brand">
          <img
  src="/logo-horizontal.png"
  alt="KartMeto"
  className="login-logo"
/>
        </div>

        <h2>Don&apos;t Order Alone.</h2>
        <p className="sub">Your Mates Are Your Backup</p>

        <form onSubmit={mode === 'login' ? logIn : signUp}>
          <label>Email Address</label>

          <input
            type="email"
            required
            placeholder="your.name@college.edu.in"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            required
            minLength={6}
            placeholder="Min 6 characters"
            value={password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mode === 'signup' && (
            <>
              <div className="row">
                <div className="grow">
                  <label>Hostel Passcode</label>
                  <input
                    required
                    placeholder="e.g. BLK-A"
                    value={hostelCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="room">
                  <label>Room No.</label>
                  <input
                    placeholder="302"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  />
                </div>
              </div>

              {hostelName && (
                <div className="pill">
                  📍 Hostel: <b>{hostelName}</b>
                </div>
              )}
            </>
          )}

          <button className="cta" disabled={busy}>
            {busy
              ? (mode === 'login' ? 'Logging in…' : 'Creating account…')
              : (mode === 'login' ? 'Log In →' : 'Create Account →')}
          </button>

          {mode === 'login' ? (
            <button
              type="button"
              className="textbtn"
              onClick={() => switchMode('signup')}
            >
              New here? Create an account
            </button>
          ) : (
            <button
              type="button"
              className="textbtn"
              onClick={() => switchMode('login')}
            >
              Already have an account? Log in
            </button>
          )}
        </form>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
