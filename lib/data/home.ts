import { requireHome } from '@/lib/data/session'
import type { Completion, Home, HomeMember, Profiles, Task } from '@/lib/types'

export interface HomeData {
  userId: string
  userEmail: string | null
  homeId: string
  home: Home | null
  tasks: Task[]
  members: HomeMember[]
  profiles: Profiles
  completions: Completion[]
}

/** Alt hvad Hjem og Opgaver skal bruge – hentet parallelt */
export async function loadHomeData(): Promise<HomeData> {
  const { supabase, user, homeId } = await requireHome()

  const [{ data: home }, { data: tasks }, { data: members }, { data: completions }] = await Promise.all([
    supabase.from('homes').select().eq('id', homeId).maybeSingle(),
    supabase.from('tasks').select().eq('home_id', homeId).order('title'),
    supabase.from('home_members').select('id, home_id, user_id, joined_at').eq('home_id', homeId),
    supabase.from('preset_completions').select().eq('home_id', homeId).order('completed_at', { ascending: false }),
  ])

  const memberIds = (members ?? []).map((m) => m.user_id)
  const { data: profileRows } = memberIds.length
    ? await supabase.from('profiles').select().in('id', memberIds)
    : { data: [] }

  const profiles: Profiles = {}
  for (const p of profileRows ?? []) profiles[p.id] = p

  return {
    userId: user.id,
    userEmail: user.email ?? null,
    homeId,
    home: (home as Home | null) ?? null,
    tasks: ((tasks ?? []) as Task[]).map((t) => ({
      ...t,
      points: t.points ?? 10,
      category: t.category ?? 'other',
      is_preset: t.is_preset ?? true,
      is_completed: t.is_completed ?? false,
      due_date: t.due_date ?? null,
      assigned_to: t.assigned_to ?? null,
    })),
    members: (members ?? []) as HomeMember[],
    profiles,
    completions: ((completions ?? []) as Completion[]).map((c) => ({ ...c, points: c.points ?? 10 })),
  }
}
