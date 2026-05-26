const CACHE_NAME = 'bloommind-v3';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png?v=3',
  '/icon-512.png?v=3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // Skip caching for Firebase/API calls to avoid issues
  if (
    url.hostname.includes('firestore.googleapis.com') || 
    url.pathname.includes('firebase') || 
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/api/')
  ) {
    return;
  }

  // Network-First for document requests (e.g. root, .html, or extensionless SPA routes)
  // This guarantees clients always fetch the fresh index.html pointing to existing Javascript bundle hashes
  if (url.pathname === '/' || url.pathname.endsWith('.html') || !url.pathname.includes('.')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // Cache-First with update for other static files (images, fonts, stylesheets, scripts)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            // Extra safety: do not cache if the requested asset (e.g. js, css) returned a text/html body (e.g., from server's catch-all rewrite)
            const contentType = response.headers.get('content-type') || '';
            const isHtml = contentType.includes('text/html');
            const expectsHtml = url.pathname.endsWith('.html') || !url.pathname.includes('.');

            if (!isHtml || expectsHtml) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }
          return response;
        })
        .catch(() => response || new Response('Network error', { status: 408 }));

      return cached || fetchPromise;
    })
  );
});
