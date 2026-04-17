import { Avatar } from '@/components/ui/Avatar'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserPoints, Profile } from '@/lib/types'

interface LeaderboardProps {
  entries: UserPoints[]
  profiles?: Record<string, Profile>
}

const MEDALS = ['🥇', '🥈', '🥉']

export function Leaderboard({ entries, profiles = {} }: LeaderboardProps) {
  const sorted = [...entries].sort((a, b) => b.points - a.points)

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-600 text-sm font-medium">Ingen point endnu — udfør opgaver for at tjene point!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((entry, i) => {
        const profile = profiles[entry.user_id]
        const name = profile?.display_name ?? entry.email?.split('@')[0] ?? entry.user_id.slice(0, 8)
        const isFirst = i === 0

        return (
          <div
            key={entry.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all',
              isFirst
                ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border-yellow-500/20'
                : 'bg-white/[0.03] border-white/[0.04]'
            )}
            style={{ animation: `fade-in-up 0.4s ${i * 0.08}s ease-out both` }}
          >
            {/* Rank */}
            <div className="w-7 text-center flex-shrink-0">
              {i < 3 ? (
                <span className="text-lg leading-none">{MEDALS[i]}</span>
              ) : (
                <span className="text-xs font-bold text-zinc-600">#{i + 1}</span>
              )}
            </div>

            {/* Avatar with gold ring for #1 */}
            {isFirst ? (
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-yellow-400 to-amber-500" />
                <div className="relative">
                  <Avatar
                    emoji={profile?.avatar_emoji}
                    email={entry.email ?? entry.user_id}
                    displayName={profile?.display_name}
                    size="sm"
                  />
                </div>
              </div>
            ) : (
              <Avatar
                emoji={profile?.avatar_emoji}
                email={entry.email ?? entry.user_id}
                displayName={profile?.display_name}
                size="sm"
              />
            )}

            <span className={cn(
              'flex-1 text-sm font-semibold truncate',
              isFirst ? 'text-yellow-300' : 'text-zinc-200'
            )}>
              {name}
            </span>

            <div className="flex items-center gap-1.5">
              <Star className={cn('w-3.5 h-3.5', isFirst ? 'text-yellow-400 fill-yellow-400' : 'text-orange-400 fill-orange-400')} />
              <span className={cn('text-sm font-bold', isFirst ? 'text-yellow-400' : 'text-zinc-300')}>
                {entry.points}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
