// CrisisConnect Background Service Worker for Emergency Push & System Pop-ups
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push events when app is minimized or tab is closed
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 CrisisConnect Emergency Alert',
    body: 'Priority disaster response notification in your sector.',
    icon: '/favicon.svg',
    tag: 'crisisconnect-emergency',
    data: { url: '/' },
  };

  try {
    if (event.data) {
      data = Object.assign({}, data, event.data.json());
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [0, 500, 250, 500],
    requireInteraction: true,
    data: data.data || { url: '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// When user clicks the notification popup on Windows Action Center or Android Drawer
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
