/**
 * IGI Push — subscribes the current device to Web Push after login.
 * Include this script on a portal page, then call:
 *   window.IGIPush.subscribe('student' | 'counselor' | 'instructor', userKey)
 * right after a successful login. Fails silently — a push subscription
 * failure must never block or break the portal itself.
 */
(function () {
  // Public VAPID key — safe to ship in client code by design (Web Push spec).
  var VAPID_PUBLIC_KEY = 'BN2twNs9QZPHvOfKpCKMYMAcUUuNMF2F0galGeFPKd6RK4ibHOoJR8m3LxEPB6aOoWp-lUb8YRjVA32v6aoPJFs';

  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  async function subscribe(portal, userKey) {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      if (!userKey) return;

      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();

      // If this browser subscribed under a previous VAPID key (rotated 2026-09-10), that
      // subscription can never be delivered to — drop it and subscribe afresh.
      if (sub && sub.options && sub.options.applicationServerKey) {
        var cur = new Uint8Array(sub.options.applicationServerKey), want = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        var same = cur.length === want.length; for (var i = 0; same && i < cur.length; i++) same = cur[i] === want[i];
        if (!same) { try { await sub.unsubscribe(); } catch (e) {} sub = null; }
      }

      if (!sub) {
        var perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal: portal, userKey: String(userKey), subscription: sub.toJSON() }),
      });
    } catch (e) {
      // Non-fatal by design — the portal works fine without push.
      if (window.console) console.warn('IGIPush.subscribe failed', e);
    }
  }

  window.IGIPush = { subscribe: subscribe };
})();
