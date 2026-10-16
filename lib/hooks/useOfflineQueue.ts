'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { addShoppingItem, clearPurchased, removeShoppingItem, setPurchased, updateShoppingItem, type ShoppingPatch } from '@/lib/actions/shopping'
import { isNetworkError } from './useOnline'
import type { ShoppingItem } from '@/lib/types'

export type QueuedOp =
  | { kind: 'add'; tempId: string; name: string; quantity: string | null; section: string }
  | { kind: 'toggle'; itemId: string; purchased: boolean }
  | { kind: 'update'; itemId: string; patch: ShoppingPatch }
  | { kind: 'remove'; itemId: string }
  | { kind: 'clear' }

interface Options {
  homeId: string
  /** Kaldes når en offline-tilføjet vare har fået sit rigtige id */
  onReplaced: (tempId: string, real: ShoppingItem) => void
  onFlushed?: (count: number) => void
}

function key(homeId: string) {
  return `hb-shopping-queue:${homeId}`
}

function load(homeId: string): QueuedOp[] {
  try {
    const raw = localStorage.getItem(key(homeId))
    return raw ? (JSON.parse(raw) as QueuedOp[]) : []
  } catch {
    return []
  }
}

function save(homeId: string, ops: QueuedOp[]) {
  try {
    if (ops.length) localStorage.setItem(key(homeId), JSON.stringify(ops))
    else localStorage.removeItem(key(homeId))
  } catch { /* fuld eller blokeret – ignorér */ }
}

/**
 * Kø af ændringer der ikke kunne sendes (offline). Afspilles i rækkefølge når forbindelsen er tilbage.
 * Varer tilføjet offline har midlertidige id'er; de mappes til rigtige id'er under afspilning.
 */
export function useOfflineQueue({ homeId, onReplaced, onFlushed }: Options) {
  const [size, setSize] = useState(0)
  const queue = useRef<QueuedOp[]>([])
  const flushing = useRef(false)
  const callbacks = useRef({ onReplaced, onFlushed })
  callbacks.current = { onReplaced, onFlushed }

  const persist = useCallback(() => {
    save(homeId, queue.current)
    setSize(queue.current.length)
  }, [homeId])

  const flush = useCallback(async () => {
    if (flushing.current || queue.current.length === 0 || !navigator.onLine) return
    flushing.current = true
    const idMap: Record<string, string> = {}
    const real = (id: string) => idMap[id] ?? id
    let done = 0
    try {
      while (queue.current.length) {
        const op = queue.current[0]
        if (op.kind === 'add') {
          const item = await addShoppingItem(op.name, op.quantity, op.section)
          idMap[op.tempId] = item.id
          callbacks.current.onReplaced(op.tempId, item)
        } else if (op.kind === 'toggle') {
          if (!real(op.itemId).startsWith('tmp-')) await setPurchased(real(op.itemId), op.purchased)
        } else if (op.kind === 'update') {
          if (!real(op.itemId).startsWith('tmp-')) await updateShoppingItem(real(op.itemId), op.patch)
        } else if (op.kind === 'remove') {
          if (!real(op.itemId).startsWith('tmp-')) await removeShoppingItem(real(op.itemId))
        } else if (op.kind === 'clear') {
          await clearPurchased()
        }
        queue.current.shift()
        done++
        persist()
      }
      if (done) callbacks.current.onFlushed?.(done)
    } catch (err) {
      // Stadig offline (eller serverfejl) – prøv igen senere
      if (!isNetworkError(err)) {
        // Rigtig fejl: drop operationen så køen ikke sidder fast
        queue.current.shift()
        persist()
      }
    } finally {
      flushing.current = false
    }
  }, [persist])

  const enqueue = useCallback((op: QueuedOp) => {
    queue.current.push(op)
    persist()
  }, [persist])

  // Indlæs gemt kø og afspil når vi kommer online
  useEffect(() => {
    queue.current = load(homeId)
    setSize(queue.current.length)
    const onOnline = () => { flush() }
    window.addEventListener('online', onOnline)
    if (queue.current.length) flush()
    return () => window.removeEventListener('online', onOnline)
  }, [homeId, flush])

  /** Kør en ændring nu – eller læg den i kø hvis vi er offline */
  const run = useCallback(async (op: QueuedOp, exec: () => Promise<unknown>): Promise<'done' | 'queued' | 'failed'> => {
    if (!navigator.onLine || queue.current.length) {
      enqueue(op)
      return 'queued'
    }
    try {
      await exec()
      return 'done'
    } catch (err) {
      if (isNetworkError(err)) {
        enqueue(op)
        return 'queued'
      }
      return 'failed'
    }
  }, [enqueue])

  return { run, flush, size }
}
