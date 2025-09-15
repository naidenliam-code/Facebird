// sw.js — Service Worker très simple
self.addEventListener('install', (event) => {
  // On active immédiatement
  self.skipWaiting();
  console.log('[SW] installé');
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  console.log('[SW] activé');
});

// Pour l’instant on laisse passer tout (pas de cache ici)
self.addEventListener('fetch', () => {});
