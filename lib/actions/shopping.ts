'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addShoppingItem(name: string, quantity?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) throw new Error('No home found')

  const { error } = await supabase.from('shopping_items').insert({
    home_id: membership.home_id,
    name,
    quantity: quantity || null,
    added_by: user.id,
  })

  if (error) throw error
  revalidatePath('/shopping')
}

export async function togglePurchased(itemId: string, current: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('shopping_items')
    .update({ is_purchased: !current })
    .eq('id', itemId)

  if (error) throw error
  revalidatePath('/shopping')
}

export async function removeShoppingItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('shopping_items').delete().eq('id', itemId)
  if (error) throw error
  revalidatePath('/shopping')
}

export async function clearPurchased() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) throw new Error('No home found')

  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('home_id', membership.home_id)
    .eq('is_purchased', true)

  if (error) throw error
  revalidatePath('/shopping')
}

export async function getShoppingItems() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('shopping_items')
    .select()
    .order('created_at', { ascending: false })

  return data ?? []
}
