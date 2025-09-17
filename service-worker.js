/* Service Worker minimal pour installabilité (PWA) */
self.addEventListener('install', (evt) => {
  self.skipWaiting();
  console.log('[SW] install');
});
self.addEventListener('activate', (evt) => {
  self.clients.claim();
  console.log('[SW] activate');
});
/* Pas de stratégie de cache ici (tu as déjà une version avancée si tu veux) */
self.addEventListener('fetch', () => {});
