const CACHE_VERSION = 'v2';
const STATIC_CACHE = `loverball-static-${CACHE_VERSION}`;
const API_CACHE = `loverball-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `loverball-images-${CACHE_VERSION}`;
const VIDEO_CACHE = `loverball-video-${CACHE_VERSION}`;
const FONT_CACHE = `loverball-fonts-${CACHE_VERSION}`;

const ALL_CACHES = [STATIC_CACHE, API_CACHE, IMAGE_CACHE, VIDEO_CACHE, FONT_CACHE];

// Max cache sizes to prevent filling storage
const MAX_IMAGE_CACHE = 100;  // entries
const MAX_API_CACHE = 50;
const MAX_VIDEO_CACHE = 20;

// Critical assets to pre-cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
];

// ── Helpers ──

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    // Delete oldest entries (FIFO)
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map(k => cache.delete(k)));
  }
}

// ── Install ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch strategies ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;
  // Skip non-http
  if (!url.protocol.startsWith('http')) return;

  // ── Fonts: cache-first (long-lived, never changes) ──
  if (url.pathname.match(/\.(woff2?|ttf|otf|eot)$/i) || url.hostname.includes('fonts.')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(FONT_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── API calls (Supabase): network-first, cache 5 min, offline fallback ──
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/rest/') || url.pathname.startsWith('/functions/')) {
    event.respondWith(
      fetch(request, { signal: AbortSignal.timeout(8000) })
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(API_CACHE, MAX_API_CACHE);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ── Videos: cache with range request support ──
  if (request.destination === 'video' || url.pathname.match(/\.(mp4|mov|webm|m3u8)$/i)) {
    // For range requests, try network first (streaming)
    if (request.headers.get('range')) {
      event.respondWith(
        fetch(request).catch(() => caches.match(request))
      );
      return;
    }
    // For full video requests, cache-first
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(VIDEO_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(VIDEO_CACHE, MAX_VIDEO_CACHE);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Images: cache-first with size-limited cache ──
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico|avif)$/i)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // ── JS/CSS chunks: cache-first (immutable hashed filenames) ──
  if (url.pathname.match(/\/assets\/.*\.(js|css)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── HTML navigation: network-first with offline fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { signal: AbortSignal.timeout(5000) })
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // ── Everything else: stale-while-revalidate ──
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
