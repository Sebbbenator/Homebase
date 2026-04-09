'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/push'

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerServiceWorker()
    // Clear app icon badge when user opens the app
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge().catch(() => {})
    }
  }, [])

  return null
}
