'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { requireHome } from '@/lib/data/session'
import { notifyHome } from '@/lib/notify'
import type { ShoppingItem } from '@/lib/types'

function revalidate() {
  revalidatePath('/indkoeb')
  revalidatePath('/hjem')
}

export async function addShoppingItem(name: string, quantity?: string | null): Promise<ShoppingItem> {
  const { supabase, user, homeId } = await requireHome()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Skriv hvad der skal købes')

  const { data, error } = await supabase
    .from('shopping_items')
    .insert({ home_id: homeId, name: trimmed, quantity: quantity?.trim() || null, added_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidate()
  return data as ShoppingItem
}

export async function setPurchased(itemId: string, purchased: boolean) {
  const { supabase, homeId } = await requireHome()
  const { error } = await supabase
    .from('shopping_items')
    .update({ is_purchased: purchased })
    .eq('id', itemId)
    .eq('home_id', homeId)
  if (error) throw new Error(error.message)
  revalidate()
}

export async function removeShoppingItem(itemId: string) {
  const { supabase, homeId } = await requireHome()
  const { error } = await supabase.from('shopping_items').delete().eq('id', itemId).eq('home_id', homeId)
  if (error) throw new Error(error.message)
  revalidate()
}

/** "Jeg handler nu" – giver de andre 2 timers vindue til at tilføje det sidste (max én besked pr. 2 t) */
export async function startShopping() {
  const { supabase, user, homeId } = await requireHome()
  const { data: home } = await supabase.from('homes').select('shopping_started_at').eq('id', homeId).maybeSingle()
  const last = home?.shopping_started_at ? new Date(home.shopping_started_at).getTime() : 0
  if (Date.now() - last < 2 * 3_600_000) return false

  await supabase.from('homes').update({ shopping_started_at: new Date().toISOString(), shopping_started_by: user.id }).eq('id', homeId)

  const { data: profile } = await supabase.from('profiles').select('display_name, avatar_emoji').eq('id', user.id).maybeSingle()
  const name = profile?.display_name || user.email?.split('@')[0] || 'Nogen'
  const userId = user.id
  after(() =>
    notifyHome(
      homeId,
      'shopping',
      { title: `${profile?.avatar_emoji ?? '🛒'} ${name} er ved at handle`, body: 'Tilføj det sidste til listen nu', url: '/indkoeb', tag: 'shopping-now' },
      { exclude: [userId] }
    )
  )
  return true
}

export async function clearPurchased() {
  const { supabase, homeId } = await requireHome()
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('home_id', homeId)
    .eq('is_purchased', true)
  if (error) throw new Error(error.message)
  revalidate()
}
