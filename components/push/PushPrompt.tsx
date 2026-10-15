'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { subscribeToPush, unsubscribeFromPush, registerServiceWorker } from '@/lib/push'
import { cn } from '@/lib/utils'

export function PushPrompt() {
  const [supported, setSupported] = useState(true)
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

  async function toggle() {
    setLoading(true)
    try {
      if (subscribed) {
        await unsubscribeFromPush()
        setSubscribed(false)
      } else {
        const sub = await subscribeToPush()
        setSubscribed(!!sub)
        setPermission(Notification.permission)
      }
    } finally {
      setLoading(false)
    }
  }

  const blocked = permission === 'denied'
  const title = !supported ? 'Push virker ikke her' : blocked ? 'Notifikationer er blokeret' : subscribed ? 'Push er slået til' : 'Slå push til'
  const text = !supported
    ? 'Åbn i Safari og føj appen til hjemmeskærmen for at få notifikationer.'
    : blocked
    ? 'Slå notifikationer til for HomeBase i telefonens indstillinger.'
    : subscribed
    ? 'Du får besked, når nogen i huset tager en opgave.'
    : 'Få besked, når nogen i huset tager en opgave.'

  return (
    <div className="bg-card rounded-card shadow-card p-4 flex items-center gap-3">
      <span className={cn('w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0', subscribed ? 'bg-good-soft text-good-ink' : blocked || !supported ? 'bg-soft text-faint' : 'bg-accent-soft text-accent-ink')}>
        {blocked || !supported ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm font-extrabold">{title}</span>
        <span className="text-xs font-semibold text-muted">{text}</span>
      </div>
      {supported && !blocked && (
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          role="switch"
          aria-checked={subscribed}
          aria-label="Push-notifikationer"
          className={cn('w-[50px] h-[30px] rounded-full p-[3px] flex items-center transition-colors flex-shrink-0', subscribed ? 'bg-good justify-end' : 'bg-line justify-start')}
        >
          <span className="w-6 h-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]" />
        </button>
      )}
    </div>
  )
}
