// /api/push/send.js
//
// Internal endpoint that actually delivers a push notification. Not meant to
// be called from the browser — protected by a shared secret so only your own
// server-side code (crons, admin actions, etc.) can trigger a send.
//
// REQUIRED Vercel env vars:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  — generate once with `npx web-push generate-vapid-keys`
//   VAPID_SUBJECT                        — e.g. 'mailto:you@example.com' (required by the Web Push spec)
//   PUSH_SEND_SECRET                     — any random string; callers must send it as x-push-secret
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — already set for the rest of the app
//
// Usage (from another server-side function, or curl/Postman while testing):
//   POST /api/push/send
//   headers: { 'x-push-secret': '<PUSH_SEND_SECRET>' }
//   body: {
//     portal: 'student' | 'counselor' | 'instructor',
//     userKey: 'optional — omit to broadcast to everyone on that portal',
//     title: 'Session reminder',
//     body: 'Your reading session starts in 30 minutes.',
//     url: '/student'   // optional deep link opened on tap, defaults to the portal root
//   }

import webpush from 'web-push';

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PORTAL_URLS = {
  student: '/student',
  counselor: '/counselor',
  instructor: '/instructor-portal',
};

function configureWebPush() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    throw new Error('VAPID env vars not configured');
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function fetchSubscriptions(portal, userKey) {
  let qs = `portal=eq.${encodeURIComponent(portal)}`;
  if (userKey) qs += `&user_key=eq.${encodeURIComponent(userKey)}`;
  const r = await fetch(`${SUPA_URL}/rest/v1/push_subscriptions?${qs}&select=*`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!r.ok) throw new Error(`Fetch subscriptions failed: ${r.status} ${await r.text()}`);
  return r.json();
}

async function deleteSubscription(endpoint) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
      method: 'DELETE',
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, Prefer: 'return=minimal' },
    });
  } catch (e) {
    // best-effort cleanup only
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ status: 'error', reason: 'Server not configured' });
  }

  const secret = req.headers['x-push-secret'];
  if (!process.env.PUSH_SEND_SECRET || secret !== process.env.PUSH_SEND_SECRET) {
    return res.status(401).json({ status: 'error', reason: 'Unauthorized' });
  }

  const { portal, userKey, title, body, url, tag } = req.body || {};
  if (!['student', 'counselor', 'instructor'].includes(portal)) {
    return res.status(400).json({ status: 'error', reason: 'Invalid portal' });
  }
  if (!title || !body) {
    return res.status(400).json({ status: 'error', reason: 'Missing title or body' });
  }

  try {
    configureWebPush();
  } catch (e) {
    return res.status(500).json({ status: 'error', reason: e.message });
  }

  let subs;
  try {
    subs = await fetchSubscriptions(portal, userKey);
  } catch (e) {
    console.error('push send fetch subs error', e);
    return res.status(500).json({ status: 'error', reason: 'Could not load subscriptions' });
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url || PORTAL_URLS[portal],
    tag: tag || portal,
  });

  let sent = 0;
  let pruned = 0;
  const errors = [];

  await Promise.all(
    subs.map(async (s) => {
      const pushSub = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        await webpush.sendNotification(pushSub, payload);
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await deleteSubscription(s.endpoint);
          pruned++;
        } else {
          errors.push({ endpoint: s.endpoint, error: e.message });
        }
      }
    })
  );

  return res.status(200).json({ status: 'ok', targeted: subs.length, sent, pruned, errors });
}
