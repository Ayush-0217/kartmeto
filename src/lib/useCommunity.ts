import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../auth/AuthProvider'

export type Community = { id: string; name: string }
export type AppCtx = { community: Community | null; reload: () => Promise<void> }

export function useCommunity() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('community_members')
      .select('community_id, communities(name)')
      .eq('user_id', user.id)
      .limit(1)
    const row = data?.[0] as any
    setCommunity(row ? { id: row.community_id, name: row.communities?.name ?? '' } : null)
    setLoading(false)
  }, [user])

  useEffect(() => { reload() }, [reload])

  return { community, loading, reload }
}
