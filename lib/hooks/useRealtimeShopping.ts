'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ShoppingItem } from '@/lib/types'

export function useRealtimeShopping(homeId: string, initial: ShoppingItem[]): ShoppingItem[] {
  const [items, setItems] = useState<ShoppingItem[]>(initial)

  useEffect(() => {
    setItems(initial)
  }, [initial])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`shopping:${homeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `home_id=eq.${homeId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => [payload.new as ShoppingItem, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((i) =>
                i.id === payload.new.id ? { ...i, ...(payload.new as ShoppingItem) } : i
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((i) => i.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [homeId])

  return items
}
