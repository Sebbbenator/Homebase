import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentHome } from '@/lib/actions/session'
import { ShoppingList } from '@/components/shopping/ShoppingList'
import type { ShoppingItem } from '@/lib/types'

export default async function ShoppingPage() {
  const home = await getCurrentHome()
  if (!home) redirect('/dashboard')

  const supabase = await createClient()
  const { data: items } = await supabase
    .from('shopping_items')
    .select()
    .eq('home_id', home.homeId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <ShoppingList
        initialItems={(items ?? []) as ShoppingItem[]}
        homeId={home.homeId}
      />
    </div>
  )
}
