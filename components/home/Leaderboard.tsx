'use client'

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn, displayName } from '@/lib/utils'
import { periodStart, pointsByUser, type Period } from '@/lib/points'
import type { Completion, HomeMember, Profiles } from '@/lib/types'

interface LeaderboardProps {
  completions: Completion[]
  members: HomeMember[]
  profiles: Profiles
  currentUserId: string
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'Uge' },
  { id: 'month', label: 'Måned' },
  { id: 'all', label: 'Altid' },
]

export function Leaderboard({ completions, members, profiles, currentUserId }: LeaderboardProps) {
  const [period, setPeriod] = useState<Period>('week')
  const points = pointsByUser(completions, periodStart(period))
  const rows = members
    .map((m) => ({ id: m.user_id, pts: points[m.user_id] ?? 0 }))
    .sort((a, b) => b.pts - a.pts)
  const top = rows[0]?.pts ?? 0

  return (
    <div className="bg-card rounded-card shadow-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[17px] font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warn" /> Scoretavle
        </h2>
        <div className="flex bg-soft rounded-full p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              aria-pressed={period === p.id}
              className={cn(
                'h-8 px-3 rounded-full text-xs font-extrabold transition-colors',
                period === p.id ? 'bg-card text-ink shadow-card' : 'text-muted'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {rows.map((r, i) => {
          const p = profiles[r.id]
          const isMe = r.id === currentUserId
          const leader = i === 0 && r.pts > 0
          return (
            <li
              key={r.id}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-2xl',
                leader && 'bg-warn-soft',
                isMe && !leader && 'bg-soft/60'
              )}
            >
              <span className={cn('w-5 text-center font-display text-sm font-bold', leader ? 'text-warn-ink' : 'text-faint')}>
                {leader ? <Trophy className="w-4 h-4 mx-auto" /> : i + 1}
              </span>
              <Avatar id={r.id} emoji={p?.avatar_emoji} name={displayName(p)} size="sm" />
              <span className="flex-1 min-w-0 text-sm font-extrabold text-ink truncate">
                {displayName(p)}{isMe && <span className="text-muted font-bold"> (dig)</span>}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-soft overflow-hidden max-w-[72px]" aria-hidden="true">
                <div className={cn('h-full rounded-full', leader ? 'bg-warn' : 'bg-accent')} style={{ width: top ? `${Math.round((r.pts / top) * 100)}%` : '0%' }} />
              </div>
              <span className={cn('font-display text-base font-bold tabular-nums', leader ? 'text-warn-ink' : 'text-ink')}>{r.pts}</span>
            </li>
          )
        })}
      </ul>
      {top === 0 && (
        <p className="text-xs font-semibold text-faint text-center">Ingen point endnu i denne periode – første opgave tæller.</p>
      )}
    </div>
  )
}
