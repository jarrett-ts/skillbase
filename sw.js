// Skillbase SW v4 — clears old caches, no caching of app files
const CACHE = 'skillbase-v4';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
  self.clients.claim();
});
// Always fetch fresh from network
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));
