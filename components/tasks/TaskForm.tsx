'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Repeat, Sparkles, Star } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Avatar } from '@/components/ui/Avatar'
import { createTask, updateTask } from '@/lib/actions/tasks'
import { CATEGORIES, TONE_CHIP } from '@/lib/categories'
import { INTERVAL_PRESETS } from '@/lib/freshness'
import { cn, displayName } from '@/lib/utils'
import type { HomeMember, Profiles, Task } from '@/lib/types'

export type TaskKind = 'normal' | 'special'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  editTask?: Task | null
  onSaved?: (task: Task) => void
  /** Hvilken type der foreslås ved oprettelse */
  defaultKind?: TaskKind
  members?: HomeMember[]
  profiles?: Profiles
  currentUserId?: string
}

const POINT_PRESETS = [5, 10, 15, 20, 30, 50]

const inputClass =
  'w-full h-12 px-4 bg-soft border-2 border-transparent rounded-2xl text-ink placeholder-faint text-[15px] font-semibold focus:outline-none focus:border-accent focus:bg-card transition'
const labelClass = 'block text-[13px] font-extrabold text-muted mb-2'
const numberClass =
  'h-10 px-3 bg-soft border-2 border-transparent rounded-full text-ink placeholder-faint text-[13px] font-bold text-center focus:outline-none focus:border-accent focus:bg-card [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

