import type { Member, Pool, Prof } from './usePools'

export const profOf = (m: Member): Prof | undefined => (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles ?? undefined)

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308']
export const colorOf = (id: string) => COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length]

const pad = (n: number) => String(n).padStart(2, '0')
export function fmtLeft(ms: number) {
  if (ms <= 0) return '00:00'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0 ? `${pad(h)}:${pad(m)}` : `${pad(m)}:${pad(sec)}`
}

// ESTIMATE only: the order's delivery_fee is what one person would pay alone, split across members.
export function feeInfo(p: Pool, count: number) {
  const solo = p.delivery_fee ?? 0
  const free = !!p.free_delivery_threshold && p.est_cart_value >= p.free_delivery_threshold
  const perPerson = free ? 0 : Math.ceil(solo / Math.max(1, count))
  return { free, perPerson, saved: Math.max(0, solo - perPerson) }
}

// APPROX display only — we don't have a real locked_at/completed_at column yet,
// so Activity.tsx passes window_start/window_end as a stand-in timestamp.
export function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const y = new Date(now); y.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === y.toDateString()
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (sameDay) return `Today, ${time}`
  if (isYesterday) return `Yesterday, ${time}`
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`
}
