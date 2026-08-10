const CACHE_NAME = 'money-manage-v1';
const ASSETS_TO_CACHE = [
  '/portal',
  '/portal/login',
  '/portal/register',
  '/favicon.ico',
  '/icon.svg',
  '/dashboard_mockup.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request) || caches.match('/portal');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const url = new URL(event.request.url);
          if (
            url.pathname.startsWith('/_next/static') || 
            url.pathname.endsWith('.svg') || 
            url.pathname.endsWith('.jpg') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.js')
          ) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
        }
        return response;
      });
    })
  );
});
