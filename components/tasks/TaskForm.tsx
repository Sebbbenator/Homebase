'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createTask, updateTask } from '@/lib/actions/tasks'
import type { Task, HomeMember, RepeatType } from '@/lib/types'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  members: HomeMember[]
  editTask?: Task | null
}

export function TaskForm({ open, onClose, members, editTask }: TaskFormProps) {
  const [title, setTitle] = useState(editTask?.title ?? '')
  const [description, setDescription] = useState(editTask?.description ?? '')
  const [assignedTo, setAssignedTo] = useState(editTask?.assigned_to ?? '')
  const [dueDate, setDueDate] = useState(editTask?.due_date ?? '')
  const [repeatType, setRepeatType] = useState<RepeatType>(editTask?.repeat_type ?? 'none')
  const [isPreset, setIsPreset] = useState(editTask?.is_preset ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset when modal opens with new task
  const isEdit = !!editTask

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit && editTask) {
        await updateTask(editTask.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          assigned_to: assignedTo || null,
          due_date: dueDate || null,
          repeat_type: repeatType,
        })
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          assigned_to: assignedTo || null,
          due_date: isPreset ? null : (dueDate || null),
          repeat_type: isPreset ? 'none' : repeatType,
          is_preset: isPreset,
        })
      }
      onClose()
      if (!isEdit) {
        setTitle('')
        setDescription('')
        setAssignedTo('')
        setDueDate('')
        setRepeatType('none')
        setIsPreset(false)
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
        {/* Title + description at top — most important */}
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

        {/* Options — compact row layout for quick tapping */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Assign To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className={inputClass}
            >
              <option value="">Anyone</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.email ?? m.user_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          {!isPreset && (
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* Preset toggle — only when creating */}
        {!isEdit && (
          <div>
            <label className={labelClass}>Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPreset(false)}
                className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                  !isPreset
                    ? 'bg-orange-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                Regular Task
              </button>
              <button
                type="button"
                onClick={() => setIsPreset(true)}
                className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                  isPreset
                    ? 'bg-orange-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                Preset
              </button>
            </div>
          </div>
        )}

        {!isPreset && (
          <div>
            <label className={labelClass}>Repeat</label>
            <div className="grid grid-cols-4 gap-2">
              {(['none', 'daily', 'weekly', 'biweekly'] as RepeatType[]).map((r) => {
                const labels: Record<RepeatType, string> = {
                  none: 'None',
                  daily: 'Daily',
                  weekly: 'Weekly',
                  biweekly: '2 Weeks',
                }
                return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRepeatType(r)}
                  className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                    repeatType === r
                      ? 'bg-orange-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {labels[r]}
                </button>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Action buttons — at the very bottom, easy thumb reach */}
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
