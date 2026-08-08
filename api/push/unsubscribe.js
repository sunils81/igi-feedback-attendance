// /api/push/unsubscribe.js
//
// Called when a device's push subscription goes stale on the client side
// (e.g. permission revoked). Also used internally by /api/push/send to prune
// subscriptions the push service reports as gone (404/410).

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
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
    const r = await fetch(
      `${SUPA_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: SUPA_KEY,
          Authorization: `Bearer ${SUPA_KEY}`,
          Prefer: 'return=minimal',
        },
      }
    );
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
