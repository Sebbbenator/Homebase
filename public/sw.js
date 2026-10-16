// Service worker: push-notifikationer + offline-cache af app-skallen
const VERSION = 'homebase-v3'
const PRECACHE = ['/manifest.json', '/icon-192.png', '/icon-512.png']

const OFFLINE_HTML = `<!doctype html><html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>HomeBase – offline</title><style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#F9F4EC;color:#2A211B;font-family:system-ui,sans-serif;text-align:center;padding:24px}
@media(prefers-color-scheme:dark){body{background:#1A1512;color:#F5EDE3}}h1{font-size:22px;margin:0 0 8px}p{margin:0;opacity:.7;font-weight:600}button{margin-top:20px;height:48px;padding:0 22px;border:0;border-radius:16px;background:#F26B3A;color:#2A211B;font-weight:800;font-size:15px}</style></head>
<body><div><h1>Du er offline</h1><p>Åbn den side du sidst var på, eller prøv igen når du har forbindelse.</p><button onclick="location.reload()">Prøv igen</button></div></body></html>`

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // API, server actions og React-navigationsdata skal altid gå til nettet
  if (url.pathname.startsWith('/api/') || url.searchParams.has('_rsc') || req.headers.get('RSC') === '1') return

  // Sidenavigation: net først (4 s), ellers sidst cachede udgave af siden, ellers offline-side
  if (req.mode === 'navigate') {
    event.respondWith(
      Promise.race([fetch(req), timeout(4000)])
        .then((res) => {
          if (res && res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone())).catch(() => {})
          return res
        })
        .catch(async () => {
          const cached = (await caches.match(req)) || (await caches.match(url.pathname))
          return cached || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
        })
    )
    return
  }

  // Statiske filer (hashede): cache først
  if (url.pathname.startsWith('/_next/static/') || /\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone())).catch(() => {})
            return res
          })
      )
    )
  }
})

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
