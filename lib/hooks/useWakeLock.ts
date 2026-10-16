'use client'

import { useEffect } from 'react'

type WakeLockSentinel = { release: () => Promise<void>; addEventListener?: (t: string, cb: () => void) => void }
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> } }

/** Holder skærmen tændt mens `active` er true (fx i handle-tilstand) */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const nav = navigator as WakeLockNavigator
    if (!nav.wakeLock) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      try {
        sentinel = await nav.wakeLock!.request('screen')
        if (cancelled) await sentinel.release()
      } catch { /* afvist eller ikke understøttet */ }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') request() }

    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      sentinel?.release().catch(() => {})
    }
  }, [active])
}
