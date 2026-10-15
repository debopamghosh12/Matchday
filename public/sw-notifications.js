// Imported into the generated service worker (see workbox.importScripts in vite.config.ts).
// Clicking a kick-off reminder focuses an open Matchday tab on the match's day, or opens one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data && event.notification.data.url
  if (!url) return
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => new URL(w.url).origin === self.location.origin)
      if (existing) return existing.focus().then((w) => w && w.navigate(url))
      return self.clients.openWindow(url)
    }),
  )
})
