import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Bruger + hjem for den aktuelle request (deduplikeret via React cache) */
export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, homeId: null }

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return { supabase, user, homeId: (membership?.home_id as string | undefined) ?? null }
})

/** Som getSession, men redirecter hvis ikke logget ind eller uden hjem */
export async function requireHome() {
  const s = await getSession()
  if (!s.user) redirect('/login')
  if (!s.homeId) redirect('/hjem')
  return { supabase: s.supabase, user: s.user, homeId: s.homeId }
}
