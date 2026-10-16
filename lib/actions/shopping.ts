'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { requireHome } from '@/lib/data/session'
import { notifyHome } from '@/lib/notify'
import { insertShoppingItem } from '@/lib/shopping-server'
import { normalizeName } from '@/lib/shopping-sections'
import type { ShoppingItem } from '@/lib/types'

function revalidate() {
  revalidatePath('/indkoeb')
  revalidatePath('/hjem')
}

export async function addShoppingItem(name: string, quantity?: string | null, section?: string | null): Promise<ShoppingItem> {
  const { supabase, user, homeId } = await requireHome()
  if (!name.trim()) throw new Error('Skriv hvad der skal købes')
  const item = await insertShoppingItem(supabase, homeId, user.id, name, quantity, section)
  revalidate()
  return item
}

export interface ShoppingPatch {
  name?: string
  quantity?: string | null
  section?: string
}

export async function updateShoppingItem(itemId: string, patch: ShoppingPatch): Promise<ShoppingItem> {
  const { supabase, homeId } = await requireHome()
  const update: Record<string, unknown> = {}
  if (patch.name !== undefined) {
    const n = patch.name.trim()
    if (!n) throw new Error('Varen skal have et navn')
    update.name = n
  }
  if (patch.quantity !== undefined) update.quantity = patch.quantity?.trim() || null
  if (patch.section !== undefined) update.section = patch.section

  const { data, error } = await supabase
    .from('shopping_items')
    .update(update)
    .eq('id', itemId)
    .eq('home_id', homeId)
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Husk den rettede sektion/mængde til næste gang
  if (patch.section !== undefined || patch.quantity !== undefined) {
    await supabase
      .from('shopping_history')
      .update({ ...(patch.section !== undefined && { section: patch.section }), ...(patch.quantity ? { last_quantity: patch.quantity } : {}) })
      .eq('home_id', homeId)
      .eq('name_key', normalizeName(data.name))
  }
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

/** Glem en vare fra "Ofte købt" */
export async function forgetHistory(historyId: string) {
  const { supabase, homeId } = await requireHome()
  await supabase.from('shopping_history').delete().eq('id', historyId).eq('home_id', homeId)
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
