/* FaceBird – Service Worker (optimisé GitHub Pages /Facebird/)
   - Pré-cache pages clés (index, feed, etc.)
   - Navigations: network-first + fallback cache + fallback SPA (index.html)
   - CSS/JS: stale-while-revalidate
   - Images: cache-first (runtime)
   - Tolérant (addAll sécurisé via Promise.allSettled)
*/
const VERSION        = 'v1.1.0';
const STATIC_CACHE   = `fb-static-${VERSION}`;
const RUNTIME_CACHE  = `fb-runtime-${VERSION}`;

// ⚠️ Mets ici SEULEMENT ce que TU AS vraiment (casse exacte!)
// Ajoute/retire librement : la pré-mise en cache est tolérante.
const PRECACHE_URLS = [
  'index.html',
  'feed.html',          // <-- attention à la casse !
  'observations.html',
  'quiz.html',
  'profil.html',
  'map.html',
  'style.css',
  'manifest.json'
  // Tu peux ajouter des icônes si tu en as, ex.:
  // 'icons/icon-192.png',
  // 'icons/icon-512.png'
];

// ---------- helpers: base path compatible GitHub Pages ----------
function basePath() {
  // Exemple: "/Facebird/" quand publié sur user.github.io/Facebird/
  return new URL('./', self.registration.scope).pathname;
}
function fromBase(p) {
  return basePath() + p.replace(/^\/+/, '');
}

// ---------- INSTALL: pré-cache tolérant ----------
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.allSettled(PRECACHE_URLS.map(u => cache.add(fromBase(u))));
    await self.skipWaiting();
  })());
});

// ---------- ACTIVATE: nettoyage des anciens caches + claim ----------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
      .map(k => caches.delete(k)));
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

// ---------- FETCH strategies ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // même origine seulement
  if (url.origin !== location.origin) return;

  // 1) Navigations (HTML)
  const isNav = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');
  if (isNav) {
    event.respondWith(handleNavigation(event));
    return;
  }

  // 2) CSS/JS/workers → stale-while-revalidate
  if (['style','script','worker'].includes(req.destination)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // 3) Images → cache-first (runtime)
  if (req.destination === 'image') {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 4) Autres → SWR par défaut
  event.respondWith(staleWhileRevalidate(req));
});

// ---------- Strategies impl ----------
async function handleNavigation(event) {
  const runtime = await caches.open(RUNTIME_CACHE);

  // navigationPreload si dispo (rapide)
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) {
      runtime.put(event.request, preloaded.clone());
      return preloaded;
    }
  } catch {}

  // Network-first
  try {
    const fresh = await fetch(event.request);
    if (fresh && fresh.status === 200) {
      runtime.put(event.request, fresh.clone());
    }
    return fresh;
  } catch {
    // Offline → version en cache si dispo
    const cached = await runtime.match(event.request);
    if (cached) return cached;

    // Fallback SPA → index.html du STATIC cache
    const index = await caches.match(fromBase('index.html'));
    return index || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetching = fetch(request).then(res => {
    if (res && (res.status === 200 || res.type === 'opaque')) {
      cache.put(request, res.clone());
    }
    return res;
  }).catch(() => null);
  return cached || fetching || new Response('', { status: 504 });
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return new Response('', { status: 504 });
  }
}

// ---------- (optionnel) skipWaiting via message ----------
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
