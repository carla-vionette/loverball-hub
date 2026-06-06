function isLikelyAppCache(name) {
  return /workbox|precache|runtime|googleAnalytics|images|fonts|supabase-rest|supabase-functions/i.test(name);
}

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const cacheNames = await caches.keys();
      const appCacheNames = cacheNames.filter(isLikelyAppCache);
      await Promise.allSettled(appCacheNames.map((name) => caches.delete(name)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.allSettled(clients.map((client) => client.navigate(client.url)));
    } finally {
      await self.registration.unregister();
    }
  })());
});