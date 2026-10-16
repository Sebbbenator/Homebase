import { requireHome } from '@/lib/data/session'
import type { Absence, Completion, Home, HomeMember, Profiles, Reaction, RewardClaim, Task } from '@/lib/types'

export interface HomeData {
  userId: string
  userEmail: string | null
  homeId: string
  home: Home | null
  tasks: Task[]
  members: HomeMember[]
  profiles: Profiles
  completions: Completion[]
  reactions: Reaction[]
  absences: Absence[]
  claims: RewardClaim[]
}

/** Alt hvad Hjem og Opgaver skal bruge – hentet parallelt */
export async function loadHomeData(): Promise<HomeData> {
  const { supabase, user, homeId } = await requireHome()
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: home }, { data: tasks }, { data: members }, { data: completions }, { data: reactions }, { data: absences }, { data: claims }] = await Promise.all([
    supabase.from('homes').select().eq('id', homeId).maybeSingle(),
    supabase.from('tasks').select().eq('home_id', homeId).order('title'),
    supabase.from('home_members').select('id, home_id, user_id, joined_at').eq('home_id', homeId),
    supabase.from('preset_completions').select().eq('home_id', homeId).order('completed_at', { ascending: false }),
    supabase.from('completion_reactions').select().eq('home_id', homeId).gte('created_at', since),
    supabase.from('absences').select().eq('home_id', homeId).gte('to_date', today),
    supabase.from('reward_claims').select().eq('home_id', homeId),
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
      rotation: t.rotation ?? false,
    })),
    members: (members ?? []) as HomeMember[],
    profiles,
    completions: ((completions ?? []) as Completion[]).map((c) => ({ ...c, points: c.points ?? 10 })),
    reactions: (reactions ?? []) as Reaction[],
    absences: (absences ?? []) as Absence[],
    claims: (claims ?? []) as RewardClaim[],
  }
}
