import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskList } from '@/components/tasks/TaskList'
import { getProfilesMap } from '@/lib/actions/profile'
import { getPresetCompletions } from '@/lib/actions/tasks'
import type { Task, HomeMember, Profile, PresetCompletion } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('home_members')
    .select('home_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const homeId = membership.home_id

  // Fetch tasks
  const { data: tasksRaw } = await supabase
    .from('tasks')
    .select()
    .eq('home_id', homeId)
    .order('created_at', { ascending: false })

  // Fetch all members
  const { data: membersRaw } = await supabase
    .from('home_members')
    .select('id, user_id, joined_at')
    .eq('home_id', homeId)

  const memberIds = (membersRaw ?? []).map((m) => m.user_id)

  // Fetch profiles for all members + preset completions
  const [profiles, completionsRaw] = await Promise.all([
    getProfilesMap(memberIds),
    getPresetCompletions(homeId),
  ])

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
    assigned_email: t.assigned_to ? nameMap[t.assigned_to] : undefined,
    created_email: nameMap[t.created_by],
    assigned_emoji: t.assigned_to ? profiles[t.assigned_to]?.avatar_emoji : undefined,
    created_emoji: profiles[t.created_by]?.avatar_emoji,
  }))

  const completions: PresetCompletion[] = completionsRaw.map((c) => ({
    ...c,
    completed_email: nameMap[c.completed_by] || c.completed_by.slice(0, 8),
    completed_emoji: profiles[c.completed_by]?.avatar_emoji,
  }))

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
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
