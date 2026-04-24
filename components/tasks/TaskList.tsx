'use client'

import { useMemo, useState } from 'react'
import { PresetCard } from './PresetCard'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'
import { WeeklySummaryModal } from './WeeklySummaryModal'
import { useRealtimeTasks } from '@/lib/hooks/useRealtimeTasks'
import { Plus, ListTodo, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'
import { getGreeting } from '@/lib/utils'
import { CATEGORIES } from '@/lib/categories'
import type { Task, HomeMember, Profile, PresetCompletion } from '@/lib/types'

type TabId = 'weekly' | 'special'

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

  const [activeTab, setActiveTab] = useState<TabId>('weekly')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')

  const presetTasks = useMemo(() => tasks.filter((t) => t.is_preset), [tasks])
  const specialTasks = useMemo(() => tasks.filter((t) => !t.is_preset), [tasks])

  const completionsByTask = useMemo(() => {
    const map: Record<string, PresetCompletion[]> = {}
    for (const c of initialCompletions) {
      if (!map[c.task_id]) map[c.task_id] = []
      map[c.task_id].push(c)
    }
    return map
  }, [initialCompletions])

  // Active list depends on the selected tab
  const sourceTasks = activeTab === 'weekly' ? presetTasks : specialTasks

  const filteredTasks = filterCat === 'all'
    ? sourceTasks
    : sourceTasks.filter((t) => (t.category ?? 'other') === filterCat)

  const usedCategories = useMemo(
    () => new Set(sourceTasks.map((t) => t.category ?? 'other')),
    [sourceTasks]
  )

  // Weekly tasks: sort by needs_doing first, then alphabetical.
  // Special tasks: sort by completed last, then by due_date ascending, then created_at desc.
  const sortedTasks = useMemo(() => {
    const copy = [...filteredTasks]
    if (activeTab === 'weekly') {
      copy.sort((a, b) => {
        if (a.preset_status !== b.preset_status) {
          return a.preset_status === 'needs_doing' ? -1 : 1
        }
        return a.title.localeCompare(b.title)
      })
    } else {
      copy.sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1
        // Both incomplete or both complete: due_date ascending nulls last, then newest first
        const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity
        const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity
        if (aDue !== bDue) return aDue - bDue
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    }
    return copy
  }, [filteredTasks, activeTab])

  // Header stats based on the active tab
  const needsDoingCount = presetTasks.filter((t) => t.preset_status === 'needs_doing').length
  const openSpecialCount = specialTasks.filter((t) => !t.is_completed).length
  const greeting = getGreeting()

  function handleEdit(task: Task) {
    setEditTask(task)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditTask(null)
  }

  function handleTabChange(tab: TabId) {
    setActiveTab(tab)
    setFilterCat('all')
  }

  return (
    <>
      <WeeklySummaryModal />

      {/* Header */}
      <div className="relative mb-5 pt-2">
        {/* Subtle background glow */}
        <div className="absolute -top-4 -right-4 w-40 h-40 rounded-full bg-orange-500/8 blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-0.5">{greeting}</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">Opgaver</h1>

            {/* Stat chips */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {activeTab === 'weekly' ? (
                <>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] text-xs font-semibold text-zinc-300">
                    <ListTodo className="w-3.5 h-3.5 text-zinc-400" />
                    {presetTasks.length} opgaver
                  </span>
                  {needsDoingCount > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 text-xs font-semibold text-orange-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {needsDoingCount} afventer
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] text-xs font-semibold text-zinc-300">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                    {specialTasks.length} specielle
                  </span>
                  {openSpecialCount > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/15 text-xs font-semibold text-purple-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {openSpecialCount} åbne
                    </span>
                  )}
                </>
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

      {/* Tab switcher */}
      <div className="relative flex items-center gap-1 p-1 mb-4 bg-white/[0.04] border border-white/[0.05] rounded-2xl">
        <button
          onClick={() => handleTabChange('weekly')}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'weekly'
              ? 'bg-white/[0.08] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          Ugentlige
          {needsDoingCount > 0 && activeTab !== 'weekly' && (
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => handleTabChange('special')}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'special'
              ? 'bg-white/[0.08] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Specielle
          {openSpecialCount > 0 && activeTab !== 'special' && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          )}
        </button>
      </div>

      {/* Category filter tabs */}
      {sourceTasks.length > 0 && (
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
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
              {activeTab === 'weekly' ? (
                <ListTodo className="w-7 h-7 text-zinc-600" />
              ) : (
                <Sparkles className="w-7 h-7 text-zinc-600" />
              )}
            </div>
            <p className="text-zinc-500 text-sm font-medium">
              {filterCat !== 'all'
                ? 'Ingen opgaver i denne kategori'
                : activeTab === 'weekly'
                ? 'Ingen ugentlige opgaver endnu — tilføj en!'
                : 'Ingen specielle opgaver endnu — tilføj en!'}
            </p>
          </div>
        ) : activeTab === 'weekly' ? (
          sortedTasks.map((task) => (
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
        ) : (
          <div className="bg-[#16161e] border border-white/[0.05] rounded-3xl overflow-hidden">
            {sortedTasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                onEdit={handleEdit}
                isLast={i === sortedTasks.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      <TaskForm
        open={showForm}
        onClose={handleCloseForm}
        editTask={editTask}
        members={members}
        profiles={profiles}
        defaultIsPreset={activeTab === 'weekly'}
      />
    </>
  )
}
