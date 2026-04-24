'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createTask, updateTask } from '@/lib/actions/tasks'
import { Star, ListTodo, Sparkles } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import type { Task, HomeMember, Profile, RepeatType } from '@/lib/types'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  editTask?: Task | null
  members?: HomeMember[]
  profiles?: Record<string, Profile>
  defaultIsPreset?: boolean
}

const POINT_PRESETS = [5, 10, 15, 20, 30, 50]

const REPEAT_OPTIONS: { id: RepeatType; label: string }[] = [
  { id: 'none', label: 'Ingen' },
  { id: 'daily', label: 'Dagligt' },
  { id: 'weekly', label: 'Ugentligt' },
  { id: 'biweekly', label: 'Hver 2. uge' },
]

export function TaskForm({
  open,
  onClose,
  editTask,
  members = [],
  profiles = {},
  defaultIsPreset = true,
}: TaskFormProps) {
  const [title, setTitle] = useState(editTask?.title ?? '')
  const [description, setDescription] = useState(editTask?.description ?? '')
  const [points, setPoints] = useState(editTask?.points ?? 10)
  const [category, setCategory] = useState(editTask?.category ?? 'other')
  const [isPreset, setIsPreset] = useState<boolean>(editTask?.is_preset ?? defaultIsPreset)
  const [assignedTo, setAssignedTo] = useState<string>(editTask?.assigned_to ?? '')
  const [dueDate, setDueDate] = useState<string>(editTask?.due_date ?? '')
  const [repeatType, setRepeatType] = useState<RepeatType>(editTask?.repeat_type ?? 'none')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!editTask

  useEffect(() => {
    setTitle(editTask?.title ?? '')
    setDescription(editTask?.description ?? '')
    setPoints(editTask?.points ?? 10)
    setCategory(editTask?.category ?? 'other')
    setIsPreset(editTask?.is_preset ?? defaultIsPreset)
    setAssignedTo(editTask?.assigned_to ?? '')
    setDueDate(editTask?.due_date ?? '')
    setRepeatType(editTask?.repeat_type ?? 'none')
    setError('')
  }, [editTask, defaultIsPreset, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit && editTask) {
        await updateTask(editTask.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          points,
          category,
          ...(!isPreset && {
            assigned_to: assignedTo || null,
            due_date: dueDate || null,
            repeat_type: repeatType,
          }),
        })
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          is_preset: isPreset,
          points,
          category,
          assigned_to: isPreset ? null : (assignedTo || null),
          due_date: isPreset ? null : (dueDate || null),
          repeat_type: isPreset ? 'none' : repeatType,
        })
      }
      onClose()
      if (!isEdit) {
        setTitle('')
        setDescription('')
        setPoints(10)
        setCategory('other')
        setAssignedTo('')
        setDueDate('')
        setRepeatType('none')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.06] rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition'
  const labelClass = 'block text-sm font-medium text-zinc-300 mb-1.5'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Rediger opgave' : 'Ny opgave'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type toggle (only for new tasks) */}
        {!isEdit && (
          <div>
            <label className={labelClass}>Type</label>
            <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.05] rounded-2xl">
              <button
                type="button"
                onClick={() => setIsPreset(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  isPreset
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                Ugentlig
              </button>
              <button
                type="button"
                onClick={() => setIsPreset(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  !isPreset
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Speciel
              </button>
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>Titel *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Hvad skal gøres?"
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label className={labelClass}>Beskrivelse</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Valgfrie detaljer..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>Kategori</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  category === c.id
                    ? c.color + ' scale-105'
                    : 'bg-white/[0.05] text-zinc-400 border-white/[0.06] hover:bg-white/[0.08]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Special-task-only fields */}
        {!isPreset && (
          <>
            <div>
              <label className={labelClass}>Tildel til</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAssignedTo('')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                    assignedTo === ''
                      ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                      : 'bg-white/[0.05] text-zinc-400 border-white/[0.06] hover:bg-white/[0.08]'
                  }`}
                >
                  Ingen
                </button>
                {members.map((m) => {
                  const name = profiles[m.user_id]?.display_name ?? m.email ?? m.user_id.slice(0, 6)
                  const emoji = profiles[m.user_id]?.avatar_emoji
                  return (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => setAssignedTo(m.user_id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                        assignedTo === m.user_id
                          ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                          : 'bg-white/[0.05] text-zinc-400 border-white/[0.06] hover:bg-white/[0.08]'
                      }`}
                    >
                      {emoji && <span>{emoji}</span>}
                      {name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Forfaldsdato</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Gentag</label>
              <div className="flex flex-wrap gap-2">
                {REPEAT_OPTIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRepeatType(r.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                      repeatType === r.id
                        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                        : 'bg-white/[0.05] text-zinc-400 border-white/[0.06] hover:bg-white/[0.08]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-2">
            <Star className="w-3.5 h-3.5 text-orange-400" />
            Point
          </label>
          <div className="flex flex-wrap gap-2">
            {POINT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPoints(p)}
                className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-all ${
                  points === p
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-105'
                    : 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200'
                }`}
              >
                {p}
              </button>
            ))}
            <input
              type="number"
              value={POINT_PRESETS.includes(points) ? '' : points}
              onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
              placeholder="Andet"
              min={1}
              className="w-20 px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-xl text-white placeholder-zinc-500 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 font-medium rounded-xl text-sm transition-colors"
          >
            Annuller
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors"
          >
            {loading ? 'Gemmer...' : isEdit ? 'Opdater' : 'Opret opgave'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
