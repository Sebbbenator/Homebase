'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Completion } from '@/lib/types'

export function useRealtimeCompletions(
  homeId: string,
  initial: Completion[]
): [Completion[], Dispatch<SetStateAction<Completion[]>>] {
  const [completions, setCompletions] = useState<Completion[]>(initial)

  useEffect(() => {
    setCompletions(initial)
  }, [initial])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`completions:${homeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'preset_completions', filter: `home_id=eq.${homeId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const c = payload.new as Completion
            setCompletions((prev) => (prev.some((x) => x.id === c.id) ? prev : [c, ...prev]))
          } else if (payload.eventType === 'DELETE') {
            setCompletions((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [homeId])

  return [completions, setCompletions]
}
