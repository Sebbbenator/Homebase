'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Profiles } from '@/lib/types'

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select().eq('id', user.id).maybeSingle()
  return data
}

export async function updateProfile(emoji: string, displayName?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke logget ind')

  const updates: Record<string, unknown> = { avatar_emoji: emoji, updated_at: new Date().toISOString() }
  if (displayName !== undefined) updates.display_name = displayName.trim().slice(0, 40)

  const { error } = await supabase.from('profiles').upsert({ id: user.id, ...updates })
  if (error) throw new Error(error.message)

  revalidatePath('/mig')
  revalidatePath('/hjem')
  revalidatePath('/opgaver')
  revalidatePath('/mig/historik')
}

export async function getProfilesMap(userIds: string[]): Promise<Profiles> {
  if (userIds.length === 0) return {}
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select().in('id', userIds)
  const map: Profiles = {}
  for (const p of data ?? []) map[p.id] = p
  return map
}
