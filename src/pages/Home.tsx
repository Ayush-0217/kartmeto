import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

type Order = { id: string; platform: string; items: string; est_cart_value: number; window_end: string }

export default function Home() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [cid, setCid] = useState<string | null>(null)
  const [cname, setCname] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // 1. find the user's community (MVP: first one)
  useEffect(() => {
    if (!user) return
    supabase.from('community_members').select('community_id, communities(name)')
      .eq('user_id', user.id).limit(1)
      .then(({ data }) => {
        if (!data || data.length === 0) { nav('/join', { replace: true }); return }
        const row = data[0] as any
        setCid(row.community_id)
        setCname(row.communities?.name ?? '')
      })
  }, [user, nav])

  // 2. load open orders + realtime (refetch on any change keeps UI consistent with RLS)
  useEffect(() => {
    if (!cid) return
    const load = async () => {
      const { data } = await supabase.from('order_requests')
        .select('id, platform, items, est_cart_value, window_end')
        .eq('community_id', cid).eq('status', 'open')
        .gt('window_end', new Date().toISOString()).order('window_end')
      setOrders((data as Order[]) ?? [])
      setLoading(false)
    }
    load()
    const ch = supabase.channel(`feed-${cid}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'order_requests', filter: `community_id=eq.${cid}` },
        () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [cid])

  return (
    <>
      <h2>{cname || 'Your community'}</h2>
      <h3>Open orders</h3>
      {loading ? <p className="muted">Loading…</p> : orders.length === 0 ? (
        <p className="muted">Nobody is ordering right now. (Create Order arrives in Milestone 2.)</p>
      ) : orders.map((o) => (
        <div className="card" key={o.id}>
          <b>{o.platform}</b> · ~₹{o.est_cart_value}
          <div className="muted">{o.items}</div>
          <div className="muted">Closes {new Date(o.window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ))}
    </>
  )
}
