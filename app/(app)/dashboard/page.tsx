import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentHome } from '@/lib/actions/session'
import { TaskList } from '@/components/tasks/TaskList'
import { getProfilesMap } from '@/lib/actions/profile'
import { getPresetCompletions } from '@/lib/actions/tasks'
import type { Task, HomeMember, PresetCompletion } from '@/lib/types'

export default async function DashboardPage() {
  const home = await getCurrentHome()
  if (!home) redirect('/dashboard')

  const { user, homeId } = home
  const supabase = await createClient()

  // Fire independent queries in parallel. Profiles lookup chains after
  // members since it needs the member IDs.
  const [{ data: tasksRaw }, { data: membersRaw }, completionsRaw] = await Promise.all([
    supabase
      .from('tasks')
      .select()
      .eq('home_id', homeId)
      .order('created_at', { ascending: false }),
    supabase
      .from('home_members')
      .select('id, user_id, joined_at')
      .eq('home_id', homeId),
    getPresetCompletions(homeId),
  ])

  const memberIds = (membersRaw ?? []).map((m) => m.user_id)
  const profiles = await getProfilesMap(memberIds)

  const members: HomeMember[] = (membersRaw ?? []).map((m) => ({
    id: m.id,
    home_id: homeId,
    user_id: m.user_id,
    joined_at: m.joined_at,
    email: profiles[m.user_id]?.display_name ?? (m.user_id === user.id ? user.email : undefined),
  }))

  // Build display name map for tasks
  const nameMap: Record<string, string> = {}
  for (const id of memberIds) {
    nameMap[id] = profiles[id]?.display_name ?? (id === user.id ? (user.email ?? id) : id.slice(0, 8))
  }

  const tasks: Task[] = (tasksRaw ?? []).map((t) => ({
    ...t,
    is_preset: t.is_preset ?? false,
    preset_status: t.preset_status ?? 'idle',
    points: t.points ?? 10,
    category: t.category ?? 'other',
    assigned_email: t.assigned_to ? nameMap[t.assigned_to] : undefined,
    created_email: nameMap[t.created_by],
    assigned_emoji: t.assigned_to ? profiles[t.assigned_to]?.avatar_emoji : undefined,
    created_emoji: profiles[t.created_by]?.avatar_emoji,
  }))

  const completions: PresetCompletion[] = completionsRaw.map((c) => ({
    ...c,
    completed_email: nameMap[c.completed_by] || c.completed_by.slice(0, 8),
    completed_emoji: profiles[c.completed_by]?.avatar_emoji,
    helper_email: c.helper_id ? (nameMap[c.helper_id] || c.helper_id.slice(0, 8)) : undefined,
    helper_emoji: c.helper_id ? profiles[c.helper_id]?.avatar_emoji : undefined,
    helpers: (c.helper_ids ?? []).map((id: string) => ({
      id,
      email: nameMap[id] || id.slice(0, 8),
      emoji: profiles[id]?.avatar_emoji,
    })),
  }))

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <TaskList
        initialTasks={tasks}
        members={members}
        homeId={homeId}
        currentUserId={user.id}
        profiles={profiles}
        initialCompletions={completions}
      />
    </div>
  )
}
