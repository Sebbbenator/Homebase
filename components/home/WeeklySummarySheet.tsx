'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { Trophy } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Avatar } from '@/components/ui/Avatar'
import { cn, displayName } from '@/lib/utils'
import { helpersOf, pointsByUser, startOfWeek } from '@/lib/points'
import type { Completion, HomeMember, Profiles } from '@/lib/types'

interface WeeklySummarySheetProps {
  homeId: string
  completions: Completion[]
  members: HomeMember[]
  profiles: Profiles
  currentUserId: string
}

const MEDALS = ['🥇', '🥈', '🥉']

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}

/** Første gang appen åbnes i en ny uge: vis sidste uges resultat */
export function WeeklySummarySheet({ homeId, completions, members, profiles, currentUserId }: WeeklySummarySheetProps) {
  const key = `hb-weekly-seen:${homeId}`
  const thisWeek = useMemo(() => startOfWeek(new Date()), [])
  const weekKey = thisWeek.toISOString().slice(0, 10)
  const seen = useSyncExternalStore(
    subscribe,
    () => { try { return localStorage.getItem(key) } catch { return weekKey } },
    () => weekKey
  )
  const [dismissed, setDismissed] = useState(false)

  const ranking = useMemo(() => {
    const prevWeek = new Date(thisWeek.getTime() - 7 * 86_400_000)
    const inRange = completions.filter((c) => {
      const t = new Date(c.completed_at)
      return t >= prevWeek && t < thisWeek
    })
    if (inRange.length === 0) return []
    const points = pointsByUser(inRange, null)
    const counts: Record<string, number> = {}
    for (const c of inRange) {
      counts[c.completed_by] = (counts[c.completed_by] ?? 0) + 1
      for (const h of helpersOf(c)) counts[h] = (counts[h] ?? 0) + 1
    }
    return members
      .map((m) => ({ id: m.user_id, pts: points[m.user_id] ?? 0, count: counts[m.user_id] ?? 0 }))
      .filter((r) => r.pts > 0)
      .sort((a, b) => b.pts - a.pts)
  }, [completions, members, thisWeek])

  const open = !dismissed && seen !== weekKey && ranking.length > 0

  function close() {
    try { localStorage.setItem(key, weekKey) } catch { /* ignorér */ }
    setDismissed(true)
  }

  const winner = ranking[0]
  const iWon = winner?.id === currentUserId

  return (
    <Sheet open={open} onClose={close} title="Sidste uges resultat">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 text-center py-1">
          <span className="w-16 h-16 rounded-3xl bg-warn-soft flex items-center justify-center">
            <Trophy className="w-8 h-8 text-warn" />
          </span>
          <p className="text-sm font-semibold text-muted">
            {iWon ? 'Tillykke – du vandt ugen!' : `Tillykke til ${displayName(profiles[winner?.id])} ${profiles[winner?.id]?.avatar_emoji ?? ''}`}
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {ranking.map((r, i) => {
            const p = profiles[r.id]
            return (
              <li key={r.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl', i === 0 ? 'bg-warn-soft' : 'bg-soft')}>
                <Avatar id={r.id} emoji={p?.avatar_emoji} name={displayName(p)} size="md" />
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className={cn('text-sm font-extrabold truncate', i === 0 ? 'text-warn-ink' : 'text-ink')}>
                    {displayName(p)}{r.id === currentUserId && <span className="text-muted font-bold"> (dig)</span>}
                  </span>
                  <span className="text-xs font-semibold text-muted">{r.count} {r.count === 1 ? 'opgave' : 'opgaver'}</span>
                </div>
                <span className="font-display text-xl font-bold text-ink tabular-nums">{r.pts}</span>
                <span className="text-xl w-7 text-center">{MEDALS[i] ?? ''}</span>
              </li>
            )
          })}
        </ul>

        <button type="button" onClick={close} className="h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float">
          Fedt, luk!
        </button>
      </div>
    </Sheet>
  )
}
