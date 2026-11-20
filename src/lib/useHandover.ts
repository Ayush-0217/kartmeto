import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type HandoverInfo = {
  uid: string
  room: string | null
  handed_at: string | null
  micro_due: number
  micro_cleared: boolean
}

const LIVE = ['placed', 'out_for_delivery', 'received', 'distributed']

/**
 * Handover data comes from security-definer RPCs so PINs and room numbers
 * only reach the people allowed to see them:
 *  - member: their own PIN (my_handover_pins) + the host's room (host_room)
 *  - host:   per-member room / handed-over time / pending due (pool_handover_info)
 */
export function useHandover(orderId: string | undefined, status: string | undefined, isHost: boolean) {
  const [myPin, setMyPin] = useState<string | null>(null)
  const [hostRoom, setHostRoom] = useState<string | null>(null)
  const [info, setInfo] = useState<HandoverInfo[]>([])

  const load = useCallback(async () => {
    if (!orderId || !status || !LIVE.includes(status)) return
    if (isHost) {
      const { data } = await supabase.rpc('pool_handover_info', { p_order_id: orderId })
      setInfo(
        ((data as any[]) ?? []).map((r) => ({
          uid: r.uid,
          room: r.room ?? null,
          handed_at: r.handed_at ?? null,
          micro_due: Number(r.micro_due ?? 0),
          micro_cleared: !!r.micro_cleared,
        })),
      )
    } else {
      const [pins, room] = await Promise.all([
        supabase.rpc('my_handover_pins'),
        supabase.rpc('host_room', { p_order_id: orderId }),
      ])
      const row = ((pins.data as any[]) ?? []).find((r) => r.order_request_id === orderId)
      setMyPin(row?.pin ?? null)
      setHostRoom((room.data as string | null) ?? null)
    }
  }, [orderId, status, isHost])

  useEffect(() => {
    load()
  }, [load])

  return { myPin, hostRoom, info, reloadHandover: load }
}
