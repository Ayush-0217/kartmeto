import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Prof = { display_name?: string; avatar_url?: string | null }
export type Member = { user_id: string; joined_at?: string; profiles?: Prof | Prof[] | null }
export type Pool = {
  id: string
  platform: string
  title?: string | null
  items: string
  est_cart_value: number
  free_delivery_threshold: number | null
  delivery_fee: number
  max_members?: number | null
  window_end: string
  group_order_participants: Member[]
}

const BASE = 'id, platform, items, est_cart_value, free_delivery_threshold, delivery_fee, window_end'
const PARTS = [
  'group_order_participants(user_id, joined_at, profiles(display_name, avatar_url))',
  'group_order_participants(user_id, joined_at, profiles(display_name))',
  'group_order_participants(user_id, joined_at)',
]
// try richest query first, fall back if a migration has not been run yet
const SELECTS = [`${BASE}, title, max_members`, BASE].flatMap((b) => PARTS.map((p) => `${b}, ${p}`))

export function usePools(cid: string | undefined) {
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!cid) return
    let rows: Pool[] = []
    for (const sel of SELECTS) {
      const res: any = await supabase.from('order_requests').select(sel)
        .eq('community_id', cid).eq('status', 'open')
        .gt('window_end', new Date().toISOString()).order('window_end')
      if (!res.error) { rows = res.data as Pool[]; break }
    }
    // most-joined pools first (like the design), then soonest ending
    setPools([...rows].sort((a, b) =>
      (b.group_order_participants?.length ?? 0) - (a.group_order_participants?.length ?? 0) || a.window_end.localeCompare(b.window_end)))
    setLoading(false)
  }, [cid])

  useEffect(() => {
    if (!cid) return
    load()
    const ch = supabase.channel(`pools-${cid}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_requests', filter: `community_id=eq.${cid}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_order_participants' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [cid, load])

  return { pools, loading }
}
