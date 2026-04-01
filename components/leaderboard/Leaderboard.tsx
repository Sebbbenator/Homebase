import { Avatar } from '@/components/ui/Avatar'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserPoints, Profile } from '@/lib/types'

interface LeaderboardProps {
  entries: UserPoints[]
  profiles?: Record<string, Profile>
}

export function Leaderboard({ entries, profiles = {} }: LeaderboardProps) {
  const sorted = [...entries].sort((a, b) => b.points - a.points)

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500 text-sm">No points yet — complete tasks to earn points!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((entry, i) => {
        const profile = profiles[entry.user_id]
        const name = profile?.display_name ?? entry.email?.split('@')[0] ?? entry.user_id.slice(0, 8)
        return (
          <div
            key={entry.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
              i === 0
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-neutral-900 border-neutral-800'
            )}
            style={{ animation: `fade-in-up 0.4s ${i * 0.08}s ease-out both` }}
          >
            <div className="w-6 text-center">
              {i === 0 ? (
                <Trophy className="w-4 h-4 text-yellow-400 mx-auto" />
              ) : (
                <span className="text-xs font-bold text-neutral-500">#{i + 1}</span>
              )}
            </div>

            {/* Gold ring for #1 */}
            {i === 0 ? (
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 animate-[spin_4s_linear_infinite]" />
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

            <span className="flex-1 text-sm font-medium text-neutral-200 truncate">
              {name}
            </span>
            <div className="text-right">
              <span className={cn('text-sm font-bold', i === 0 ? 'text-yellow-400' : 'text-neutral-300')}>
                {entry.points}
              </span>
              <span className="text-xs text-neutral-500 ml-1">pts</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
