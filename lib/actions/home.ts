'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireHome } from '@/lib/data/session'
import { fetchWasteEvents } from '@/lib/waste'

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

/** Gem (eller fjern) kommunens affaldskalender som ICS-URL. Tester at den kan hentes. */
export async function setWasteUrl(url: string | null): Promise<{ count: number }> {
  const { supabase, homeId } = await requireHome()
  const clean = url?.trim() || null
  let count = 0
  if (clean) {
    if (!/^https?:\/\//i.test(clean)) throw new Error('Indsæt et link der starter med http(s)://')
    const events = await fetchWasteEvents(clean.replace(/^webcal:\/\//i, 'https://'), 0)
    if (events.length === 0) throw new Error('Kalenderen indeholder ingen afhentninger')
    count = events.length
  }
  const { error } = await supabase.from('homes').update({ waste_ics_url: clean }).eq('id', homeId)
  if (error) throw new Error(error.message)
  revalidatePath('/mig')
  revalidatePath('/hjem')
  return { count }
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
