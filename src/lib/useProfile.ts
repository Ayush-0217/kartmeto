import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type MyProfile = {
  display_name: string | null
  avatar_url: string | null
  room_no: string | null
}

export function useProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!uid) return
    const [{ data: p }, { data: mp }] = await Promise.all([
      supabase.from('profiles').select('display_name, avatar_url').eq('id', uid).maybeSingle(),
      supabase.from('member_private').select('room_no').eq('user_id', uid).maybeSingle(),
    ])
    setProfile({ display_name: p?.display_name ?? null, avatar_url: p?.avatar_url ?? null, room_no: mp?.room_no ?? null })
    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  return { profile, loading, reload: load }
}
