// /api/push/subscribe.js
//
// Called from the browser (via assets/push-subscribe.js) right after a
// student/counsellor/instructor logs in and grants notification permission.
// Upserts their PushSubscription into Supabase so /api/push/send can reach
// them later. Never touches VAPID keys — those stay server-side only.

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
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
