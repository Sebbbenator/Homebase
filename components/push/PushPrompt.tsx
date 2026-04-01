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

    // Check if already subscribed
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center">
            <BellOff className="w-4 h-4 text-neutral-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-300">Notifications not supported</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Open in Safari and add to Home Screen to enable notifications.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
            <BellOff className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-300">Notifications blocked</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Go to your device Settings to re-enable notifications for this app.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${subscribed ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
          <Bell className={`w-4 h-4 ${subscribed ? 'text-green-400' : 'text-orange-400'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-300">
            {subscribed ? 'Notifications enabled' : 'Enable notifications'}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {subscribed
              ? 'You\'ll be notified when a preset task needs doing.'
              : 'Get notified when someone flags a task.'}
          </p>
        </div>
        <button
          onClick={subscribed ? handleUnsubscribe : handleSubscribe}
          disabled={loading}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            subscribed
              ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              : 'bg-orange-600 text-white hover:bg-orange-500'
          }`}
        >
          {loading ? '...' : subscribed ? 'Turn off' : 'Turn on'}
        </button>
      </div>
    </div>
  )
}
