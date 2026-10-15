'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { TaskRow } from './TaskRow'
import { TaskSheet } from './TaskSheet'
import { TaskForm } from './TaskForm'
import { Confetti } from '@/components/ui/Confetti'
import { useRealtimeTasks } from '@/lib/hooks/useRealtimeTasks'
import { useRealtimeCompletions } from '@/lib/hooks/useRealtimeCompletions'
import { useTaskActions } from '@/lib/hooks/useTaskActions'
import { deleteTask } from '@/lib/actions/tasks'
import { useToast } from '@/components/ui/Toast'
import { CATEGORIES } from '@/lib/categories'
import { compareByFreshness, getFreshness } from '@/lib/freshness'
import { cn } from '@/lib/utils'
import type { HomeData } from '@/lib/data/home'
import type { Task } from '@/lib/types'

type Filter = 'all' | 'now' | string

interface OpgaverViewProps {
  data: HomeData
  /** Fra ?task= (dybt link fra notifikationer) */
  initialOpenId?: string
  /** Fra ?filter= (fx "now") */
  initialFilter?: string
}

export function OpgaverView({ data, initialOpenId, initialFilter }: OpgaverViewProps) {
  const [tasks, setTasks] = useRealtimeTasks(data.homeId, data.tasks)
  const [completions, setCompletions] = useRealtimeCompletions(data.homeId, data.completions)
  const { complete } = useTaskActions({ currentUserId: data.userId, setTasks, setCompletions })
  const toast = useToast()

  const [filter, setFilter] = useState<Filter>(initialFilter === 'now' ? 'now' : 'all')
  const [openId, setOpenId] = useState<string | null>(initialOpenId && data.tasks.some((t) => t.id === initialOpenId) ? initialOpenId : null)
  const [formOpen, setFormOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [justDone, setJustDone] = useState<string | null>(null)
  const [confetti, setConfetti] = useState(false)

  const now = useMemo(() => new Date(), [])

  const counts = useMemo(() => {
    const c = { now: 0, soon: 0, ok: 0 }
    for (const t of tasks) {
      const s = getFreshness(t, now).state
      if (s === 'now') c.now++
      else if (s === 'soon') c.soon++
      else c.ok++
    }
    return c
  }, [tasks, now])

  const usedCategories = useMemo(() => new Set(tasks.map((t) => t.category)), [tasks])

  const visible = useMemo(() => {
    let list = tasks
    if (filter === 'now') list = tasks.filter((t) => getFreshness(t, now).state === 'now')
    else if (filter !== 'all') list = tasks.filter((t) => t.category === filter)
    return [...list].sort((a, b) => compareByFreshness(a, b, now))
  }, [tasks, filter, now])

  const groups = useMemo(() => {
    if (filter === 'now') return [{ id: 'now', label: 'Trænger nu', items: visible }]
    return CATEGORIES.map((c) => ({ id: c.id, label: c.label, items: visible.filter((t) => t.category === c.id) })).filter((g) => g.items.length > 0)
  }, [visible, filter])

  const openTask = openId ? tasks.find((t) => t.id === openId) ?? null : null

  async function handleComplete(task: Task, helperId: string | null = null) {
    const wasHot = getFreshness(task, now).state === 'now'
    setJustDone(task.id)
    window.setTimeout(() => setJustDone(null), 700)
    if (wasHot) {
      setConfetti(true)
      window.setTimeout(() => setConfetti(false), 1000)
    }
    return complete(task, helperId)
  }

  async function handleDelete(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    try {
      await deleteTask(task.id)
      toast.show(`"${task.title}" er slettet`)
    } catch {
      setTasks((prev) => [task, ...prev])
      toast.show('Kunne ikke slette')
    }
  }

  function handleSaved(task: Task) {
    setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev]))
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-4">
      <Confetti show={confetti} />

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold leading-none">Opgaver</h1>
          <div className="flex items-center gap-3 text-xs font-extrabold">
            <Count dot="bg-danger" text="text-danger-ink" n={counts.now} label="trænger" />
            <Count dot="bg-warn" text="text-warn-ink" n={counts.soon} label="snart" />
            <Count dot="bg-good" text="text-good-ink" n={counts.ok} label="fint" />
          </div>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>Alle</FilterChip>
          <FilterChip active={filter === 'now'} onClick={() => setFilter('now')} tone="danger">
            Trænger{counts.now > 0 && ` · ${counts.now}`}
          </FilterChip>
          {CATEGORIES.filter((c) => usedCategories.has(c.id)).map((c) => (
            <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>{c.label}</FilterChip>
          ))}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 py-14">
          <span className="w-16 h-16 rounded-3xl bg-accent-soft flex items-center justify-center">
            <Plus className="w-8 h-8 text-accent-ink" strokeWidth={2.5} />
          </span>
          <p className="font-display text-xl font-semibold">Ingen opgaver endnu</p>
          <p className="text-sm font-semibold text-muted max-w-xs">
            Tilføj husets faste pligter med et interval, så holder appen selv øje med, hvad der trænger.
          </p>
          <button onClick={() => { setEditTask(null); setFormOpen(true) }} className="mt-2 h-12 px-6 rounded-2xl bg-accent text-ink font-extrabold shadow-float">
            Opret første opgave
          </button>
        </div>
      ) : groups.length === 0 ? (
        <p className="text-center text-sm font-semibold text-muted py-12">Intet trænger lige nu – nyd det.</p>
      ) : (
        groups.map((g) => (
          <section key={g.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-[17px] font-semibold">{g.label}</h2>
              <span className="text-xs font-bold text-faint">{g.items.length} {g.items.length === 1 ? 'opgave' : 'opgaver'}</span>
            </div>
            <div className="bg-card rounded-card shadow-card overflow-hidden">
              {g.items.map((t, i) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  now={now}
                  onOpen={(task) => setOpenId(task.id)}
                  onComplete={(task) => handleComplete(task)}
                  justDone={justDone === t.id}
                  isLast={i === g.items.length - 1}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <button
        type="button"
        onClick={() => { setEditTask(null); setFormOpen(true) }}
        aria-label="Ny opgave"
        className="fixed z-30 right-5 bottom-[96px] w-14 h-14 rounded-full bg-accent text-ink flex items-center justify-center shadow-float active:scale-95 transition-transform sm:right-[calc(50%-16rem)]"
      >
        <Plus className="w-7 h-7" strokeWidth={3} />
      </button>

      <TaskSheet
        task={openTask}
        completions={completions}
        members={data.members}
        profiles={data.profiles}
        currentUserId={data.userId}
        onClose={() => setOpenId(null)}
        onComplete={handleComplete}
        onEdit={(task) => { setOpenId(null); setEditTask(task); setFormOpen(true) }}
        onDelete={handleDelete}
      />

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} editTask={editTask} onSaved={handleSaved} />
    </div>
  )
}

function Count({ dot, text, n, label }: { dot: string; text: string; n: number; label: string }) {
  return (
    <span className={cn('flex items-center gap-1.5', n === 0 ? 'text-faint' : text)}>
      <span className={cn('w-2 h-2 rounded-full', n === 0 ? 'bg-line' : dot)} />
      {n} {label}
    </span>
  )
}

function FilterChip({ active, onClick, children, tone }: { active: boolean; onClick: () => void; children: React.ReactNode; tone?: 'danger' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex-shrink-0 h-9 px-3.5 rounded-full text-[13px] font-extrabold transition-colors whitespace-nowrap',
        active
          ? tone === 'danger' ? 'bg-danger text-white' : 'bg-ink text-ground dark:bg-accent dark:text-ink'
          : 'bg-card text-body shadow-card'
      )}
    >
      {children}
    </button>
  )
}
