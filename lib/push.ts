// Client-side push notification helpers

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.register('/sw.js')
  return reg
}

export async function subscribeToPush() {
  const reg = await registerServiceWorker()
  if (!reg) return null

  // Check permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  })

  // Send subscription to our API
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  })

  return sub
}

export async function unsubscribeFromPush() {
  const reg = await navigator.serviceWorker?.ready
  if (!reg) return

  const sub = await reg.pushManager.getSubscription()
  if (!sub) return

  await sub.unsubscribe()

  await fetch('/api/push/subscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  })
}

export async function sendPushToHome(homeId: string, title: string, body: string) {
  await fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ homeId, title, body, url: '/dashboard' }),
  })
}
