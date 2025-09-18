const CACHE_NAME = 'tnt-pwa-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('tnt-pwa-cache-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For navigation requests, use a network-first strategy, falling back to cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          console.log('Fetch failed; returning offline page instead.', error);
          return await caches.match(request) || await caches.match('/index.html');
        }
      })()
    );
    return;
  }

  // For non-navigation requests (assets, etc.), use a stale-while-revalidate strategy.
  if (request.destination) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        const fetchPromise = fetch(request).then(networkResponse => {
          // Do not cache API responses
          if (request.url.includes('/api/')) {
              return networkResponse;
          }
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Return cached response if available, otherwise wait for network
        return cachedResponse || await fetchPromise;
      })()
    );
  }
});
