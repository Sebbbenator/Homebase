'use client'

import { Sparkles, Repeat } from 'lucide-react'
import { cn, displayName } from '@/lib/utils'
import { getFreshness } from '@/lib/freshness'
import { getCategory, TONE_CHIP } from '@/lib/categories'
import { Avatar } from '@/components/ui/Avatar'
import { FreshBar } from './FreshBar'
import { CompleteButton } from './CompleteButton'
import type { Profiles, Task } from '@/lib/types'

interface TaskRowProps {
  task: Task
  onOpen: (task: Task) => void
  onComplete: (task: Task) => void
  showCategory?: boolean
  profiles?: Profiles
  /** Hvis tur er det (rotation) */
  turnUserId?: string | null
  currentUserId?: string
  justDone?: boolean
  isLast?: boolean
  now?: Date
}

export function TaskRow({ task, onOpen, onComplete, showCategory, profiles, turnUserId, currentUserId, justDone, isLast, now }: TaskRowProps) {
  const fresh = getFreshness(task, now)
  const category = getCategory(task.category)
  const assignee = !task.is_preset && task.assigned_to ? profiles?.[task.assigned_to] : undefined
  const myTurn = !!turnUserId && turnUserId === currentUserId
  const turnName = turnUserId && !myTurn ? displayName(profiles?.[turnUserId]) : null

  return (
    <div className={cn('flex items-center gap-3 pl-4 pr-3 py-3', !isLast && 'border-b border-line')}>
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="flex-1 min-w-0 text-left flex flex-col gap-1.5 min-h-[44px] justify-center"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-[15px] font-extrabold text-ink truncate">{task.title}</span>
          {!task.is_preset && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-info-soft text-info-ink flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Speciel
            </span>
          )}
          {showCategory && task.is_preset && (
            <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0', TONE_CHIP[category.tone])}>
              {category.label}
            </span>
          )}
          {myTurn && (
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 bg-info text-white flex items-center gap-1">
              <Repeat className="w-3 h-3" /> Din tur
            </span>
          )}
          {turnName && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-soft text-muted flex items-center gap-1">
              <Repeat className="w-3 h-3" /> {turnName}s tur
            </span>
          )}
          {assignee && (
            <Avatar id={task.assigned_to!} emoji={assignee.avatar_emoji} name={displayName(assignee)} size="xs" className="flex-shrink-0" />
          )}
        </span>
        <FreshBar fresh={fresh} />
      </button>
      <span className="text-xs font-extrabold text-muted flex-shrink-0">+{task.points}</span>
      <CompleteButton state={fresh.state} label={task.title} onClick={() => onComplete(task)} justDone={justDone} />
    </div>
  )
}
