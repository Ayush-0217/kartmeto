import { useEffect, useRef, useState } from 'react'
import './host.css'

export type HandoverRoom = {
  userId: string
  room: string | null     // only the Host of this pool ever receives this
  name: string
  summary: string         // e.g. "Milk, Bread, Maggi..."
  delivered: boolean
  due?: number            // extra amount to collect before handover (missed free-delivery limit)
}

type Props = {
  rooms: HandoverRoom[]
  ready: boolean          // true once the order has arrived
  onConfirm: (userId: string, pin: string) => Promise<string | null>   // returns an error message or null
  onClearDue?: (userId: string) => Promise<string | null>              // marks the pending due as collected
}

export default function SmartHandover({ rooms, ready, onConfirm, onClearDue }: Props) {
  const [sel, setSel] = useState<string | null>(null)
  const [digits, setDigits] = useState(['', '', '', ''])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const pending = rooms.filter((r) => !r.delivered)
  const current = rooms.find((r) => r.userId === sel && !r.delivered)

  useEffect(() => {
    if (!current && pending.length) setSel(pending[0].userId)
  }, [current, pending.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const pin = digits.join('')
  const label = (r: HandoverRoom) => (r.room ? r.room : r.name)

  function resetDigits() {
    setDigits(['', '', '', ''])
    refs.current[0]?.focus()
  }

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1)
    setDigits((cur) => cur.map((x, k) => (k === i ? d : x)))
    setError('')
    if (d && i < 3) refs.current[i + 1]?.focus()
  }

  async function confirm() {
    if (!current || pin.length !== 4) return
    setBusy(true); setError('')
    const err = await onConfirm(current.userId, pin)
    setBusy(false)
    if (err) { setError(err); resetDigits() }
    else resetDigits()
  }

  return (
    <div className="hov">
      <div className="hcc-title">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f97810" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M7.5 12.5l3 3 6-6.5" /></svg>
        <div>
          <h2>Smart Handover</h2>
          <p>Confirm grocery packets for each room</p>
        </div>
      </div>

      <div className="hov-total">
        <svg width="62" height="62" viewBox="0 0 24 24" fill="none" stroke="#f97810" strokeWidth="1.5" strokeLinejoin="round"><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5v-9z" /><path d="M3 7.5l9 4.5 9-4.5M12 12v9" /></svg>
        <div>
          <small>Total Packets</small>
          <b>{rooms.length} {rooms.length === 1 ? 'Packet' : 'Packets'}</b>
        </div>
        <span className={`hov-ready ${ready ? '' : 'off'}`}>{ready ? 'Ready' : 'Waiting'}</span>
      </div>

      <h3 className="hov-h">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f97810" strokeWidth="1.8" strokeLinejoin="round"><path d="M6 3h10a1 1 0 0 1 1 1v16H6V3zM17 20h3M12.5 12v.5" /></svg>
        Room-wise Details
      </h3>

      <div className="hov-list">
        {rooms.map((r) => (
          <button
            key={r.userId}
            className={`hov-row ${sel === r.userId && !r.delivered ? 'on' : ''}`}
            disabled={r.delivered}
            onClick={() => { setSel(r.userId); setError(''); resetDigits() }}
          >
            <span className="hov-room"><small>Room</small><b>{label(r)}</b></span>
            <span className="hov-bag"><b>K</b></span>
            <span className="hov-txt"><b>1 Packet</b><small>({r.summary})</small></span>
            {r.delivered ? (
              <span className="hov-badge done">✓ Delivered</span>
            ) : (
              <span className="hov-badge wait">◷ Pending</span>
            )}
          </button>
        ))}
        {rooms.length === 0 && <p className="muted">No packets to hand over.</p>}
      </div>

      {pending.length > 0 ? (
        <div className="hov-verify">
          <div className="hov-vhead">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="#f97810"><rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#f97810" strokeWidth="2" /></svg>
            <div>
              <b>Verify to Complete Handover</b>
              <small>Ask {current ? label(current) : 'the member'} for the 4-digit PIN shown in their app</small>
            </div>
          </div>

          {current && (current.due ?? 0) > 0 && onClearDue && (
            <div className="hcc-bump" style={{ marginBottom: 10 }}>
              <b>Collect ₹{current.due} before handover</b>
              <span>The free-delivery limit was missed, so the delivery fee is split. Collect this from {label(current)}.</span>
              <button
                onClick={async () => {
                  const e = await onClearDue(current.userId)
                  if (e) setError(e)
                }}
              >
                Due collected
              </button>
            </div>
          )}

          <div className="hov-pin">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el }}
                inputMode="numeric"
                autoComplete="off"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus() }}
              />
            ))}
          </div>
          {error && <p className="error" style={{ margin: '10px 0 0' }}>{error}</p>}
        </div>
      ) : rooms.length > 0 ? (
        <p className="hov-all">All packets are handed over.</p>
      ) : null}

      <div className="hcc-dock">
        <button className="hcc-share primary" disabled={busy || !current || pin.length !== 4} onClick={confirm}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          {busy ? 'Checking…' : 'Confirm Handover'}
        </button>
      </div>
    </div>
  )
}
