// Service worker for push notifications

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title || 'HomeBase', {
      body: data.body || 'Something needs your attention',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'homebase',
      data: {
        url: data.url || '/dashboard',
      },
    })
  )
})

// Open the app when notification is tapped
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open new window
      return clients.openWindow(url)
    })
  )
})

// Activate immediately
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())
