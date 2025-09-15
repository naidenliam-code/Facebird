/* FaceBird SW - cache statique + fallback offline */
const VERSION = 'v1.0.0';
const BASE = '/Facebird/'; // IMPORTANT: ton site GitHub Pages est servi sous /Facebird/
const STATIC_CACHE = `fb-static-${VERSION}`;

const ASSETS = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}observations.html`,
  `${BASE}quiz.html`,
  `${BASE}profil.html`,
  `${BASE}404.html`,
  `${BASE}offline.html`,
  `${BASE}style.css`,
  `${BASE}favicon.svg`,
  `${BASE}theme.js`,
  `${BASE}badges.js`,
  `${BASE}observations.js`,
  `${BASE}quiz.js`
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k.startsWith('fb-static-') && k !== STATIC_CACHE) ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

/* Stratégie: cache-first pour le statique, fallback offline pour HTML */
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // On traite différemment les pages HTML (navigations)
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          // Option: on met à jour le cache en arrière-plan
          const copy = res.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match(`${BASE}offline.html`))
        )
    );
    return;
  }

  // Pour CSS/JS/icônes → cache d’abord, sinon réseau
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      // On met en cache les réponses “propres”
      if (res.ok && (req.url.startsWith(self.location.origin))) {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
      }
      return res;
    }).catch(() => cached)) // si fetch échoue et pas de cache, on rend undefined (laisser le navigateur gérer)
  );
});
