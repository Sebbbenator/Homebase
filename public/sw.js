// Service worker: push-notifikationer

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()

  const options = {
    body: data.body || 'Der er noget at se til derhjemme',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'homebase',
    renotify: true,
    data: { url: data.url || '/hjem', taskId: data.taskId || null },
  }
  if (Array.isArray(data.actions) && data.actions.length) options.actions = data.actions

  const badge = typeof data.badge === 'number' ? data.badge : undefined
  const setBadge = navigator.setAppBadge
    ? badge === undefined ? navigator.setAppBadge() : badge > 0 ? navigator.setAppBadge(badge) : navigator.clearAppBadge()
    : Promise.resolve()

  event.waitUntil(Promise.all([self.registration.showNotification(data.title || 'HomeBase', options), setBadge.catch(() => {})]))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/hjem'

  event.waitUntil(
    Promise.all([
      navigator.clearAppBadge ? navigator.clearAppBadge().catch(() => {}) : Promise.resolve(),
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return clients.openWindow(url)
      }),
    ])
  )
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())
