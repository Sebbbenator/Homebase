'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/push'

type BadgeNavigator = Navigator & { clearAppBadge?: () => Promise<void> }

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerServiceWorker()
    // Fjern badge på app-ikonet når appen åbnes
    const nav = navigator as BadgeNavigator
    nav.clearAppBadge?.().catch(() => {})
  }, [])

  return null
}
