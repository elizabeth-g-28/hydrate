/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  let title = '💧 Time to hydrate!';
  let body = 'Remember to drink some water.';
  let url = '/home';

  try {
    if (event.data) {
      const data = event.data.json() as { title?: string; body?: string; url?: string };
      title = data.title ?? title;
      body = data.body ?? body;
      url = data.url ?? url;
    }
  } catch {
    if (event.data) {
      body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/favicon.svg',
      tag: 'hydro-reminder',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/home';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          void client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
