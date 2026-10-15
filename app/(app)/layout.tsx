import { redirect } from 'next/navigation'
import { getSession } from '@/lib/data/session'
import { getFreshness } from '@/lib/freshness'
import { BottomNav } from '@/components/layout/BottomNav'
import { HomeSetup } from '@/components/layout/HomeSetup'
import type { Task } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, homeId } = await getSession()
  if (!user) redirect('/login')
  if (!homeId) return <HomeSetup />

  const [{ data: tasks }, { count: shoppingCount }] = await Promise.all([
    supabase.from('tasks').select('id, interval_days, last_completed_at, created_at').eq('home_id', homeId).eq('is_preset', true),
    supabase.from('shopping_items').select('*', { count: 'exact', head: true }).eq('home_id', homeId).eq('is_purchased', false),
  ])

  const tasksCount = ((tasks ?? []) as Task[]).filter((t) => getFreshness(t).state === 'now').length

  return (
    <div className="min-h-dvh pb-28">
      <div className="anim-page">{children}</div>
      <BottomNav tasksCount={tasksCount} shoppingCount={shoppingCount ?? 0} />
    </div>
  )
}
