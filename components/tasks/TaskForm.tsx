'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { createTask, updateTask } from '@/lib/actions/tasks'
import { CATEGORIES, TONE_CHIP } from '@/lib/categories'
import { INTERVAL_PRESETS } from '@/lib/freshness'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/types'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  editTask?: Task | null
  onSaved?: (task: Task) => void
}

const POINT_PRESETS = [5, 10, 15, 20, 30, 50]

const inputClass =
  'w-full h-12 px-4 bg-soft border-2 border-transparent rounded-2xl text-ink placeholder-faint text-[15px] font-semibold focus:outline-none focus:border-accent focus:bg-card transition'
const labelClass = 'block text-[13px] font-extrabold text-muted mb-2'

export function TaskForm({ open, onClose, editTask, onSaved }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState(10)
  const [category, setCategory] = useState<string>('other')
  const [interval, setInterval] = useState<number | null>(7)
  const [customInterval, setCustomInterval] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!editTask

  useEffect(() => {
    if (!open) return
    setTitle(editTask?.title ?? '')
    setDescription(editTask?.description ?? '')
    setPoints(editTask?.points ?? 10)
    setCategory(editTask?.category ?? 'other')
    const iv = editTask ? editTask.interval_days : 7
    setInterval(iv)
    setCustomInterval(iv && !INTERVAL_PRESETS.some((p) => p.days === iv) ? String(iv) : '')
    setError('')
  }, [open, editTask])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setError('')
    setLoading(true)
    try {
      const input = { title: title.trim(), description: description.trim() || null, points, category, interval_days: interval }
      const saved = isEdit && editTask ? await updateTask(editTask.id, input) : await createTask(input)
      onSaved?.(saved)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Noget gik galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? 'Rediger opgave' : 'Ny opgave'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="task-title" className={labelClass}>Hvad skal gøres?</label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="fx Støvsuge stuen"
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
              value={customInterval}
              onChange={(e) => {
                setCustomInterval(e.target.value)
                const n = parseInt(e.target.value)
                if (n > 0) setInterval(n)
              }}
              className="w-28 h-10 px-3 bg-soft border-2 border-transparent rounded-full text-ink placeholder-faint text-[13px] font-bold text-center focus:outline-none focus:border-accent focus:bg-card [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

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
              value={POINT_PRESETS.includes(points) ? '' : points}
              onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
              placeholder="Andet"
              className="w-20 h-10 px-3 bg-soft border-2 border-transparent rounded-full text-ink placeholder-faint text-[13px] font-bold text-center focus:outline-none focus:border-accent focus:bg-card [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
