import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Per-request cached Supabase user lookup.
 *
 * React's `cache()` memoizes the result for the duration of a single server
 * render, so calling this from both the layout and a page only hits Supabase
 * once per navigation.
 */
export const getSessionUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Per-request cached session + home membership lookup.
 *
 * Returns `null` when there is no signed-in user or no membership row.
 * Deduped across layout + page in the same render thanks to `cache()`.
 */
export const getCurrentHome = cache(async () => {
  const user = await getSessionUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return null
  return { user, homeId: membership.home_id as string }
})
