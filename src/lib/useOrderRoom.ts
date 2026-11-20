import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type RoomParticipant = {
  user_id: string
  joined_at?: string
  items_text: string
  share_amount: number
  payment_status: 'unpaid' | 'marked_paid' | 'confirmed'
  micro_due: number
  micro_due_cleared: boolean
  handed_over_at: string | null
  profiles?: { display_name?: string; avatar_url?: string | null } | { display_name?: string; avatar_url?: string | null }[] | null
}
export type RoomOrder = {
  id: string
  platform: string
  title: string | null
  est_cart_value: number
  free_delivery_threshold: number | null
  delivery_fee: number
  max_members: number | null
  window_start: string
  window_end: string
  status: string
  creator_id: string
  community_id: string
  sos_until: string | null
  sos_resolved: boolean
}

export function useOrderRoom(orderId: string | undefined) {
  const [order, setOrder] = useState<RoomOrder | null>(null)
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [captainUpi, setCaptainUpi] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!orderId) { setLoading(false); return }
    const { data: o, error: oErr } = await supabase
      .from('order_requests')
      .select('id, platform, title, est_cart_value, free_delivery_threshold, delivery_fee, max_members, window_start, window_end, status, creator_id, community_id, sos_until, sos_resolved')
      .eq('id', orderId).maybeSingle()
    if (oErr || !o) { setNotFound(true); setLoading(false); return }
    setNotFound(false)
    setOrder(o as RoomOrder)

    const [partsRes, capRes] = await Promise.all([
      supabase
        .from('group_order_participants')
        .select('user_id, joined_at, items_text, share_amount, payment_status, micro_due, micro_due_cleared, handed_over_at, profiles(display_name, avatar_url)')
        .eq('order_request_id', orderId),
      supabase.from('captains').select('upi_id').eq('order_request_id', orderId).maybeSingle(),
    ])
    if (partsRes.error) console.warn('useOrderRoom participants:', partsRes.error.message)
    setParticipants(
      ((partsRes.data as any[]) ?? []).map((p) => ({
        ...p,
        items_text: p.items_text ?? '[]',
        share_amount: Number(p.share_amount ?? 0),
        micro_due: Number(p.micro_due ?? 0),
        micro_due_cleared: !!p.micro_due_cleared,
        handed_over_at: p.handed_over_at ?? null,
      })),
    )
    setCaptainUpi(capRes.data?.upi_id ?? null)
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    if (!orderId) { setLoading(false); return }
    load()
    let timer: ReturnType<typeof setTimeout> | undefined
    const debounced = () => { clearTimeout(timer); timer = setTimeout(load, 250) }
    const ch = supabase.channel(`room-${orderId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_requests', filter: `id=eq.${orderId}` }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_order_participants', filter: `order_request_id=eq.${orderId}` }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captains', filter: `order_request_id=eq.${orderId}` }, debounced)
      .subscribe()
    return () => { clearTimeout(timer); supabase.removeChannel(ch) }
  }, [orderId, load])

  return { order, participants, captainUpi, loading, notFound, reload: load }
}
