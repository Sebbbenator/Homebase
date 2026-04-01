'use client'

import { useState, useRef, useCallback } from 'react'
import { Calendar, RefreshCw, Trash2, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { cn, smartDueDate, isOverdue } from '@/lib/utils'
import { completeTask, uncompleteTask, deleteTask } from '@/lib/actions/tasks'
import type { Task } from '@/lib/types'

interface TaskCardProps {
  task: Task
  currentUserId: string
  onEdit: (task: Task) => void
  isLast?: boolean
}

const CONFETTI_COLORS = ['#f97316', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#f472b6']

function Confetti({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {Array.from({ length: 12 }).map((_, i) => {
        const left = 10 + Math.random() * 80
        const delay = Math.random() * 0.3
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        const size = 4 + Math.random() * 4
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: '50%',
              width: size,
              height: size,
              backgroundColor: color,
              animation: `confetti-pop 0.6s ${delay}s ease-out both`,
            }}
          />
        )
      })}
    </div>
  )
}

export function TaskCard({ task, currentUserId, onEdit, isLast }: TaskCardProps) {
  const [loading, setLoading] = useState(false)
  const [bouncing, setBouncing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const touchStartX = useRef(0)
  const overdue = !task.is_completed && isOverdue(task.due_date)

  async function handleToggle() {
    setLoading(true)
    setBouncing(true)
    setTimeout(() => setBouncing(false), 350)

    try {
      if (task.is_completed) {
        await uncompleteTask(task.id)
      } else {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 800)
        await completeTask(task.id)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return
    setLoading(true)
    try {
      await deleteTask(task.id)
    } finally {
      setLoading(false)
    }
  }

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.touches[0].clientX
    if (diff > 0) setSwipeX(Math.min(diff, 100))
    else setSwipeX(0)
  }, [])

  const onTouchEnd = useCallback(() => {
    setSwipeX(swipeX > 50 ? 100 : 0)
  }, [swipeX])

  return (
    <div className="swipe-container overflow-hidden relative">
      {/* Swipe-revealed actions */}
      <div className="swipe-actions">
        <button
          onClick={() => onEdit(task)}
          className="w-9 h-9 rounded-xl bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="w-9 h-9 rounded-xl bg-red-600/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Row content */}
      <div
        className={cn(
          'swipe-content group relative px-4 py-3.5 transition-all',
          overdue && 'bg-red-500/5',
          !isLast && 'border-b border-neutral-800/60'
        )}
        style={{ transform: `translateX(-${swipeX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Confetti show={showConfetti} />

        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            disabled={loading}
            className={cn(
              'mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
              bouncing && 'animate-[bounce-check_0.35s_ease-out]',
              task.is_completed
                ? 'bg-orange-600 border-orange-600'
                : overdue
                ? 'border-red-500/60 hover:border-red-400'
                : 'border-neutral-600 hover:border-orange-500'
            )}
          >
            {task.is_completed && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium leading-snug',
                task.is_completed ? 'line-through text-neutral-500' : 'text-neutral-100'
              )}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{task.description}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {(() => {
                const due = smartDueDate(task.due_date)
                return due ? (
                  <span className={cn('flex items-center gap-1 text-xs font-medium', due.color)}>
                    <Calendar className="w-3 h-3" />
                    {due.label}
                  </span>
                ) : null
              })()}
              {task.repeat_type !== 'none' && (
                <Badge variant="orange">
                  <RefreshCw className="w-2.5 h-2.5" />
                  {task.repeat_type === 'biweekly' ? '2 weeks' : task.repeat_type}
                </Badge>
              )}
            </div>
          </div>

          {/* Avatar + desktop actions */}
          <div className="flex items-center gap-1.5">
            {task.assigned_email && (
              <Avatar email={task.assigned_email} emoji={task.assigned_emoji} size="sm" />
            )}
            {task.created_by === currentUserId && (
              <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
