import { useState } from 'react'
import type { Member } from '../lib/usePools'
import { colorOf, profOf } from '../lib/pool'

export default function Avatar({ m }: { m: Member }) {
  const p = profOf(m)
  const [bad, setBad] = useState(false)
  if (p?.avatar_url && !bad) return <img className="avatar" src={p.avatar_url} alt="" onError={() => setBad(true)} />
  return <span className="avatar" style={{ background: colorOf(m.user_id) }}>{(p?.display_name?.[0] ?? '?').toUpperCase()}</span>
}
