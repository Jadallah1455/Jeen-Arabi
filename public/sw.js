const CACHE_NAME = 'jeen-arabi-v2'; // Increment version
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Force update
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    // Strategy: Network first for HTML, Cache first for assets
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request).catch(err => {
                    console.error('SW fetch failed:', err);
                    // Return a proper 404 Response instead of undefined
                    return new Response('Offline - Resource not available', {
                        status: 404,
                        statusText: 'Not Found',
                        headers: new Headers({ 'Content-Type': 'text/plain' })
                    });
                });
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(), // Take control of tabs immediately
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});
