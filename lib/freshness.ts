import type { Task } from '@/lib/types'

export type FreshState = 'now' | 'soon' | 'ok' | 'none'

export interface Freshness {
  state: FreshState
  /** 0..1+ hvor 1 = intervallet er brugt op */
  ratio: number
  daysSince: number | null
  daysOver: number
  daysLeft: number
  label: string
  neverDone: boolean
}

const DAY = 86_400_000
export const SOON_THRESHOLD = 0.7

export function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / DAY)
}

export function getFreshness(task: Task, now = new Date()): Freshness {
  const neverDone = !task.last_completed_at
  const base = new Date(task.last_completed_at ?? task.created_at)
  const daysSince = Math.max(0, daysBetween(base, now))
  const sinceLabel = neverDone
    ? 'Aldrig gjort'
    : daysSince === 0 ? 'Gjort i dag'
    : daysSince === 1 ? 'Gjort i går'
    : `${daysSince} dage siden`

  if (!task.interval_days) {
    return {
      state: 'none', ratio: 0, daysSince: neverDone ? null : daysSince,
      daysOver: 0, daysLeft: 0, label: `${sinceLabel} · efter behov`, neverDone,
    }
  }

  const ratio = daysSince / task.interval_days
  const daysLeft = task.interval_days - daysSince
  const intervalLabel = formatInterval(task.interval_days)

  if (ratio >= 1) {
    const over = daysSince - task.interval_days
    return {
      state: 'now', ratio, daysSince, daysOver: over, daysLeft: 0, neverDone,
      label: over === 0
        ? `${sinceLabel} · ${intervalLabel}`
        : `${sinceLabel} · ${over} ${over === 1 ? 'dag' : 'dage'} over`,
    }
  }
  if (ratio >= SOON_THRESHOLD) {
    return {
      state: 'soon', ratio, daysSince, daysOver: 0, daysLeft, neverDone,
      label: `${sinceLabel} · om ${daysLeft} ${daysLeft === 1 ? 'dag' : 'dage'}`,
    }
  }
  return { state: 'ok', ratio, daysSince, daysOver: 0, daysLeft, neverDone, label: `${sinceLabel} · ${intervalLabel}` }
}

export function formatInterval(days: number | null): string {
  if (!days) return 'efter behov'
  if (days === 1) return 'hver dag'
  if (days === 7) return 'hver uge'
  if (days === 14) return 'hver 2. uge'
  if (days === 30 || days === 31) return 'hver måned'
  if (days % 7 === 0) return `hver ${days / 7}. uge`
  return `hver ${days}. dag`
}

export const INTERVAL_PRESETS: { days: number | null; label: string }[] = [
  { days: 1, label: 'Hver dag' },
  { days: 2, label: 'Hver 2. dag' },
  { days: 3, label: 'Hver 3. dag' },
  { days: 7, label: 'Hver uge' },
  { days: 14, label: 'Hver 2. uge' },
  { days: 30, label: 'Hver måned' },
  { days: null, label: 'Efter behov' },
]

const ORDER: Record<FreshState, number> = { now: 0, soon: 1, ok: 2, none: 3 }

/** Sortering: det der trænger mest først, derefter titel */
export function compareByFreshness(a: Task, b: Task, now = new Date()) {
  const fa = getFreshness(a, now)
  const fb = getFreshness(b, now)
  if (ORDER[fa.state] !== ORDER[fb.state]) return ORDER[fa.state] - ORDER[fb.state]
  if (fb.ratio !== fa.ratio) return fb.ratio - fa.ratio
  return a.title.localeCompare(b.title, 'da')
}

export const FRESH_STYLE: Record<FreshState, { bar: string; text: string; soft: string; dot: string }> = {
  now: { bar: 'bg-danger', text: 'text-danger-ink', soft: 'bg-danger-soft', dot: 'bg-danger' },
  soon: { bar: 'bg-warn', text: 'text-warn-ink', soft: 'bg-warn-soft', dot: 'bg-warn' },
  ok: { bar: 'bg-good', text: 'text-good-ink', soft: 'bg-good-soft', dot: 'bg-good' },
  none: { bar: 'bg-line', text: 'text-muted', soft: 'bg-ground', dot: 'bg-line' },
}
