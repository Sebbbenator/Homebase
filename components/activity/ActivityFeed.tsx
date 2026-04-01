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
  const task = taskTitle ? `"${taskTitle}"` : 'a task'
  switch (action) {
    case 'created task': return `Created ${task}`
    case 'completed task': return `Completed ${task}`
    case 'updated task': return `Updated ${task}`
    default: return `${action} ${task}`
  }
}

function actionColor(action: string): string {
  if (action.includes('completed')) return 'text-green-400'
  if (action.includes('created')) return 'text-orange-400'
  if (action.includes('updated')) return 'text-amber-400'
  return 'text-neutral-400'
}

export function ActivityFeed({ logs }: ActivityFeedProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mb-3">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-neutral-500 text-sm">No activity yet</p>
      </div>
    )
  }

  const grouped = groupByDate(logs)

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([day, dayLogs]) => (
        <div key={day}>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 px-1">
            {day}
          </p>
          <div className="space-y-1">
            {dayLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-900 transition-colors"
              >
                <Avatar
                  email={log.user_email ?? log.user_id}
                  emoji={log.user_emoji}
                  size="sm"
                  className="mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-300">
                    <span className={`font-medium ${actionColor(log.action)}`}>
                      {log.user_email?.split('@')[0] ?? 'Someone'}
                    </span>
                    {' '}
                    <span className="text-neutral-400">
                      {actionText(log.action, log.task_title)}
                    </span>
                  </p>
                </div>
                <span className="text-xs text-neutral-600 flex-shrink-0 mt-0.5">
                  {formatRelative(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
