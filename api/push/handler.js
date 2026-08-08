// /api/push/handler.js
//
// Consolidates what used to be three separate files — send.js, subscribe.js,
// unsubscribe.js — into one Vercel Serverless Function. Each file is one
// "Serverless Function" for billing/deployment purposes regardless of how
// small it is, and the Hobby plan caps a deployment at 12 total; this project
// crossed that cap on 2026-08-08 when api/push/{send,subscribe,unsubscribe}.js
// were added, and every deployment since has failed at the "Deploying
// outputs" step with exceeded_serverless_functions_per_deployment — silently,
// with no error shown anywhere except `vercel inspect --logs` / the Vercel
// API, so code changes looked "pushed" but never actually went live.
//
// vercel.json rewrites /api/push/send, /api/push/subscribe, and
// /api/push/unsubscribe to this file with ?action=<name> appended, so no
// caller (assets/push-subscribe.js, or any external cron/admin script hitting
// /api/push/send) needs to change — the public URLs are unchanged.

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

async function deleteSubscriptionByEndpoint(endpoint) {
  return fetch(`${SUPA_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
    method: 'DELETE',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, Prefer: 'return=minimal' },
  });
}

// ── /api/push/send — internal, protected by x-push-secret ──────────────────
async function handleSend(req, res) {
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
      const pushSub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      try {
        await webpush.sendNotification(pushSub, payload);
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          try { await deleteSubscriptionByEndpoint(s.endpoint); } catch (_e) {}
          pruned++;
        } else {
          errors.push({ endpoint: s.endpoint, error: e.message });
        }
      }
    })
  );

  return res.status(200).json({ status: 'ok', targeted: subs.length, sent, pruned, errors });
}

// ── /api/push/subscribe — called from the browser after login ──────────────
async function handleSubscribe(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ status: 'error', reason: 'Server not configured' });
  }

  const { portal, userKey, subscription } = req.body || {};

  if (!['student', 'counselor', 'instructor'].includes(portal)) {
    return res.status(400).json({ status: 'error', reason: 'Invalid portal' });
  }
  if (!userKey || typeof userKey !== 'string') {
    return res.status(400).json({ status: 'error', reason: 'Missing userKey' });
  }
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ status: 'error', reason: 'Invalid subscription' });
  }

  try {
    const row = {
      portal,
      user_key: userKey,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: req.headers['user-agent'] || null,
      last_seen_at: new Date().toISOString(),
    };

    const r = await fetch(`${SUPA_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error('push subscribe upsert failed', r.status, text);
      return res.status(500).json({ status: 'error', reason: 'Could not save subscription' });
    }

    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error('push subscribe error', e);
    return res.status(500).json({ status: 'error', reason: 'Unexpected error' });
  }
}

// ── /api/push/unsubscribe ───────────────────────────────────────────────────
async function handleUnsubscribe(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ status: 'error', reason: 'Server not configured' });
  }

  const { endpoint } = req.body || {};
  if (!endpoint) {
    return res.status(400).json({ status: 'error', reason: 'Missing endpoint' });
  }

  try {
    const r = await deleteSubscriptionByEndpoint(endpoint);
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error('push unsubscribe delete failed', r.status, text);
      return res.status(500).json({ status: 'error', reason: 'Could not remove subscription' });
    }
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error('push unsubscribe error', e);
    return res.status(500).json({ status: 'error', reason: 'Unexpected error' });
  }
}

export default async function handler(req, res) {
  const action = (req.query && req.query.action) || '';
  if (action === 'send') return handleSend(req, res);
  if (action === 'subscribe') return handleSubscribe(req, res);
  if (action === 'unsubscribe') return handleUnsubscribe(req, res);
  return res.status(400).json({ status: 'error', reason: 'Unknown or missing action' });
}
