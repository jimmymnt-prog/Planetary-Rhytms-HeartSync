const CACHE = 'heartsync-v2-static-1';
const CORE = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './assets/icons/icon.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/social-card.png',
  './assets/planets/terre.webp', './assets/planets/moon.webp', './assets/planets/sun.webp',
  './assets/planets/venus.webp', './assets/planets/mars.webp', './assets/planets/jupiter.webp'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('heartsync-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && request.destination !== 'audio') {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  }).catch(() => request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
