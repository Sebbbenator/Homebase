import type { SupabaseClient } from '@supabase/supabase-js'
import { detectSection, normalizeName } from '@/lib/shopping-sections'
import type { ShoppingItem } from '@/lib/types'

/** Sektion fra historikken hvis varen er set før, ellers gæt ud fra navnet */
export async function resolveSection(db: SupabaseClient, homeId: string, name: string): Promise<string> {
  const { data } = await db
    .from('shopping_history')
    .select('section')
    .eq('home_id', homeId)
    .eq('name_key', normalizeName(name))
    .maybeSingle()
  return data?.section ?? detectSection(name)
}

/** Tæl varen op i historikken (bruges til "Ofte købt" og autocomplete) */
export async function bumpHistory(db: SupabaseClient, homeId: string, name: string, section: string, quantity: string | null) {
  const key = normalizeName(name)
  const { data: existing } = await db
    .from('shopping_history')
    .select('id, times')
    .eq('home_id', homeId)
    .eq('name_key', key)
    .maybeSingle()
  const now = new Date().toISOString()
  if (existing) {
    await db
      .from('shopping_history')
      .update({ times: existing.times + 1, last_used_at: now, section, ...(quantity ? { last_quantity: quantity } : {}), name: name.trim() })
      .eq('id', existing.id)
  } else {
    await db.from('shopping_history').insert({ home_id: homeId, name: name.trim(), name_key: key, section, last_quantity: quantity, times: 1, last_used_at: now })
  }
}

/** Fælles indsættelse for app, Siri-genvej og Google Home */
export async function insertShoppingItem(
  db: SupabaseClient,
  homeId: string,
  userId: string,
  name: string,
  quantity?: string | null,
  sectionOverride?: string | null
): Promise<ShoppingItem> {
  const trimmed = name.trim()
  const qty = quantity?.trim() || null
  const section = sectionOverride || (await resolveSection(db, homeId, trimmed))

  const { data, error } = await db
    .from('shopping_items')
    .insert({ home_id: homeId, name: trimmed, quantity: qty, added_by: userId, section })
    .select()
    .single()
  if (error) throw new Error(error.message)

  await bumpHistory(db, homeId, trimmed, section, qty)
  return data as ShoppingItem
}
