'use client'

import { useSyncExternalStore } from 'react'

function subscribe(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

/** true når browseren mener den er online (server-render antager online) */
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
}

/** Ligner fejlen en netværksfejl (offline / server utilgængelig)? */
export function isNetworkError(err: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  if (err instanceof TypeError) return true
  const msg = err instanceof Error ? err.message : String(err)
  return /fetch|network|load failed|failed to/i.test(msg)
}
