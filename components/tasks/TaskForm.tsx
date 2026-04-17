'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createTask, updateTask } from '@/lib/actions/tasks'
import { Star } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import type { Task } from '@/lib/types'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  editTask?: Task | null
}

const POINT_PRESETS = [5, 10, 15, 20, 30, 50]

export function TaskForm({ open, onClose, editTask }: TaskFormProps) {
  const [title, setTitle] = useState(editTask?.title ?? '')
  const [description, setDescription] = useState(editTask?.description ?? '')
  const [points, setPoints] = useState(editTask?.points ?? 10)
  const [category, setCategory] = useState(editTask?.category ?? 'other')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!editTask

  useEffect(() => {
    setTitle(editTask?.title ?? '')
    setDescription(editTask?.description ?? '')
    setPoints(editTask?.points ?? 10)
    setCategory(editTask?.category ?? 'other')
    setError('')
  }, [editTask])

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
        })
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          due_date: null,
          repeat_type: 'none',
          is_preset: true,
          points,
          category,
        })
      }
      onClose()
      if (!isEdit) {
        setTitle('')
        setDescription('')
        setPoints(10)
        setCategory('other')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition'
  const labelClass = 'block text-sm font-medium text-neutral-300 mb-1.5'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Rediger opgave' : 'Ny opgave'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-300 mb-2">
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
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
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
              className="w-20 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 placeholder-neutral-500 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl text-sm transition-colors"
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
