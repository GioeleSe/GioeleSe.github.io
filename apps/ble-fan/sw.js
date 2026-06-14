/* =========================================================
   BLE DESK FAN — sw.js
   Service Worker — cache-first for the app shell,
   network-first for everything else.
   ========================================================= */

const CACHE_NAME  = 'ble-fan-v1';

/* Files that make up the app shell.
   Everything listed here will be cached on install,
   so the app loads even when GitHub Pages is unreachable. */
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  /* Google Fonts are cross-origin — we attempt to cache them
     at runtime (see fetch handler) rather than install time. */
];

/* ── Install: pre-cache the app shell ─────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())   // activate immediately
  );
});

/* ── Activate: delete old caches ──────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())  // take control of open tabs
  );
});

/* ── Fetch: cache-first for shell, network-first otherwise ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // App shell & same-origin assets → cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Cross-origin (Google Fonts, etc.) → network-first with cache fallback
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Everything else (BLE is local, no network request) → pass through
});

/* ── Strategies ────────────────────────────────────────────── */

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  // Not in cache yet — fetch and store
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — nothing we can do
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}