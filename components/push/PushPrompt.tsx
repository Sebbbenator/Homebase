'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { subscribeToPush, unsubscribeFromPush, registerServiceWorker } from '@/lib/push'

export function PushPrompt() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(ok)
    if (!ok) return

    setPermission(Notification.permission)

    registerServiceWorker().then(async (reg) => {
      if (!reg) return
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    })
  }, [])

  async function handleSubscribe() {
    setLoading(true)
    try {
      const sub = await subscribeToPush()
      if (sub) {
        setSubscribed(true)
        setPermission('granted')
      } else {
        setPermission(Notification.permission)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsubscribe() {
    setLoading(true)
    try {
      await unsubscribeFromPush()
      setSubscribed(false)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0">
          <BellOff className="w-4 h-4 text-zinc-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-300">Notifikationer understøttes ikke</p>
          <p className="text-xs text-zinc-600 mt-0.5">
            Åbn i Safari og tilføj til hjemmeskærmen for at aktivere notifikationer.
          </p>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <BellOff className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-300">Notifikationer blokeret</p>
          <p className="text-xs text-zinc-600 mt-0.5">
            Gå til enhedsindstillingerne for at genaktivere notifikationer for denne app.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${subscribed ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
        <Bell className={`w-4 h-4 ${subscribed ? 'text-green-400' : 'text-orange-400'}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-zinc-300">
          {subscribed ? 'Notifikationer aktiveret' : 'Aktiver notifikationer'}
        </p>
        <p className="text-xs text-zinc-600 mt-0.5">
          {subscribed
            ? 'Du får besked, når en fast opgave skal udføres.'
            : 'Bliv underrettet, når nogen markerer en opgave.'}
        </p>
      </div>
      <button
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
        disabled={loading}
        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors flex-shrink-0 ${
          subscribed
            ? 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08]'
            : 'bg-orange-600 text-white hover:bg-orange-500'
        }`}
      >
        {loading ? '...' : subscribed ? 'Slå fra' : 'Slå til'}
      </button>
    </div>
  )
}
