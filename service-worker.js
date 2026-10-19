/* Орбита-9 Service Worker — офлайн-кэш и push-уведомления */
const CACHE_NAME = 'orbita9-v9';
const CORE_ASSETS = [
  './',
  './index.html',
  './physics-quest-9-grade.html',
  './manifest.json',
  './icon-192.png',
  './icon-180.png',
  './icon-512.png'
];

/* Навигация (HTML-страницы) — network-first: обновления видны сразу, кэш только для офлайна */
const NAVIGATION_FIRST = true;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(CORE_ASSETS.map((asset) => cache.add(asset).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // Навигационные запросы (страницы): сначала сеть, при ошибке — кэш
  if (NAVIGATION_FIRST && (req.mode === 'navigate' || (req.mode === 'same-origin' && req.destination === 'document'))) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./physics-quest-9-grade.html')))
    );
    return;
  }

  // Остальные ресурсы: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // stale-while-revalidate
        event.waitUntil(
          fetch(req).then((res) => {
            if (res && res.status === 200) caches.open(CACHE_NAME).then((c) => c.put(req, res));
          }).catch(() => {})
        );
        return cached;
      }
      return fetch(req).then((res) => {
        if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => cached || Response.error());
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: event.data ? event.data.text() : 'Орбита-9', body: '' };
  }
  const title = data.title || 'Орбита-9 — уведомление';
  const options = {
    body: data.body || data.message || 'Новый результат ученика в журнале',
    icon: './icon-192.png',
    badge: './icon-180.png',
    tag: data.tag || 'orbita9-notify',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: data.url || './physics-quest-9-grade.html#teacher' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : './physics-quest-9-grade.html#teacher';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes('physics-quest-9-grade.html') && 'focus' in c) return c.focus().then(() => c.navigate(url));
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const d = event.data.payload || {};
    self.registration.showNotification(d.title || 'Орбита-9', {
      body: d.body || '',
      icon: './icon-192.png',
      badge: './icon-180.png',
      tag: d.tag || 'orbita9-local',
      data: { url: d.url || './physics-quest-9-grade.html' }
    });
  }
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
