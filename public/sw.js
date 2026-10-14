/*
 * DutchTap service worker.
 *
 * Strategy (so a deployment reaches returning users, and visited pages still work offline):
 *   - Pages and navigation data (HTML, RSC payloads):  NETWORK FIRST. Online users always get the newest version; the copy
 *     is cached, and used only when the network fails or takes longer than NETWORK_TIMEOUT_MS.
 *   - /_next/static/* (content-hashed, immutable):      CACHE FIRST.
 *   - Pictures and audio (/illustrations, /audio, /words, icons): STALE WHILE REVALIDATE (fast, and kept fresh in the background).
 *   - /api/*, non-GET requests, other origins and Range requests (audio seeking): never intercepted.
 * Offline, a page that was never visited falls back to the cached dashboard, then to a plain "offline" message.
 *
 * Cache names carry VERSION. Activating a new worker deletes every older DutchTap cache. Bumping VERSION is only for
 * changing the cache *format*; routine deployments do NOT need it because pages are network first.
 */
const VERSION = 'v3';
const STATIC_CACHE = `dutchtap-static-${VERSION}`;
const PAGES_CACHE = `dutchtap-pages-${VERSION}`;
const MEDIA_CACHE = `dutchtap-media-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, MEDIA_CACHE];
// French pages name their language in the URL (?lang=fr) and are cached under that exact URL, so a French address can never be
// answered with a different language's cached entry. The page shell is language-neutral; the language is read from the address.
const PRECACHE_PAGES = ['/', '/flashcards', '/quiz', '/vocabulary', '/flashcards?lang=fr', '/quiz?lang=fr', '/vocabulary?lang=fr', '/manifest.webmanifest'];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) => Promise.allSettled(PRECACHE_PAGES.map((url) => cache.add(url)))),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('dutchtap-') && !CURRENT_CACHES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

/** Which strategy applies to this request, or null to leave it alone. */
function classify(request, url) {
  if (request.method !== 'GET') return null;
  if (url.origin !== self.location.origin) return null;
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return null;
  if (request.headers.get('range')) return null;
  if (url.pathname.startsWith('/_next/static/')) return 'static';
  if (/^\/(illustrations|audio|words)\//.test(url.pathname) || /^\/(icon-|apple-touch-icon|favicon)/.test(url.pathname)) return 'media';
  return 'page';
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cacheable = (response) => response && response.ok && response.type !== 'opaque';

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (cacheable(response)) cache.put(request, response.clone()).catch(() => {});
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((response) => { if (cacheable(response)) cache.put(request, response.clone()).catch(() => {}); return response; });
  if (cached) { refresh.catch(() => {}); return cached; }
  return refresh;
}

async function findCachedPage(cache, request) {
  const exact = await cache.match(request);
  if (exact) return exact;
  if (request.mode !== 'navigate') return undefined; // never answer a data request with an HTML page
  const url = new URL(request.url);
  return (await cache.match(url.pathname, { ignoreSearch: true })) || (await cache.match('/flashcards')) || (await cache.match('/'));
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE);
  const network = fetch(request).then((response) => { if (cacheable(response)) cache.put(request, response.clone()).catch(() => {}); return response; });
  const quiet = network.catch(() => null);
  const first = await Promise.race([quiet, sleep(NETWORK_TIMEOUT_MS).then(() => 'timeout')]);
  if (first && first !== 'timeout') return first; // a fresh answer from the network
  const cached = await findCachedPage(cache, request);
  if (cached) return cached;
  if (first === 'timeout') { const late = await quiet; if (late) return late; } // slow network and nothing saved: keep waiting
  return new Response('You are offline, and this page has not been saved on this device yet. Open it once while online.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const kind = classify(request, new URL(request.url));
  if (!kind) return;
  if (kind === 'static') event.respondWith(cacheFirst(request, STATIC_CACHE));
  else if (kind === 'media') event.respondWith(staleWhileRevalidate(request, MEDIA_CACHE));
  else event.respondWith(networkFirst(request));
});