export function TaskForm({ open, onClose, editTask, onSaved, defaultKind = 'normal', members = [], profiles = {}, currentUserId }: TaskFormProps) {
  const [kind, setKind] = useState<TaskKind>(defaultKind)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState(10)
  const [category, setCategory] = useState<string>('other')
  const [interval, setInterval] = useState<number | null>(7)
  const [customInterval, setCustomInterval] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [rotation, setRotation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!editTask

  useEffect(() => {
    if (!open) return
    setKind(editTask ? (editTask.is_preset ? 'normal' : 'special') : defaultKind)
    setTitle(editTask?.title ?? '')
    setDescription(editTask?.description ?? '')
    setPoints(editTask?.points ?? 10)
    setCategory(editTask?.category ?? 'other')
    const iv = editTask ? editTask.interval_days : 7
    setInterval(iv)
    setCustomInterval(iv && !INTERVAL_PRESETS.some((p) => p.days === iv) ? String(iv) : '')
    setDueDate(editTask?.due_date ?? '')
    setAssignedTo(editTask?.assigned_to ?? '')
    setRotation(editTask?.rotation ?? false)
    setError('')
  }, [open, editTask, defaultKind])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setError('')
    setLoading(true)
    try {
      const base = { title: title.trim(), description: description.trim() || null, points, category }
      const input = kind === 'normal'
        ? { ...base, is_preset: true, interval_days: interval, rotation }
        : { ...base, is_preset: false, due_date: dueDate || null, assigned_to: assignedTo || null }
      const saved = isEdit && editTask ? await updateTask(editTask.id, input) : await createTask(input)
      onSaved?.(saved)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Noget gik galt')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? 'Rediger opgave' : kind === 'normal' ? 'Ny opgave' : 'Ny speciel opgave'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {!isEdit && (
          <div className="flex bg-soft rounded-full p-1" role="tablist" aria-label="Opgavetype">
            <button
              type="button" role="tab" aria-selected={kind === 'normal'} onClick={() => setKind('normal')}
              className={cn('flex-1 h-10 rounded-full text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors', kind === 'normal' ? 'bg-card text-ink shadow-card' : 'text-muted')}
            >
              <Repeat className="w-4 h-4" /> Normal
            </button>
            <button
              type="button" role="tab" aria-selected={kind === 'special'} onClick={() => setKind('special')}
              className={cn('flex-1 h-10 rounded-full text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors', kind === 'special' ? 'bg-card text-ink shadow-card' : 'text-muted')}
            >
              <Sparkles className="w-4 h-4" /> Speciel
            </button>
          </div>
        )}
        {!isEdit && (
          <p className="text-xs font-semibold text-faint -mt-2">
            {kind === 'normal'
              ? 'Tilbagevendende pligt med et interval – appen holder øje med, hvornår den trænger.'
              : 'Noget der skal gøres én gang, fx "Skift pære i gangen". Forsvinder fra listen, når den er klaret.'}
          </p>
        )}

        <div>
          <label htmlFor="task-title" className={labelClass}>Hvad skal gøres?</label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={kind === 'normal' ? 'fx Støvsuge stuen' : 'fx Skifte pære i gangen'}
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="task-desc" className={labelClass}>Beskrivelse <span className="font-semibold text-faint">(valgfri)</span></label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Hvad hører med?"
            rows={2}
            className={cn(inputClass, 'h-auto py-3 resize-none')}
          />
        </div>

        {kind === 'normal' ? (
          <div>
            <span className={labelClass}>Hvor ofte?</span>
            <div className="flex flex-wrap gap-2">
              {INTERVAL_PRESETS.map((p) => (
                <Chip key={String(p.days)} active={interval === p.days && !customInterval} onClick={() => { setInterval(p.days); setCustomInterval('') }}>
                  {p.label}
                </Chip>
              ))}
              <input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="Antal dage"
                aria-label="Eget interval i dage"
                value={customInterval}
                onChange={(e) => {
                  setCustomInterval(e.target.value)
                  const n = parseInt(e.target.value)
                  if (n > 0) setInterval(n)
                }}
                className={cn(numberClass, 'w-28')}
              />
            </div>
            {members.length > 1 && (
              <button
                type="button"
                role="switch"
                aria-checked={rotation}
                onClick={() => setRotation((v) => !v)}
                className="mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-soft text-left"
              >
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-sm font-extrabold">Skiftes til at gøre den</span>
                  <span className="text-xs font-semibold text-muted">Appen viser, hvis tur det er – den der har gjort den færrest gange</span>
                </span>
                <span className={cn('w-[50px] h-[30px] rounded-full p-[3px] flex items-center transition-colors flex-shrink-0', rotation ? 'bg-good justify-end' : 'bg-line justify-start')}>
                  <span className="w-6 h-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]" />
                </span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="task-due" className={cn(labelClass, 'flex items-center gap-1.5')}>
                <CalendarDays className="w-3.5 h-3.5 text-info-ink" /> Deadline <span className="font-semibold text-faint">(valgfri)</span>
              </label>
              <div className="flex gap-2">
                <input id="task-due" type="date" min={today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={cn(inputClass, 'flex-1')} />
                {dueDate && (
                  <button type="button" onClick={() => setDueDate('')} className="h-12 px-4 rounded-2xl bg-soft text-muted text-sm font-extrabold">Fjern</button>
                )}
              </div>
            </div>
            {members.length > 1 && (
              <div>
                <span className={labelClass}>Hvem skal gøre det? <span className="font-semibold text-faint">(valgfri)</span></span>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
                  <PersonChip active={assignedTo === ''} onClick={() => setAssignedTo('')} label="Hvem som helst" />
                  {members.map((m) => (
                    <PersonChip
                      key={m.user_id}
                      active={assignedTo === m.user_id}
                      onClick={() => setAssignedTo(m.user_id)}
                      id={m.user_id}
                      emoji={profiles[m.user_id]?.avatar_emoji}
                      label={m.user_id === currentUserId ? 'Mig' : displayName(profiles[m.user_id])}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div>
          <span className={labelClass}>Rum</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={cn(
                  'h-10 px-3.5 rounded-full text-[13px] font-extrabold transition-all border-2',
                  category === c.id ? cn(TONE_CHIP[c.tone], 'border-current') : 'bg-soft text-muted border-transparent'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={cn(labelClass, 'flex items-center gap-1.5')}>
            <Star className="w-3.5 h-3.5 text-accent" /> Point
          </span>
          <div className="flex flex-wrap gap-2">
            {POINT_PRESETS.map((p) => (
              <Chip key={p} active={points === p} onClick={() => setPoints(p)}>{p}</Chip>
            ))}
            <input
              type="number"
              inputMode="numeric"
              min={1}
              aria-label="Egne point"
              value={POINT_PRESETS.includes(points) ? '' : points}
              onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
              placeholder="Andet"
              className={cn(numberClass, 'w-20')}
            />
          </div>
        </div>

        {error && <p className="text-danger-ink text-sm font-bold bg-danger-soft rounded-xl px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 h-12 rounded-2xl bg-soft text-body font-extrabold text-[15px]">
            Annullér
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="flex-1 h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'Gemmer…' : isEdit ? 'Gem' : 'Opret opgave'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-10 px-3.5 rounded-full text-[13px] font-extrabold transition-all',
        active ? 'bg-ink text-ground dark:bg-accent dark:text-ink' : 'bg-soft text-muted'
      )}
    >
      {children}
    </button>
  )
}

function PersonChip({ active, onClick, id, emoji, label }: { active: boolean; onClick: () => void; id?: string; emoji?: string | null; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex-shrink-0 h-11 pl-1.5 pr-3.5 rounded-full border-2 flex items-center gap-2 text-[13px] font-extrabold transition-colors',
        active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-card text-body'
      )}
    >
      {id ? <Avatar id={id} emoji={emoji} name={label} size="sm" /> : <span className="w-8 h-8 rounded-full bg-soft flex items-center justify-center text-faint text-xs font-extrabold">?</span>}
      {label}
    </button>
  )
}
