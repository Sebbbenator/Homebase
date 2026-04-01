'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createHome(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('create_home_with_member', {
    home_name: name.trim(),
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  return data
}

export async function joinHome(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('join_home_by_code', {
    code: inviteCode.trim(),
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  return data
}

export async function getHomeData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  const { data: home } = await supabase
    .from('homes')
    .select()
    .eq('id', membership.home_id)
    .single()

  return home
}

export async function getHomeMembers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return []

  const { data: members } = await supabase
    .from('home_members')
    .select('id, user_id, joined_at')
    .eq('home_id', membership.home_id)

  return members ?? []
}
