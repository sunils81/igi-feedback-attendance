/**
 * IGI Service Worker — caches the app shell for instant load on return visits
 * Version bump the CACHE_NAME to force refresh when files change
 */
const CACHE_NAME = 'igi-v38';
const SHELL_FILES = [
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

  // HTML pages: NEVER cache — always fetch from network (prevents stale portal)
  if (e.request.headers.get('accept') &&
      e.request.headers.get('accept').indexOf('text/html') >= 0) {
    e.respondWith(fetch(e.request));
    return;
  }

  // For JS/CSS assets: NETWORK-FIRST — always fetch fresh, fall back to cache only when offline
  if (url.match(/\.(js|css)(\?|$)/)) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  }
});

// Push: show a native notification for whatever /api/push/send sent us.
// Payload shape: { title, body, url, tag } — see api/push/send.js
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = {}; }

  var title = data.title || 'IGI School of Gemology';
  var options = {
    body: data.body || '',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-192.png',
    tag: data.tag || 'igi-notification',
    data: { url: data.url || '/app' }
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification tap: focus an existing app window on that URL, or open a new one.
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var targetUrl = (e.notification.data && e.notification.data.url) || '/app';

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        if (client.url.indexOf(targetUrl) >= 0 && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
