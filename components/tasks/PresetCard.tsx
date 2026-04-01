'use client'

import { useState } from 'react'
import { AlertCircle, Check, Trash2, Pencil, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { completePresetTask, flagPresetNeedsDoing, flagPresetIdle, deleteTask } from '@/lib/actions/tasks'
import { sendPushToHome } from '@/lib/push'
import type { Task, PresetCompletion, Profile } from '@/lib/types'

interface PresetCardProps {
  task: Task
  completions: PresetCompletion[]
  currentUserId: string
  profiles: Record<string, Profile>
  onEdit: (task: Task) => void
  isLast?: boolean
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function PresetCard({ task, completions, currentUserId, profiles, onEdit, isLast }: PresetCardProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const needsDoing = task.preset_status === 'needs_doing'

  async function handleFlag() {
    setLoading(true)
    try {
      if (needsDoing) {
        await flagPresetIdle(task.id)
      } else {
        await flagPresetNeedsDoing(task.id)
        sendPushToHome(task.home_id, 'HomeBase', `"${task.title}" needs to be done`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete() {
    setLoading(true)
    try {
      await completePresetTask(task.id)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this preset task and all its history?')) return
    setLoading(true)
    try {
      await deleteTask(task.id)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const lastCompletion = completions[0]

  return (
    <>
      {/* Row — tap to open detail sheet */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors active:bg-neutral-800/50',
          !isLast && 'border-b border-neutral-800/60'
        )}
      >
        {/* Status dot */}
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full flex-shrink-0',
            needsDoing ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-neutral-700'
          )}
        />

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-100 truncate">{task.title}</p>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">
            {needsDoing
              ? 'Needs to be done'
              : lastCompletion
              ? `Done ${formatDate(lastCompletion.completed_at)} by ${lastCompletion.completed_email || 'someone'}`
              : 'Never completed'}
          </p>
        </div>

        {needsDoing && (
          <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
        )}

        <ChevronRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />
      </button>

      {/* Detail sheet */}
      <Modal open={open} onClose={() => setOpen(false)} title={task.title}>
        <div className="space-y-5">
          {/* Status + description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={needsDoing ? 'orange' : 'default'}>
                {needsDoing ? 'Needs doing' : 'All good'}
              </Badge>
              {task.assigned_email && (
                <Avatar email={task.assigned_email} emoji={task.assigned_emoji} size="sm" />
              )}
            </div>
            {task.description && (
              <p className="text-sm text-neutral-400">{task.description}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {needsDoing ? (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark as done
              </button>
            ) : (
              <button
                onClick={handleFlag}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-medium rounded-xl text-sm transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                Flag as needed
              </button>
            )}
            {needsDoing && (
              <button
                onClick={handleFlag}
                disabled={loading}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-medium rounded-xl text-sm transition-colors"
              >
                Not needed
              </button>
            )}
          </div>

          {/* History */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              History {completions.length > 0 && `(${completions.length})`}
            </p>
            {completions.length === 0 ? (
              <p className="text-sm text-neutral-600 text-center py-6">No completions yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {completions.map((c) => {
                  const profile = profiles[c.completed_by]
                  const name = c.completed_email || profile?.display_name || c.completed_by.slice(0, 8)
                  const emoji = c.completed_emoji || profile?.avatar_emoji
                  return (
                    <div key={c.id} className="flex items-center gap-3 py-1.5">
                      <Avatar email={name} emoji={emoji} size="sm" />
                      <span className="text-sm text-neutral-200 flex-1">{name}</span>
                      <span className="text-xs text-neutral-600">{formatDate(c.completed_at)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Edit / Delete row */}
          {task.created_by === currentUserId && (
            <div className="flex gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => { setOpen(false); onEdit(task) }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl text-sm transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl text-sm transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
