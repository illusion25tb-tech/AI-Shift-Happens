// Service Worker for AI-Shift Happens push notifications
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'AI-Shift Happens';
  const options = {
    body: data.body || 'Vergiss nicht dein Daily Quiz!',
    icon: '/mindset-shift/favicon.svg',
    badge: '/mindset-shift/favicon.svg',
    tag: data.tag || 'daily-reminder',
    data: { url: data.url || '/mindset-shift/app/daily' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/mindset-shift/app';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/mindset-shift/') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
