import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingList } from '@/components/shopping/ShoppingList'
import type { ShoppingItem } from '@/lib/types'

export default async function ShoppingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: items } = await supabase
    .from('shopping_items')
    .select()
    .eq('home_id', membership.home_id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <ShoppingList
        initialItems={(items ?? []) as ShoppingItem[]}
        homeId={membership.home_id}
      />
    </div>
  )
}
