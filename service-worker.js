/* FaceBird — Service Worker (cache offline + mises à jour contrôlées)
 * Scope : mettre ce fichier à la racine du site (même dossier que index.html)
 */

const VERSION = 'v1.0.0';
const STATIC_CACHE = `fb-static-${VERSION}`;
const RUNTIME_CACHE = `fb-runtime-${VERSION}`;
const OFFLINE_FALLBACK = '404.html';

/* ⚙️ Tous les assets de ton app (ajoute/retire si besoin) */
const ASSETS = [
  // Pages
  'index.html',
  'observations.html',
  'feed.html',
  'quiz.html',
  'profil.html',
  'map.html',
  '404.html',

  // Styles
  'style.css',

  // PWA
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'favicon.svg',

  // JS communs
  'theme.js',
  'badges.js',
  'points.js',
  'sw-register.js',
  'install-check.js',

  // Avatars images (256 px)
  'avatar-debutant-256.png',
  'avatar-intermediaire-256.png',
  'avatar-avance-256.png',
  'avatar-expert-256.png',
  'avatar-maitre-256.png',

  // (si tu utilises les versions 512 px, décommente)
  // 'avatar-debutant-512.png',
  // 'avatar-intermediaire-512.png',
  // 'avatar-avance-512.png',
  // 'avatar-expert-512.png',
  // 'avatar-maitre-512.png',
];

/* 🔧 Install : pré-cache des assets statiques */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(self.skipWaiting())
  );
});

/* 🧹 Activate : nettoyage des anciens caches */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* 🛰️ Fetch : stratégies selon le type de requête */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // On ne gère que les GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // 1) Navigations HTML → stratégie réseau d'abord, fallback cache puis OFFLINE_FALLBACK
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || caches.match(OFFLINE_FALLBACK);
        })
    );
    return;
  }

  // 2) Requêtes même origine pour assets statiques → cache d'abord, puis réseau
  if (sameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() => caches.match(OFFLINE_FALLBACK));
      })
    );
    return;
  }

  // 3) Requêtes externes (ex: tuiles Leaflet/OSM) → stale-while-revalidate simple
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => null);
      return cached || network;
    })
  );
});

/* 🔄 Message 'skipWaiting' pour activer la nouvelle version immédiatement (optionnel) */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
