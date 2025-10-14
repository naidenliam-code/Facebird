/* FaceBird – Service Worker (GitHub Pages /Facebird/)
   Robuste (pré-cache tolérant), SPA fallback, offline OK.
*/
const VERSION = 'v1.0.1';
const CACHE_STATIC  = `facebird-static-${VERSION}`;
const CACHE_RUNTIME = `facebird-runtime-${VERSION}`;

// ⚠️ NE METS ICI QUE DES FICHIERS CERTAINS D'EXISTER
const PRECACHE_URLS = [
  'index.html',
  'style.css',
  'manifest.json'
];

// -------- helpers base path (compat /Facebird/) --------
function basePath() {
  return new URL('./', self.registration.scope).pathname; // ex: "/Facebird/"
}
function fromBase(p) {
  return basePath() + p.replace(/^\/+/, '');
}

// -------- install: pré-cache tolérant --------
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_STATIC);
    await Promise.allSettled(
      PRECACHE_URLS.map(u => cache.add(fromBase(u)))
    );
    await self.skipWaiting();
  })());
});

// -------- activate: nettoyage + claim --------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => ![CACHE_STATIC, CACHE_RUNTIME].includes(k))
          .map(k => caches.delete(k))
    );
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

// -------- fetch --------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;

  const isNavigation = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (['style','script','worker'].includes(req.destination)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  if (req.destination === 'image') {
    event.respondWith(cacheFirst(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});

async function handleNavigation(event) {
  const runtime = await caches.open(CACHE_RUNTIME);
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) {
      runtime.put(event.request, preloaded.clone());
      return preloaded;
    }
  } catch {}

  try {
    const fresh = await fetch(event.request);
    if (fresh && fresh.status === 200) {
      runtime.put(event.request, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await runtime.match(event.request);
    if (cached) return cached;
    const index = await caches.match(fromBase('index.html'));
    return index || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_RUNTIME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((res) => {
    if (res && (res.status === 200 || res.type === 'opaque')) {
      cache.put(request, res.clone());
    }
    return res;
  }).catch(() => null);
  return cached || fetchPromise || new Response('', { status: 504 });
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_RUNTIME);
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
