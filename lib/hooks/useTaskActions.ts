'use client'

import { useCallback, type Dispatch, type SetStateAction } from 'react'
import { completeTask, undoCompletion } from '@/lib/actions/tasks'
import { useToast } from '@/components/ui/Toast'
import { haptic } from '@/lib/utils'
import type { Completion, Task } from '@/lib/types'

interface Args {
  currentUserId: string
  setTasks: Dispatch<SetStateAction<Task[]>>
  setCompletions: Dispatch<SetStateAction<Completion[]>>
}

function latestFor(taskId: string, completions: Completion[]) {
  return completions
    .filter((c) => c.task_id === taskId)
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at))[0]
}

/** Optimistisk "gjort" + fortryd. Realtime-hooks holder listerne i sync bagefter. */
export function useTaskActions({ currentUserId, setTasks, setCompletions }: Args) {
  const toast = useToast()

  const undo = useCallback(async (completionId: string) => {
    let removed: Completion | undefined
    setCompletions((prev) => {
      removed = prev.find((c) => c.id === completionId)
      const next = prev.filter((c) => c.id !== completionId)
      if (removed) {
        const taskId = removed.task_id
        const latest = latestFor(taskId, next)
        setTasks((tasks) =>
          tasks.map((t) =>
            t.id === taskId
              ? { ...t, last_completed_at: latest?.completed_at ?? null, last_completed_by: latest?.completed_by ?? null }
              : t
          )
        )
      }
      return next
    })
    try {
      await undoCompletion(completionId)
    } catch {
      toast.show('Kunne ikke fortryde – prøv igen')
    }
  }, [setCompletions, setTasks, toast])

  const complete = useCallback(async (task: Task, helperId?: string | null) => {
    haptic()
    const now = new Date().toISOString()
    const tempId = `tmp-${task.id}-${Date.now()}`
    const temp: Completion = {
      id: tempId,
      task_id: task.id,
      home_id: task.home_id,
      completed_by: currentUserId,
      completed_at: now,
      helper_id: helperId && helperId !== currentUserId ? helperId : null,
      points: task.points,
    }
    const before = { at: task.last_completed_at, by: task.last_completed_by }

    setCompletions((prev) => [temp, ...prev])
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, last_completed_at: now, last_completed_by: currentUserId } : t)))

    try {
      const real = await completeTask(task.id, temp.helper_id)
      setCompletions((prev) => {
        const withoutTemp = prev.filter((c) => c.id !== tempId)
        return withoutTemp.some((c) => c.id === real.id) ? withoutTemp : [real, ...withoutTemp]
      })
      toast.show(`Flot! +${task.points} point for "${task.title}"`, {
        action: { label: 'Fortryd', onClick: () => undo(real.id) },
      })
      return real
    } catch {
      setCompletions((prev) => prev.filter((c) => c.id !== tempId))
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, last_completed_at: before.at, last_completed_by: before.by } : t)))
      toast.show('Kunne ikke gemme – tjek forbindelsen')
      return null
    }
  }, [currentUserId, setCompletions, setTasks, toast, undo])

  return { complete, undo }
}
