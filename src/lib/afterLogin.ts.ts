// Remembers where a logged-out visitor was going (an invite link to a pool) so they
// land there after login / joining a hostel instead of on Home.
// Only /pool/... paths are stored, so this can never be used as an open redirect.

const KEY = 'km_after_login'
const MAX_AGE_MS = 30 * 60 * 1000

const isSafe = (p: unknown): p is string =>
  typeof p === 'string' && p.startsWith('/pool/') && !p.startsWith('//')

export function rememberDestination(path: string) {
  if (!isSafe(path)) return
  try {
    localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }))
  } catch {
    /* storage blocked: the visitor just lands on Home */
  }
}

// Returns the remembered path once, then forgets it.
export function takeDestination(): string | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    localStorage.removeItem(KEY)
    const { path, at } = JSON.parse(raw)
    if (!isSafe(path) || Date.now() - Number(at) > MAX_AGE_MS) return null
    return path
  } catch {
    return null
  }
}