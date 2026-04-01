'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'

export function useRealtimeTasks(homeId: string, initial: Task[]): Task[] {
  const [tasks, setTasks] = useState<Task[]>(initial)

  useEffect(() => {
    setTasks(initial)
  }, [initial])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`tasks:${homeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `home_id=eq.${homeId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as Task, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? { ...t, ...(payload.new as Task) } : t))
            )
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [homeId])

  return tasks
}
