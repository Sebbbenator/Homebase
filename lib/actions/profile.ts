'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Profile } from '@/lib/types'

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select()
    .eq('id', user.id)
    .single()

  return data
}

export async function updateProfile(emoji: string, displayName?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updates: Record<string, unknown> = {
    avatar_emoji: emoji,
    updated_at: new Date().toISOString(),
  }
  if (displayName !== undefined) updates.display_name = displayName

  // Upsert — handles case where profile doesn't exist yet
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updates })

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/history')
}

export async function getProfilesMap(userIds: string[]): Promise<Record<string, Profile>> {
  if (userIds.length === 0) return {}

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select()
    .in('id', userIds)

  const map: Record<string, Profile> = {}
  for (const p of data ?? []) {
    map[p.id] = p
  }
  return map
}
