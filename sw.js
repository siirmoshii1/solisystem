const CACHE_NAME = 'solisystem-v38-cache';

// The files we want to save to the tablet for offline use
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 1. Install Event: Save everything to cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// 2. Activate Event: Clean up old caches if we update the app
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                          .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// 3. Fetch Event: "Network First, Fallback to Cache" strategy
// This ensures you get the newest version if online, but it still works perfectly offline.
self.addEventListener('fetch', event => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // If online, save a fresh copy to the cache
                const resClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, resClone);
                });
                return response;
            })
            .catch(() => {
                // If offline, grab it from the cache
                return caches.match(event.request);
            })
    );
});