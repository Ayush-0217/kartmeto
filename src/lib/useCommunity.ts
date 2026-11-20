import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../auth/AuthProvider'

export type Community = { id: string; name: string }
export type AppCtx = { community: Community | null; reload: () => Promise<void> }

// The hostel the user last chose/joined. Used when they belong to more than one.
export const ACTIVE_COMMUNITY_KEY = 'km_active_community'

function readActive(): string | null {
  try { return localStorage.getItem(ACTIVE_COMMUNITY_KEY) } catch { return null }
}

export function useCommunity() {
  const { user } = useAuth()
  const uid = user?.id
  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!uid) { setLoading(false); return }
    const { data, error } = await supabase
      .from('community_members')
      .select('community_id, communities(name)')
      .eq('user_id', uid)
    if (error) console.warn('useCommunity:', error.message)
    const rows = (data as any[]) ?? []
    const wanted = readActive()
    const row = rows.find((r) => r.community_id === wanted) ?? rows[0]
    setCommunity(row ? { id: row.community_id, name: row.communities?.name ?? '' } : null)
    setLoading(false)
  }, [uid])

  useEffect(() => { reload() }, [reload])

  return { community, loading, reload }
}
