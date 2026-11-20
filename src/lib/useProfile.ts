import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type MyProfile = {
  display_name: string | null
  avatar_url: string | null
  room_no: string | null
  default_upi_id: string | null
  qr_code_url: string | null
}

const UPI_RE = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/

export function useProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!uid) { setLoading(false); return }
    const [pRes, mpRes] = await Promise.all([
      supabase.from('profiles').select('display_name, avatar_url, default_upi_id, qr_code_url').eq('id', uid).maybeSingle(),
      supabase.from('member_private').select('room_no').eq('user_id', uid).maybeSingle(),
    ])
    if (pRes.error) console.warn('useProfile profiles:', pRes.error.message)
    setProfile({
      display_name: pRes.data?.display_name ?? null,
      avatar_url: pRes.data?.avatar_url ?? null,
      default_upi_id: pRes.data?.default_upi_id ?? null,
      qr_code_url: pRes.data?.qr_code_url ?? null,
      room_no: mpRes.data?.room_no ?? null,
    })
    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  // Each save returns an error message, or null on success.

  async function saveName(name: string): Promise<string | null> {
    if (!uid) return 'Not signed in'
    const clean = name.trim().slice(0, 60)
    if (!clean) return 'Name cannot be empty'
    const { error } = await supabase.from('profiles').update({ display_name: clean }).eq('id', uid)
    if (error) return error.message
    await load()
    return null
  }

  async function saveRoom(room: string): Promise<string | null> {
    if (!uid) return 'Not signed in'
    const clean = room.trim().slice(0, 20)
    const upd = await supabase
      .from('member_private')
      .update({ room_no: clean || null })
      .eq('user_id', uid)
      .select('user_id')
    if (upd.error) return upd.error.message
    if (!upd.data || upd.data.length === 0) {
      const ins = await supabase.from('member_private').insert({ user_id: uid, room_no: clean || null })
      if (ins.error) return ins.error.message
    }
    await load()
    return null
  }

  // Goes through set_my_payment_info so the UPI also updates the host's open pools.
  // The existing QR is passed back because the RPC overwrites it with its 2nd argument.
  async function saveUpi(upi: string): Promise<string | null> {
    if (!uid) return 'Not signed in'
    const clean = upi.trim()
    if (clean && !UPI_RE.test(clean)) return 'Enter a valid UPI ID, like name@okaxis'
    const { error } = await supabase.rpc('set_my_payment_info', {
      p_upi: clean,
      p_qr: profile?.qr_code_url ?? null,
    })
    if (error) return error.message
    await load()
    return null
  }

  return { profile, loading, reload: load, saveName, saveRoom, saveUpi }
}
