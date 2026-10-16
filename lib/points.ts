import type { Completion } from '@/lib/types'

export type Period = 'week' | 'month' | 'all'

const WEEK = 7 * 86_400_000

/** Alle hjælpere på en fuldførelse (helper_ids, med fallback til det gamle helper_id) */
export function helpersOf(c: Pick<Completion, 'helper_id' | 'helper_ids'>): string[] {
  if (c.helper_ids && c.helper_ids.length) return c.helper_ids
  return c.helper_id ? [c.helper_id] : []
}

/** Deltog brugeren (som udfører eller hjælper)? */
export function involves(c: Completion, userId: string) {
  return c.completed_by === userId || helpersOf(c).includes(userId)
}

/** Mandag 00:00 i den uge `d` ligger i */
export function startOfWeek(d = new Date()) {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = (date.getDay() + 6) % 7 // mandag = 0
  date.setDate(date.getDate() - day)
  return date
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function periodStart(period: Period, now = new Date()): Date | null {
  if (period === 'week') return startOfWeek(now)
  if (period === 'month') return startOfMonth(now)
  return null
}

/** Point pr. bruger – både den der gjorde det og alle hjælpere får point */
export function pointsByUser(completions: Completion[], since: Date | null, until: Date | null = null): Record<string, number> {
  const out: Record<string, number> = {}
  for (const c of completions) {
    const t = new Date(c.completed_at)
    if (since && t < since) continue
    if (until && t >= until) continue
    out[c.completed_by] = (out[c.completed_by] ?? 0) + c.points
    for (const h of helpersOf(c)) out[h] = (out[h] ?? 0) + c.points
  }
  return out
}

export function rankOf(points: Record<string, number>, userId: string, memberIds: string[]) {
  const sorted = memberIds
    .map((id) => ({ id, pts: points[id] ?? 0 }))
    .sort((a, b) => b.pts - a.pts)
  const idx = sorted.findIndex((e) => e.id === userId)
  return { rank: idx + 1, total: sorted.length, sorted }
}

/** Uger i træk med mindst én fuldførelse (denne uge tæller hvis aktiv, ellers tælles fra sidste uge) */
export function weeklyStreak(completions: Completion[], userId: string, now = new Date()): number {
  const weeks = new Set<number>()
  for (const c of completions) {
    if (!involves(c, userId)) continue
    weeks.add(startOfWeek(new Date(c.completed_at)).getTime())
  }
  let cursor = startOfWeek(now).getTime()
  if (!weeks.has(cursor)) cursor -= WEEK
  let streak = 0
  while (weeks.has(cursor)) {
    streak++
    cursor -= WEEK
  }
  return streak
}
