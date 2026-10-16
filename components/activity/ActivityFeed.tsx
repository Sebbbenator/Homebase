import { Avatar } from '@/components/ui/Avatar'
import { cn, displayName, formatDayHeading, formatRelative } from '@/lib/utils'
import type { ActivityLog, Profiles } from '@/lib/types'

interface ActivityFeedProps {
  logs: ActivityLog[]
  profiles: Profiles
}

function groupByDay(logs: ActivityLog[]) {
  const groups: { key: string; label: string; items: ActivityLog[] }[] = []
  for (const log of logs) {
    const key = log.created_at.slice(0, 10)
    let g = groups[groups.length - 1]
    if (!g || g.key !== key) {
      g = { key, label: formatDayHeading(log.created_at), items: [] }
      groups.push(g)
    }
    g.items.push(log)
  }
  return groups
}

function describe(action: string, title: string | null): { text: string; tone: string } {
  const t = title ? `"${title}"` : 'en opgave'
  switch (action) {
    case 'completed':
    case 'completed task':
    case 'completed preset task':
      return { text: `tog ${t}`, tone: 'text-good-ink' }
    case 'created':
    case 'created task':
      return { text: `oprettede ${t}`, tone: 'text-accent-ink' }
    case 'updated':
    case 'updated task':
      return { text: `redigerede ${t}`, tone: 'text-warn-ink' }
    case 'deleted':
      return { text: `slettede ${t}`, tone: 'text-danger-ink' }
    case 'undo':
      return { text: `fortrød ${t}`, tone: 'text-muted' }
    case 'reopened':
      return { text: `genåbnede ${t}`, tone: 'text-info-ink' }
    case 'claimed':
      return { text: `indløste præmien ${t}`, tone: 'text-warn-ink' }
    default:
      return { text: `${action} ${t}`, tone: 'text-muted' }
  }
}

export function ActivityFeed({ logs, profiles }: ActivityFeedProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-2 py-14">
        <p className="font-display text-xl font-semibold">Ingen aktivitet endnu</p>
        <p className="text-sm font-semibold text-muted">Når nogen gør noget i huset, dukker det op her.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-2">
      {groupByDay(logs).map((g) => (
        <section key={g.key} className="flex flex-col gap-2">
          <h2 className="text-xs font-extrabold text-faint uppercase tracking-wider px-1">{g.label}</h2>
          <div className="bg-card rounded-card shadow-card overflow-hidden">
            {g.items.map((log, i) => {
              const p = profiles[log.user_id]
              const d = describe(log.action, log.task_title)
              return (
                <div key={log.id} className={cn('flex items-center gap-3 px-4 py-3', i < g.items.length - 1 && 'border-b border-line')}>
                  <Avatar id={log.user_id} emoji={p?.avatar_emoji} name={displayName(p)} size="sm" />
                  <p className="flex-1 min-w-0 text-[13px] font-semibold text-body truncate">
                    <span className={cn('font-extrabold', d.tone)}>{displayName(p)}</span> {d.text}
                  </p>
                  <span className="text-[11px] font-bold text-faint whitespace-nowrap">{formatRelative(log.created_at)}</span>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
