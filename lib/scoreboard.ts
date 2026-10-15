import { createClient } from '@supabase/supabase-js'
import { pointsByUser, startOfWeek } from '@/lib/points'
import type { Completion } from '@/lib/types'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

type ProfileMap = Record<string, { name: string; emoji: string }>

async function profileMap(supabase: ReturnType<typeof admin>, userIds: string[]): Promise<ProfileMap> {
  if (userIds.length === 0) return {}
  const { data } = await supabase.from('profiles').select('id, display_name, avatar_emoji').in('id', userIds)
  const map: ProfileMap = {}
  for (const p of data ?? []) map[p.id] = { name: p.display_name || 'Ukendt', emoji: p.avatar_emoji || '😀' }
  return map
}

function medal(i: number) {
  return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`
}

/** Scoretavle som tekst (uge + altid) – bruges af Siri/IFTTT-endpoints og push */
export async function buildScoreboardText(homeId: string): Promise<string> {
  const supabase = admin()
  const { data } = await supabase.from('preset_completions').select().eq('home_id', homeId)
  const completions = (data ?? []) as Completion[]
  if (completions.length === 0) return 'Ingen point endnu!'

  const week = pointsByUser(completions, startOfWeek())
  const all = pointsByUser(completions, null)
  const ids = Object.keys(all)
  const profiles = await profileMap(supabase, ids)

  const lines = ids
    .sort((a, b) => (week[b] ?? 0) - (week[a] ?? 0) || all[b] - all[a])
    .map((id, i) => `${medal(i)} ${profiles[id]?.emoji ?? ''} ${profiles[id]?.name ?? 'Ukendt'}: ${week[id] ?? 0} i ugen · ${all[id]} i alt`)

  return lines.join('\n')
}

/** Ugens opsummering: antal fuldførelser og point pr. person de sidste 7 dage */
export async function buildWeeklyText(homeId: string): Promise<string> {
  const supabase = admin()
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const { data } = await supabase.from('preset_completions').select().eq('home_id', homeId).gte('completed_at', since.toISOString())
  const completions = (data ?? []) as Completion[]
  if (completions.length === 0) return 'Ingen opgaver fuldført denne uge 😴'

  const counts: Record<string, number> = {}
  for (const c of completions) counts[c.completed_by] = (counts[c.completed_by] ?? 0) + 1
  const points = pointsByUser(completions, null)
  const ids = Object.keys(points)
  const profiles = await profileMap(supabase, ids)

  const lines = ids
    .sort((a, b) => points[b] - points[a])
    .map((id, i) => `${medal(i)} ${profiles[id]?.emoji ?? ''} ${profiles[id]?.name ?? 'Ukendt'}: ${points[id]} point (${counts[id] ?? 0} opgaver)`)

  return `${completions.length} opgaver i alt!\n${lines.join('\n')}`
}
