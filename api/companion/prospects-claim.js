// /api/companion/prospects-claim.js
// Vercel serverless — resolves a duplicate-claim conflict raised by prospects-save.js.
// Body: { conflictId, action: 'view_only' | 'request_transfer' | 'flag_shared', actorName }
// 'view_only'        — claimant just wanted visibility; conflict closed, informational only.
// 'request_transfer' — sent to current owner, sits pending until owner/admin acts on it
//                       (admin-conflicts.js handles the actual reassignment).
// 'flag_shared'       — kept for symmetry; the actual linked record is created by
//                       prospects-save.js with force=true — this just marks the log.

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supaPatch(table, qs, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    method: 'PATCH',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`PATCH ${table} failed: ${res.status} ${err}`); }
  return res.json();
}

const RESOLUTION_MAP = {
  view_only: 'view_only',
  request_transfer: 'transfer_requested',
  flag_shared: 'shared'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', reason: 'Method Not Allowed' });
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', reason: 'Missing env vars' });

  const { conflictId, action, actorName } = req.body || {};
  if (!conflictId || !action) return res.status(400).json({ status: 'error', reason: 'conflictId and action are required' });
  if (!RESOLUTION_MAP[action]) return res.status(400).json({ status: 'error', reason: 'Unknown action' });

  try {
    const patch = { resolution: RESOLUTION_MAP[action] };
    // Transfer requests stay open for the owner/admin to act on; the other two are terminal.
    if (action !== 'request_transfer') {
      patch.resolved_by = actorName || '';
      patch.resolved_at = new Date().toISOString();
    }
    const updated = await supaPatch('companion_conflicts', `id=eq.${conflictId}`, patch);
    res.status(200).json({ status: 'ok', conflict: updated[0] });
  } catch (err) {
    console.error('[companion/prospects-claim]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
