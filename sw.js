const CACHE_NAME = 'baby-manual-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/getting-started.html',
  '/feeding.html',
  '/nappy-changing.html',
  '/sleep.html',
  '/bathing.html',
  '/soothing.html',
  '/safety.html',
  '/development.html',
  '/health.html',
  '/support.html',
  '/admin.html',
  '/session-6-resources.html',
  '/styles.css',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Cache install failed:', error);
      })
  );
  // Force activation of new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then(fetchResponse => {
          // Cache images dynamically
          if (event.request.destination === 'image') {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return fetchResponse;
          }
          
          // Don't cache non-GET requests or non-HTML/CSS/JS
          if (event.request.method !== 'GET' || 
              !event.request.url.match(/\.(html|css|js|json)$/)) {
            return fetchResponse;
          }
          
          // Clone the response
          const responseToCache = fetchResponse.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return fetchResponse;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});
