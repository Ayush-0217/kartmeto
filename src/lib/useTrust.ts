import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Trust = { payRate: number | null; poolsJoined: number; savedEst: number | null; daysActive: number; removedUnpaid: number }

export function useTrust(userId: string | null) {
  const [trust, setTrust] = useState<Trust | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) { setTrust(null); return }
    let alive = true
    setLoading(true)
    supabase.rpc('user_trust', { p_user_id: userId }).then(({ data, error }) => {
      if (!alive) return
      setLoading(false)
      if (error || !data) { setTrust(null); return }
      const d = data as any
      setTrust({
        payRate: d.pay_rate === null || d.pay_rate === undefined ? null : Number(d.pay_rate),
        poolsJoined: Number(d.pools_joined ?? 0),
        savedEst: d.saved_est === null || d.saved_est === undefined ? null : Number(d.saved_est),
        daysActive: Number(d.days_active ?? 0),
        removedUnpaid: Number(d.removed_unpaid ?? 0),
      })
    })
    return () => { alive = false }
  }, [userId])

  return { trust, loading }
}
