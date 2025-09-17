/* Service Worker minimal : requis pour l’installabilité */
self.addEventListener('install', (evt) => {
  self.skipWaiting();
  console.log('[SW] install');
});
self.addEventListener('activate', (evt) => {
  self.clients.claim();
  console.log('[SW] activate');
});
/* On laisse tout passer pour l’instant (pas de cache obligatoire) */
self.addEventListener('fetch', () => {});
