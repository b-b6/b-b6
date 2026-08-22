/* Minimal service worker — enables «Установить приложение» / Add to Home Screen on many browsers */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
