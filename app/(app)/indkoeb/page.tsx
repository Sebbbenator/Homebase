import { requireHome } from '@/lib/data/session'
import { ShoppingView } from '@/components/shopping/ShoppingView'
import type { Profiles, ShoppingHistory, ShoppingItem } from '@/lib/types'

export default async function IndkoebPage() {
  const { supabase, user, homeId } = await requireHome()

  const [{ data: items }, { data: members }, { data: history }] = await Promise.all([
    supabase.from('shopping_items').select().eq('home_id', homeId).order('created_at', { ascending: false }),
    supabase.from('home_members').select('user_id').eq('home_id', homeId),
    supabase.from('shopping_history').select().eq('home_id', homeId).order('times', { ascending: false }).limit(200),
  ])

  const ids = (members ?? []).map((m) => m.user_id)
  const { data: profileRows } = ids.length ? await supabase.from('profiles').select().in('id', ids) : { data: [] }
  const profiles: Profiles = {}
  for (const p of profileRows ?? []) profiles[p.id] = p

  return (
    <ShoppingView
      initialItems={((items ?? []) as ShoppingItem[]).map((i) => ({ ...i, section: i.section ?? 'other' }))}
      initialHistory={(history ?? []) as ShoppingHistory[]}
      homeId={homeId}
      userId={user.id}
      profiles={profiles}
    />
  )
}
