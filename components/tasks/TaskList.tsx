'use client'

import { useState } from 'react'
import { PresetCard } from './PresetCard'
import { TaskForm } from './TaskForm'
import { WeeklySummaryModal } from './WeeklySummaryModal'
import { useRealtimeTasks } from '@/lib/hooks/useRealtimeTasks'
import { Plus, ListTodo, AlertCircle } from 'lucide-react'
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

  const filteredTasks = filterCat === 'all'
    ? presetTasks
    : presetTasks.filter((t) => (t.category ?? 'other') === filterCat)

  const usedCategories = new Set(presetTasks.map((t) => t.category ?? 'other'))

  const groupedTasks = [...filteredTasks].sort((a, b) => {
    if (a.preset_status !== b.preset_status) {
      return a.preset_status === 'needs_doing' ? -1 : 1
    }
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0
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
      <WeeklySummaryModal />

      {/* Header */}
      <div className="relative mb-6 pt-2">
        {/* Subtle background glow */}
        <div className="absolute -top-4 -right-4 w-40 h-40 rounded-full bg-orange-500/8 blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-0.5">{greeting}</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">Opgaver</h1>

            {/* Stat chips */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] text-xs font-semibold text-zinc-300">
                <ListTodo className="w-3.5 h-3.5 text-zinc-400" />
                {presetTasks.length} opgaver
              </span>
              {needsDoing > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 text-xs font-semibold text-orange-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {needsDoing} afventer
                </span>
              )}
            </div>
          </div>

          {/* FAB */}
          <button
            onClick={() => setShowForm(true)}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 flex items-center justify-center transition-all shadow-lg shadow-orange-600/30 active:scale-95 flex-shrink-0"
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      {presetTasks.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-2xl whitespace-nowrap transition-all ${
              filterCat === 'all'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-300'
            }`}
          >
            Alle
          </button>
          {CATEGORIES.filter((c) => usedCategories.has(c.id)).map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-2xl whitespace-nowrap transition-all ${
                filterCat === c.id
                  ? `${c.activeColor} shadow-md`
                  : 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2 pb-4">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
              <Plus className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">
              {filterCat !== 'all' ? 'Ingen opgaver i denne kategori' : 'Ingen opgaver endnu — tilføj en!'}
            </p>
          </div>
        ) : (
          groupedTasks.map((task) => (
            <PresetCard
              key={task.id}
              task={task}
              completions={completionsByTask[task.id] ?? []}
              currentUserId={currentUserId}
              profiles={profiles}
              members={members}
              onEdit={handleEdit}
            />
          ))
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
