import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentHome } from '@/lib/actions/session'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { getProfilesMap } from '@/lib/actions/profile'
import type { ActivityLog } from '@/lib/types'

export default async function HistoryPage() {
  const home = await getCurrentHome()
  if (!home) redirect('/dashboard')

  const { user, homeId } = home
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('activity_logs')
    .select()
    .eq('home_id', homeId)
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
      <div className="relative mb-6 pt-2">
        <div className="absolute -top-4 -right-4 w-40 h-40 rounded-full bg-blue-500/6 blur-3xl pointer-events-none" />
        <h1 className="text-3xl font-bold text-white tracking-tight">Aktivitet</h1>
        <p className="text-sm text-zinc-500 mt-1 font-medium">Seneste aktivitet i jeres hjem</p>
      </div>
      <ActivityFeed logs={enriched} />
    </div>
  )
}
