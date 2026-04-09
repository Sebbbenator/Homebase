'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createTask, updateTask } from '@/lib/actions/tasks'
import { Star } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!editTask

  // Sync form state when editTask changes (opening edit modal)
  useEffect(() => {
    setTitle(editTask?.title ?? '')
    setDescription(editTask?.description ?? '')
    setPoints(editTask?.points ?? 10)
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
        })
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          due_date: null,
          repeat_type: 'none',
          is_preset: true,
          points,
        })
      }
      onClose()
      if (!isEdit) {
        setTitle('')
        setDescription('')
        setPoints(10)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition'
  const labelClass = 'block text-sm font-medium text-neutral-300 mb-1.5'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Task' : 'New Task'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="What needs to be done?"
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-300 mb-2">
            <Star className="w-3.5 h-3.5 text-orange-400" />
            Points
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
              placeholder="Custom"
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors"
          >
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
