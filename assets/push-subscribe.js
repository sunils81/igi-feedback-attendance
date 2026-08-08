/**
 * IGI Push — subscribes the current device to Web Push after login.
 * Include this script on a portal page, then call:
 *   window.IGIPush.subscribe('student' | 'counselor' | 'instructor', userKey)
 * right after a successful login. Fails silently — a push subscription
 * failure must never block or break the portal itself.
 */
(function () {
  // Public VAPID key — safe to ship in client code by design (Web Push spec).
  var VAPID_PUBLIC_KEY = 'BFayiPj9zj2S4UYmDZWhAACM5_2rGTmQ7ES_GWW6XCTNWyDmMJNrFz-hxff-chVNHUWmQtWmPzTZAg3tD7PP0oQ';

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
