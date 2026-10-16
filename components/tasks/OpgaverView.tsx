'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Plus, Repeat, Sparkles } from 'lucide-react'
import { TaskRow } from './TaskRow'
import { TaskSheet } from './TaskSheet'
import { TaskForm, type TaskKind } from './TaskForm'
import { Confetti } from '@/components/ui/Confetti'
import { Avatar } from '@/components/ui/Avatar'
import { useRealtimeTasks } from '@/lib/hooks/useRealtimeTasks'
import { useRealtimeCompletions } from '@/lib/hooks/useRealtimeCompletions'
import { useTaskActions } from '@/lib/hooks/useTaskActions'
import { deleteTask, reopenTask } from '@/lib/actions/tasks'
import { useToast } from '@/components/ui/Toast'
import { CATEGORIES } from '@/lib/categories'
import { compareByFreshness, getFreshness, isActive } from '@/lib/freshness'
import { nextUp } from '@/lib/rotation'
import { cn, displayName, formatDate } from '@/lib/utils'
import type { HomeData } from '@/lib/data/home'
import type { Task } from '@/lib/types'

type Filter = 'all' | 'now' | string

interface OpgaverViewProps {
  data: HomeData
  /** Fra ?task= (dybt link fra notifikationer) */
  initialOpenId?: string
  /** Fra ?filter= (fx "now") */
  initialFilter?: string
  /** Fra ?tab= ("special") */
  initialTab?: string
}

