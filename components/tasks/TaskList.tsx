'use client'

import { useState, useEffect } from 'react'
import { TaskCard } from './TaskCard'
import { PresetCard } from './PresetCard'
import { TaskForm } from './TaskForm'
import { TaskFilters, type FilterType } from './TaskFilters'
import { ProgressBar } from './ProgressBar'
import { useRealtimeTasks } from '@/lib/hooks/useRealtimeTasks'
import { Plus } from 'lucide-react'
import { isOverdue, getGreeting } from '@/lib/utils'
import type { Task, HomeMember, Profile, PresetCompletion } from '@/lib/types'

interface TaskListProps {
  initialTasks: Task[]
  members: HomeMember[]
  homeId: string
  currentUserId: string
  profiles?: Record<string, Profile>
  initialCompletions?: PresetCompletion[]
}

export function TaskList({ initialTasks, members, homeId, currentUserId, profiles = {}, initialCompletions = [] }: TaskListProps) {
  const tasks = useRealtimeTasks(homeId, initialTasks)

  // Separate presets from regular tasks
  const presetTasks = tasks.filter((t) => t.is_preset)
  const regularTasks = tasks.filter((t) => !t.is_preset)

  // Group completions by task_id
  const completionsByTask: Record<string, PresetCompletion[]> = {}
  for (const c of initialCompletions) {
    if (!completionsByTask[c.task_id]) completionsByTask[c.task_id] = []
    completionsByTask[c.task_id].push(c)
  }
  const [filter, setFilter] = useState<FilterType>('all')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const filtered = regularTasks
    .filter((t) => {
      // Hide completed repeating tasks — they auto-create a future occurrence
      const isCompletedRepeating = t.is_completed && t.repeat_type !== 'none'

      // Hide repeating tasks whose due date is still in the future (not yet due)
      const isFutureRepeating = !t.is_completed && t.repeat_type !== 'none' && t.due_date && (() => {
        const due = new Date(t.due_date!)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        due.setHours(0, 0, 0, 0)
        return due > today
      })()

      if (filter === 'mine') {
        const isMine = t.assigned_to === currentUserId || t.created_by === currentUserId
        return isMine && !isCompletedRepeating && !isFutureRepeating
      }
      if (filter === 'completed') return t.is_completed && !isCompletedRepeating
      return !t.is_completed && !isFutureRepeating
    })
    .sort((a, b) => {
      // Overdue first, then by due date (soonest first), then by creation
      const aOverdue = isOverdue(a.due_date) ? 0 : 1
      const bOverdue = isOverdue(b.due_date) ? 0 : 1
      if (aOverdue !== bOverdue) return aOverdue - bOverdue
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      if (a.due_date) return -1
      if (b.due_date) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Daily progress: tasks completed today + currently visible tasks
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const completedToday = tasks.filter((t) =>
    t.is_completed
    && t.completed_at
    && new Date(t.completed_at) >= todayStart
    && t.repeat_type === 'none' // exclude hidden completed repeating tasks
  ).length

  const visibleIncomplete = filtered.filter((t) => !t.is_completed).length
  const dailyTotal = visibleIncomplete + completedToday
  const pending = filtered.length
  const overdue = filtered.filter((t) => !t.is_completed && isOverdue(t.due_date)).length
  const greeting = getGreeting()

  function handleEdit(task: Task) {
    setEditTask(task)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditTask(null)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-neutral-500 font-medium">{greeting}</p>
          <h1 className="text-xl font-bold text-neutral-50">Tasks</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {pending} pending{overdue > 0 ? ` · ${overdue} overdue` : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-9 h-9 rounded-full bg-orange-600 hover:bg-orange-500 flex items-center justify-center transition-colors shadow-lg shadow-orange-600/20"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      <ProgressBar completed={completedToday} total={dailyTotal} />

      <TaskFilters active={filter} onChange={setFilter} />

      {/* Tasks grouped card */}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-neutral-500" />
            </div>
            <p className="text-neutral-500 text-sm">
              {filter === 'completed' ? 'No completed tasks yet' : 'No tasks yet — add one!'}
            </p>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            {filtered.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                onEdit={handleEdit}
                isLast={i === filtered.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preset tasks grouped card */}
      {presetTasks.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-1">Presets</p>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            {presetTasks
              .sort((a, b) => {
                if (a.preset_status !== b.preset_status) {
                  return a.preset_status === 'needs_doing' ? -1 : 1
                }
                return a.title.localeCompare(b.title)
              })
              .map((task, i) => (
                <PresetCard
                  key={task.id}
                  task={task}
                  completions={completionsByTask[task.id] ?? []}
                  currentUserId={currentUserId}
                  profiles={profiles}
                  onEdit={handleEdit}
                  isLast={i === presetTasks.length - 1}
                />
              ))}
          </div>
        </div>
      )}

      <TaskForm
        open={showForm}
        onClose={handleCloseForm}
        members={members}
        editTask={editTask}
      />
    </>
  )
}
