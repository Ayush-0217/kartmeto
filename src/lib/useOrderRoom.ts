import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type RoomParticipant = {
  user_id: string
  items_text: string
  share_amount: number
  payment_status: 'unpaid' | 'marked_paid' | 'confirmed'
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
}

export function useOrderRoom(orderId: string | undefined) {
  const [order, setOrder] = useState<RoomOrder | null>(null)
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [captainUpi, setCaptainUpi] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!orderId) return
    const { data: o, error: oErr } = await supabase
      .from('order_requests')
      .select('id, platform, title, est_cart_value, free_delivery_threshold, delivery_fee, max_members, window_start, window_end, status, creator_id, community_id')
      .eq('id', orderId).maybeSingle()
    if (oErr || !o) { setNotFound(true); setLoading(false); return }
    setOrder(o as RoomOrder)

    const { data: parts } = await supabase
      .from('group_order_participants')
      .select('user_id, items_text, share_amount, payment_status, profiles(display_name, avatar_url)')
      .eq('order_request_id', orderId)
    setParticipants((parts as any[]) ?? [])

    const { data: cap } = await supabase
      .from('captains').select('upi_id').eq('order_request_id', orderId).maybeSingle()
    setCaptainUpi(cap?.upi_id ?? null)
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    if (!orderId) return
    load()
    const ch = supabase.channel(`room-${orderId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_requests', filter: `id=eq.${orderId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_order_participants', filter: `order_request_id=eq.${orderId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captains', filter: `order_request_id=eq.${orderId}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [orderId, load])

  return { order, participants, captainUpi, loading, notFound, reload: load }
}
