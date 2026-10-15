'use server'

import { revalidatePath } from 'next/cache'
import { requireHome } from '@/lib/data/session'
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
