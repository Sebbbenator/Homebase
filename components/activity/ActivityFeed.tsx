import { Avatar } from '@/components/ui/Avatar'
import { formatRelative, formatDate } from '@/lib/utils'
import type { ActivityLog } from '@/lib/types'

interface ActivityFeedProps {
  logs: ActivityLog[]
}

function groupByDate(logs: ActivityLog[]): Record<string, ActivityLog[]> {
  return logs.reduce<Record<string, ActivityLog[]>>((acc, log) => {
    const day = formatDate(log.created_at)
    if (!acc[day]) acc[day] = []
    acc[day].push(log)
    return acc
  }, {})
}

function actionText(action: string, taskTitle: string | null): string {
  const task = taskTitle ? `"${taskTitle}"` : 'en opgave'
  switch (action) {
    case 'created task': return `oprettede ${task}`
    case 'completed task': return `fuldførte ${task}`
    case 'completed preset task': return `fuldførte ${task}`
    case 'updated task': return `opdaterede ${task}`
    default: return `${action} ${task}`
  }
}

function actionStyles(action: string): { color: string; bg: string; dot: string } {
  if (action.includes('completed')) return {
    color: 'text-green-400',
    bg: 'border-l-green-500/60',
    dot: 'bg-green-500',
  }
  if (action.includes('created')) return {
    color: 'text-orange-400',
    bg: 'border-l-orange-500/60',
    dot: 'bg-orange-500',
  }
  if (action.includes('updated')) return {
    color: 'text-amber-400',
    bg: 'border-l-amber-500/60',
    dot: 'bg-amber-500',
  }
  return {
    color: 'text-zinc-400',
    bg: 'border-l-zinc-600/60',
    dot: 'bg-zinc-600',
  }
}

export function ActivityFeed({ logs }: ActivityFeedProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <p className="text-zinc-500 text-sm font-medium">Ingen aktivitet endnu</p>
      </div>
    )
  }

  const grouped = groupByDate(logs)

  return (
    <div className="space-y-6 pb-4">
      {Object.entries(grouped).map(([day, dayLogs]) => (
        <div key={day}>
          {/* Date pill */}
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex px-3 py-1 rounded-full bg-white/[0.05] text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {day}
            </span>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>

          <div className="space-y-2">
            {dayLogs.map((log) => {
              const styles = actionStyles(log.action)
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 px-4 py-3.5 rounded-3xl bg-[#16161e] border border-l-4 border-white/[0.04] ${styles.bg} transition-all`}
                >
                  <Avatar
                    email={log.user_email ?? log.user_id}
                    emoji={log.user_emoji}
                    size="sm"
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 leading-snug">
                      <span className={`font-bold ${styles.color}`}>
                        {log.user_email?.split('@')[0] ?? 'Nogen'}
                      </span>
                      {' '}
                      <span className="text-zinc-400 font-medium">
                        {actionText(log.action, log.task_title)}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600 flex-shrink-0 mt-0.5 font-medium">
                    {formatRelative(log.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
