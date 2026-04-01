import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { getProfilesMap } from '@/lib/actions/profile'
import type { ActivityLog, Profile } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: logs } = await supabase
    .from('activity_logs')
    .select()
    .eq('home_id', membership.home_id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Get unique user IDs from logs
  const userIds = [...new Set((logs ?? []).map((l) => l.user_id))]
  const profiles = await getProfilesMap(userIds)

  const enriched: ActivityLog[] = (logs ?? []).map((l) => ({
    ...l,
    user_email: profiles[l.user_id]?.display_name ?? (l.user_id === user.id ? user.email : undefined),
    user_emoji: profiles[l.user_id]?.avatar_emoji,
  }))

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-50">History</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Recent activity in your home</p>
      </div>
      <ActivityFeed logs={enriched} />
    </div>
  )
}