export function OpgaverView({ data, initialOpenId, initialFilter, initialTab }: OpgaverViewProps) {
  const [tasks, setTasks] = useRealtimeTasks(data.homeId, data.tasks)
  const [completions, setCompletions] = useRealtimeCompletions(data.homeId, data.completions)
  const { complete } = useTaskActions({ currentUserId: data.userId, setTasks, setCompletions })
  const toast = useToast()

  const initialTask = initialOpenId ? data.tasks.find((t) => t.id === initialOpenId) : undefined
  const [kind, setKind] = useState<TaskKind>(initialTab === 'special' || (initialTask && !initialTask.is_preset) ? 'special' : 'normal')
  const [filter, setFilter] = useState<Filter>(initialFilter === 'now' ? 'now' : 'all')
  const [openId, setOpenId] = useState<string | null>(initialTask ? initialTask.id : null)
  const [formOpen, setFormOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [justDone, setJustDone] = useState<string | null>(null)
  const [confetti, setConfetti] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const now = useMemo(() => new Date(), [])

  const turns = useMemo(() => {
    const map: Record<string, string | null> = {}
    for (const t of tasks) if (t.rotation) map[t.id] = nextUp(t, completions, data.members, data.absences, now)
    return map
  }, [tasks, completions, data.members, data.absences, now])

  const normal = useMemo(() => tasks.filter((t) => t.is_preset), [tasks])
  const specialOpen = useMemo(() => [...tasks.filter((t) => !t.is_preset && !t.is_completed)].sort((a, b) => compareByFreshness(a, b, now)), [tasks, now])
  const specialDone = useMemo(
    () => [...tasks.filter((t) => !t.is_preset && t.is_completed)].sort((a, b) => (b.last_completed_at ?? '').localeCompare(a.last_completed_at ?? '')),
    [tasks]
  )

  const counts = useMemo(() => {
    const c = { now: 0, soon: 0, ok: 0 }
    for (const t of normal) {
      const s = getFreshness(t, now).state
      if (s === 'now') c.now++
      else if (s === 'soon') c.soon++
      else c.ok++
    }
    return c
  }, [normal, now])
  const specialNow = useMemo(() => specialOpen.filter((t) => getFreshness(t, now).state === 'now').length, [specialOpen, now])

  const usedCategories = useMemo(() => new Set(normal.map((t) => t.category)), [normal])

  const visible = useMemo(() => {
    let list = normal
    if (filter === 'now') list = normal.filter((t) => getFreshness(t, now).state === 'now')
    else if (filter !== 'all') list = normal.filter((t) => t.category === filter)
    return [...list].sort((a, b) => compareByFreshness(a, b, now))
  }, [normal, filter, now])

  const groups = useMemo(() => {
    if (filter === 'now') return [{ id: 'now', label: 'Trænger nu', items: visible }]
    return CATEGORIES.map((c) => ({ id: c.id, label: c.label, items: visible.filter((t) => t.category === c.id) })).filter((g) => g.items.length > 0)
  }, [visible, filter])

  const openTask = openId ? tasks.find((t) => t.id === openId) ?? null : null

  async function handleComplete(task: Task, helperIds: string[] = []) {
    const wasHot = getFreshness(task, now).state === 'now'
    setJustDone(task.id)
    window.setTimeout(() => setJustDone(null), 700)
    if (wasHot) {
      setConfetti(true)
      window.setTimeout(() => setConfetti(false), 1000)
    }
    return complete(task, helperIds)
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

  async function handleReopen(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_completed: false } : t)))
    try {
      await reopenTask(task.id)
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_completed: true } : t)))
      toast.show('Kunne ikke genåbne')
    }
  }

  function handleSaved(task: Task) {
    setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev]))
    if (!task.is_preset) setKind('special')
  }

  const emptyAll = tasks.filter(isActive).length === 0

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-4">
      <Confetti show={confetti} />

      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold leading-none">Opgaver</h1>
        {kind === 'normal' ? (
          <div className="flex items-center gap-3 text-xs font-extrabold">
            <Count dot="bg-danger" text="text-danger-ink" n={counts.now} label="trænger" />
            <Count dot="bg-warn" text="text-warn-ink" n={counts.soon} label="snart" />
            <Count dot="bg-good" text="text-good-ink" n={counts.ok} label="fint" />
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs font-extrabold">
            <Count dot="bg-danger" text="text-danger-ink" n={specialNow} label="skal gøres" />
            <Count dot="bg-info" text="text-info-ink" n={specialOpen.length - specialNow} label="med deadline" />
            <Count dot="bg-good" text="text-good-ink" n={specialDone.length} label="klaret" />
          </div>
        )}
      </div>

      <div className="flex bg-soft rounded-full p-1" role="tablist" aria-label="Opgavetype">
        <button
          type="button" role="tab" aria-selected={kind === 'normal'} onClick={() => setKind('normal')}
          className={cn('relative flex-1 h-10 rounded-full text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors', kind === 'normal' ? 'bg-card text-ink shadow-card' : 'text-muted')}
        >
          <Repeat className="w-4 h-4" /> Normale
          {kind !== 'normal' && counts.now > 0 && <span className="w-2 h-2 rounded-full bg-danger" />}
        </button>
        <button
          type="button" role="tab" aria-selected={kind === 'special'} onClick={() => setKind('special')}
          className={cn('relative flex-1 h-10 rounded-full text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors', kind === 'special' ? 'bg-card text-ink shadow-card' : 'text-muted')}
        >
          <Sparkles className="w-4 h-4" /> Specielle
          {kind !== 'special' && specialNow > 0 && <span className="w-2 h-2 rounded-full bg-danger" />}
        </button>
      </div>

      {kind === 'normal' && normal.length > 0 && (
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

      {kind === 'normal' ? (
        normal.length === 0 ? (
          <Empty
            title={emptyAll ? 'Ingen opgaver endnu' : 'Ingen normale opgaver'}
            text="Tilføj husets faste pligter med et interval, så holder appen selv øje med, hvad der trænger."
            cta="Opret første opgave"
            onClick={() => { setEditTask(null); setFormOpen(true) }}
          />
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
                    profiles={data.profiles}
                    turnUserId={turns[t.id]}
                    currentUserId={data.userId}
                    onOpen={(task) => setOpenId(task.id)}
                    onComplete={(task) => handleComplete(task)}
                    justDone={justDone === t.id}
                    isLast={i === g.items.length - 1}
                  />
                ))}
              </div>
            </section>
          ))
        )
      ) : (
        <>
          {specialOpen.length === 0 ? (
            <Empty
              title="Ingen åbne specielle opgaver"
              text='Specielle opgaver er engangsting – fx "Skift pære i gangen". De forsvinder, når de er klaret.'
              cta="Opret speciel opgave"
              onClick={() => { setEditTask(null); setFormOpen(true) }}
            />
          ) : (
            <div className="bg-card rounded-card shadow-card overflow-hidden">
              {specialOpen.map((t, i) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  now={now}
                  profiles={data.profiles}
                  onOpen={(task) => setOpenId(task.id)}
                  onComplete={(task) => handleComplete(task)}
                  justDone={justDone === t.id}
                  isLast={i === specialOpen.length - 1}
                />
              ))}
            </div>
          )}

          {specialDone.length > 0 && (
            <section className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="flex items-center justify-between px-1 h-9 text-left"
              >
                <span className="text-xs font-extrabold text-faint uppercase tracking-wider">Klaret ({specialDone.length})</span>
                <ChevronDown className={cn('w-4 h-4 text-faint transition-transform', showDone && 'rotate-180')} />
              </button>
              {showDone && (
                <div className="bg-card/60 rounded-card overflow-hidden">
                  {specialDone.slice(0, 30).map((t, i) => {
                    const by = t.last_completed_by ? data.profiles[t.last_completed_by] : undefined
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setOpenId(t.id)}
                        className={cn('w-full flex items-center gap-3 px-4 py-3 text-left opacity-70', i < Math.min(specialDone.length, 30) - 1 && 'border-b border-line')}
                      >
                        <span className="w-7 h-7 rounded-full bg-good text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4" strokeWidth={3.5} />
                        </span>
                        <span className="flex-1 min-w-0 flex flex-col">
                          <span className="text-[15px] font-extrabold line-through truncate">{t.title}</span>
                          <span className="text-xs font-semibold text-muted">
                            {t.last_completed_at ? `${displayName(by)} · ${formatDate(t.last_completed_at)}` : 'Klaret'}
                          </span>
                        </span>
                        {by && <Avatar id={t.last_completed_by!} emoji={by.avatar_emoji} name={displayName(by)} size="xs" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => { setEditTask(null); setFormOpen(true) }}
        aria-label={kind === 'normal' ? 'Ny opgave' : 'Ny speciel opgave'}
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
        turnUserId={openTask ? turns[openTask.id] : null}
        onClose={() => setOpenId(null)}
        onComplete={handleComplete}
        onEdit={(task) => { setOpenId(null); setEditTask(task); setFormOpen(true) }}
        onDelete={handleDelete}
        onReopen={handleReopen}
      />

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editTask={editTask}
        onSaved={handleSaved}
        defaultKind={kind}
        members={data.members}
        profiles={data.profiles}
        currentUserId={data.userId}
      />
    </div>
  )
}

function Empty({ title, text, cta, onClick }: { title: string; text: string; cta: string; onClick: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-12">
      <span className="w-16 h-16 rounded-3xl bg-accent-soft flex items-center justify-center">
        <Plus className="w-8 h-8 text-accent-ink" strokeWidth={2.5} />
      </span>
      <p className="font-display text-xl font-semibold">{title}</p>
      <p className="text-sm font-semibold text-muted max-w-xs">{text}</p>
      <button onClick={onClick} className="mt-2 h-12 px-6 rounded-2xl bg-accent text-ink font-extrabold shadow-float">{cta}</button>
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
