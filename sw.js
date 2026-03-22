const CACHE_NAME = 'solisystem-v3-cache';

const ASSETS = [
    './',
    './solisystem-v3.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// ── INSTALL ──
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching assets');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(n => n !== CACHE_NAME)
                    .map(n => { console.log('[SW] Clearing old cache:', n); return caches.delete(n); })
            )
        )
    );
    self.clients.claim();
});

// ── FETCH — Network first, fallback to cache ──
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    // Never intercept API calls — they must go to network
    if (event.request.url.includes('script.google.com')) return;
    if (event.request.url.includes('emailjs.com')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() =>
                caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    if (event.request.mode === 'navigate') {
                        return caches.match('./solisystem-v3.html');
                    }
                })
            )
    );
});

// ── NOTIFICATION CLICK — open the app when user taps notification ──
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // If app already open — focus it
            for (const client of clientList) {
                if (client.url.includes('solisystem') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow('./solisystem-v3.html');
            }
        })
    );
});

// ── PUSH — handle background push messages (future-proofing) ──
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'SOLISYSTEM Alert';
    const opts  = {
        body:  data.body  || 'You have an upcoming event or hearing.',
        icon:  './icon-192.png',
        badge: './icon-192.png',
        tag:   data.tag   || 'solisystem-push',
        requireInteraction: true
    };
    event.waitUntil(self.registration.showNotification(title, opts));
});
