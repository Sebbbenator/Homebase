import type { Absence, Completion, HomeMember, Task } from '@/lib/types'

export function dateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Er brugeren væk på den givne dag? */
export function isAbsent(absences: Absence[], userId: string, day: string) {
  return absences.some((a) => a.user_id === userId && a.from_date <= day && a.to_date >= day)
}

/** Aktive og kommende fravær (til visning) */
export function upcomingAbsences(absences: Absence[], today: string, days = 14) {
  const limit = new Date(today)
  limit.setDate(limit.getDate() + days)
  const limitKey = dateKey(limit)
  return absences
    .filter((a) => a.to_date >= today && a.from_date <= limitKey)
    .sort((a, b) => a.from_date.localeCompare(b.from_date))
}

/**
 * Hvis tur er det? Den der har gjort opgaven færrest gange (fraværende springes over);
 * ved lighed den, der har gjort den længst siden. Deterministisk via user_id.
 */
export function nextUp(task: Task, completions: Completion[], members: HomeMember[], absences: Absence[] = [], now = new Date()): string | null {
  if (!task.rotation) return null
  const today = dateKey(now)
  const eligible = members.map((m) => m.user_id).filter((id) => !isAbsent(absences, id, today))
  if (eligible.length === 0) return null
  if (eligible.length === 1) return eligible[0]

  const counts: Record<string, number> = {}
  const last: Record<string, string> = {}
  for (const c of completions) {
    if (c.task_id !== task.id) continue
    counts[c.completed_by] = (counts[c.completed_by] ?? 0) + 1
    if (!last[c.completed_by] || c.completed_at > last[c.completed_by]) last[c.completed_by] = c.completed_at
  }

  return [...eligible].sort((a, b) => {
    const ca = counts[a] ?? 0
    const cb = counts[b] ?? 0
    if (ca !== cb) return ca - cb
    const la = last[a] ?? ''
    const lb = last[b] ?? ''
    if (la !== lb) return la.localeCompare(lb)
    return a.localeCompare(b)
  })[0]
}
