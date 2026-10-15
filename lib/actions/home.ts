'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createHome(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke logget ind')
  if (!name.trim()) throw new Error('Giv hjemmet et navn')

  const { data, error } = await supabase.rpc('create_home_with_member', { home_name: name.trim() })
  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  return data
}

export async function joinHome(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke logget ind')

  const { data, error } = await supabase.rpc('join_home_by_code', { code: inviteCode.trim() })
  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  return data
}
