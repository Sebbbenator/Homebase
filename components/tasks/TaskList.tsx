'use client'

import { useState } from 'react'
import { PresetCard } from './PresetCard'
import { TaskForm } from './TaskForm'
import { useRealtimeTasks } from '@/lib/hooks/useRealtimeTasks'
import { Plus } from 'lucide-react'
import { getGreeting } from '@/lib/utils'
import { CATEGORIES, getCategory } from '@/lib/categories'
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

  const presetTasks = tasks.filter((t) => t.is_preset)

  // Group completions by task_id
  const completionsByTask: Record<string, PresetCompletion[]> = {}
  for (const c of initialCompletions) {
    if (!completionsByTask[c.task_id]) completionsByTask[c.task_id] = []
    completionsByTask[c.task_id].push(c)
  }

  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')

  const needsDoing = presetTasks.filter((t) => t.preset_status === 'needs_doing').length
  const greeting = getGreeting()

  // Filter by category
  const filteredTasks = filterCat === 'all'
    ? presetTasks
    : presetTasks.filter((t) => (t.category ?? 'other') === filterCat)

  // Get categories that have tasks
  const usedCategories = new Set(presetTasks.map((t) => t.category ?? 'other'))

  // Group tasks by category for display
  const groupedTasks = filteredTasks
    .sort((a, b) => {
      if (a.preset_status !== b.preset_status) {
        return a.preset_status === 'needs_doing' ? -1 : 1
      }
      return a.title.localeCompare(b.title)
    })

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
            {presetTasks.length} tasks{needsDoing > 0 ? ` · ${needsDoing} needs doing` : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-9 h-9 rounded-full bg-orange-600 hover:bg-orange-500 flex items-center justify-center transition-colors shadow-lg shadow-orange-600/20"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Category filter tabs */}
      {presetTasks.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-1 scrollbar-hide">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              filterCat === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            All
          </button>
          {CATEGORIES.filter((c) => usedCategories.has(c.id)).map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                filterCat === c.id
                  ? c.color + ' border'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-neutral-500" />
            </div>
            <p className="text-neutral-500 text-sm">
              {filterCat !== 'all' ? 'No tasks in this category' : 'No tasks yet — add one!'}
            </p>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            {groupedTasks.map((task, i) => (
              <PresetCard
                key={task.id}
                task={task}
                completions={completionsByTask[task.id] ?? []}
                currentUserId={currentUserId}
                profiles={profiles}
                members={members}
                onEdit={handleEdit}
                isLast={i === groupedTasks.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      <TaskForm
        open={showForm}
        onClose={handleCloseForm}
        editTask={editTask}
      />
    </>
  )
}
