/**
 * IGI Service Worker — caches the app shell for instant load on return visits
 * Version bump the CACHE_NAME to force refresh when files change
 */
const CACHE_NAME = 'igi-v19';
const SHELL_FILES = [
  '/counselor',
  '/counselor.html',
  '/assets/shared.js'
];

// Install: cache the app shell
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_FILES).catch(function() {
        // If any file fails (e.g. /counselor route not available), carry on
        return Promise.all(
          SHELL_FILES.map(function(url) {
            return cache.add(url).catch(function() {});
          })
        );
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: remove old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: serve shell files from cache, fall back to network
// GAS API calls (script.google.com) always go to network — never cache them
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Never intercept GAS calls, POST requests, or cross-origin requests
  if (url.indexOf('script.google.com') >= 0 ||
      url.indexOf('vercel.app') < 0 && url.indexOf(self.location.origin) < 0 ||
      e.request.method !== 'GET') {
    return;
  }

  // For HTML pages: cache-first, then update in background (stale-while-revalidate)
  if (e.request.headers.get('accept') &&
      e.request.headers.get('accept').indexOf('text/html') >= 0) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        var networkFetch = fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
          }
          return response;
        }).catch(function() { return cached; });
        // Return cached immediately if available, otherwise wait for network
        return cached || networkFetch;
      })
    );
    return;
  }

  // For JS/CSS assets: cache-first
  if (url.match(/\.(js|css)(\?|$)/)) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
          }
          return response;
        });
      })
    );
  }
});
