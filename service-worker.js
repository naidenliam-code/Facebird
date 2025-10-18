/* ==========================================================================
   FaceBird – Service Worker (GitHub Pages /Facebird/)
   Version : 1.1.1
   ========================================================================== */

const VERSION = 'v1.1.1';
const STATIC_CACHE = `fb-static-${VERSION}`;
const RUNTIME_CACHE = `fb-runtime-${VERSION}`;

const PRECACHE_URLS = [
  'index.html',
  'feed.html',
  'observations.html',
  'quiz.html',
  'profil.html',
  'carte.html',
  'style.css',
  'manifest.webmanifest'
];

// -------- helpers --------
function basePath() {
  return new URL('./', self.registration.scope).pathname;
}
function fromBase(p) {
  return basePath() + p.replace(/^\/+/, '');
}

// -------- INSTALL --------
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.allSettled(PRECACHE_URLS.map(u => cache.add(fromBase(u))));
    await self.skipWaiting();
  })());
});

// -------- ACTIVATE --------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// -------- FETCH --------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate' ||
      (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (['style', 'script', 'worker'].includes(req.destination)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  if (req.destination === 'image') {
    event.respondWith(cacheFirst(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});

// -------- Strategies --------
async function handleNavigation(event) {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(event.request);
    if (fresh && fresh.status === 200) runtime.put(event.request, fresh.clone());
    return fresh;
  } catch {
    const cached = await runtime.match(event.request);
    if (cached) return cached;
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
