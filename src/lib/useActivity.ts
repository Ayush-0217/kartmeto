import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Member } from './usePools'

export type MyOrder = {
  id: string
  platform: string
  title?: string | null
  items: string
  est_cart_value: number
  free_delivery_threshold: number | null
  delivery_fee: number
  window_start: string
  window_end: string
  status: string
  group_order_participants: Member[]
  my_share_amount: number | null
  my_payment_status: string | null
}

const ONGOING_STATUSES = ['locked', 'placed', 'out_for_delivery', 'received', 'distributed']
const PAST_STATUSES = ['completed']

async function fetchMine(uid: string, cid: string, statuses: string[]): Promise<MyOrder[]> {
  // step 1: my participant rows for this community, filtered by order status
  const { data: mine, error: e1 } = await supabase
    .from('group_order_participants')
    .select('order_request_id, share_amount, payment_status, order_requests!inner(id, community_id, status)')
    .eq('user_id', uid)
    .eq('order_requests.community_id', cid)
    .in('order_requests.status', statuses)
  if (e1 || !mine?.length) return []

  const ids = mine.map((m: any) => m.order_request_id)
  const mineMap = new Map(mine.map((m: any) => [m.order_request_id, m]))

  // step 2: full order rows + all participants (for avatars), richest select first
  const PARTS = [
    'group_order_participants(user_id, profiles(display_name, avatar_url))',
    'group_order_participants(user_id, profiles(display_name))',
    'group_order_participants(user_id)',
  ]
  const BASE = 'id, platform, items, est_cart_value, free_delivery_threshold, delivery_fee, window_start, window_end, status'
  const SELECTS = [`${BASE}, title`, BASE].flatMap((b) => PARTS.map((p) => `${b}, ${p}`))

  for (const sel of SELECTS) {
    const { data, error } = await supabase.from('order_requests').select(sel).in('id', ids)
    if (!error) {
      return (data as any[]).map((o) => ({
        ...o,
        my_share_amount: mineMap.get(o.id)?.share_amount ?? null,
        my_payment_status: mineMap.get(o.id)?.payment_status ?? null,
      })) as MyOrder[]
    }
  }
  return []
}

export function useActivity(cid: string | undefined, uid: string | undefined) {
  const [ongoing, setOngoing] = useState<MyOrder[]>([])
  const [past, setPast] = useState<MyOrder[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!cid || !uid) return
    const [o, p] = await Promise.all([
      fetchMine(uid, cid, ONGOING_STATUSES),
      fetchMine(uid, cid, PAST_STATUSES),
    ])
    o.sort((a, b) => a.window_end.localeCompare(b.window_end))
    p.sort((a, b) => b.window_end.localeCompare(a.window_end))
    setOngoing(o)
    setPast(p)
    setLoading(false)
  }, [cid, uid])

  useEffect(() => {
    if (!cid || !uid) return
    load()
    const ch = supabase.channel(`activity-${cid}-${uid}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_requests', filter: `community_id=eq.${cid}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_order_participants' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [cid, uid, load])

  return { ongoing, past, loading }
}
