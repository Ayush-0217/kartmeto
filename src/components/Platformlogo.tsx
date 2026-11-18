import { useState } from 'react'
import type { Platform } from '../lib/platforms'

type Props = { p: Platform; kind: 'tile' | 'wordmark' | 'card' }

export default function PlatformLogo({ p, kind }: Props) {
  const src = kind === 'wordmark' ? (p.wordmark ?? p.tile) : kind === 'card' ? (p.card ?? p.tile) : p.tile
  const tileOnly = kind === 'wordmark' && !p.wordmark
  const [bad, setBad] = useState(!src)
  const cls = kind === 'tile' ? 'tile-logo' : kind === 'card' ? 'card-logo' : tileOnly ? 'pool-logo small-tile' : 'pool-logo'
  if (bad) return <span className={`${cls} fallback`} style={{ background: p.bg, color: p.fg }}>{p.short}</span>
  return <img src={src} alt={p.name} className={cls} onError={() => setBad(true)} />
}
