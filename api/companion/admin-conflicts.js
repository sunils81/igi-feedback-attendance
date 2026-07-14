// /api/companion/admin-conflicts.js
// Vercel serverless — admin.html "Prospects Companion" Conflict Queue.
// GET  ?resolution=pending (default) | all   — list duplicate-claim events
// POST { conflictId, action: 'reassign' | 'approve_shared' | 'dismiss', adminName, newOwner? }

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supaGet(table, qs) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}
async function supaPatch(table, qs, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    method: 'PATCH',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`PATCH ${table} failed: ${res.status} ${err}`); }
  return res.json();
}

export default async function handler(req, res) {
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', reason: 'Missing env vars' });

  try {
    if (req.method === 'GET') {
      const { resolution = 'pending' } = req.query;
      let qs = `select=*,companion_prospects(id,name,phone_raw,email,temperature,status,course_interest)&order=created_at.desc&limit=500`;
      if (resolution !== 'all') {
        // "pending" view also surfaces open transfer requests — both need admin eyes.
        qs += resolution === 'pending'
          ? `&resolution=in.(pending,transfer_requested)`
          : `&resolution=eq.${encodeURIComponent(resolution)}`;
      }
      const conflicts = await supaGet('companion_conflicts', qs);
      const now = Date.now();
      const enriched = conflicts.map(c => ({
        ...c,
        is_escalated: c.resolution === 'transfer_requested' && (now - new Date(c.created_at).getTime()) > 48 * 3600000
      }));
      return res.status(200).json({ status: 'ok', conflicts: enriched });
    }

    if (req.method === 'POST') {
      const { conflictId, action, adminName, newOwner } = req.body || {};
      if (!conflictId || !action) return res.status(400).json({ status: 'error', reason: 'conflictId and action are required' });

      if (action === 'reassign') {
        if (!newOwner) return res.status(400).json({ status: 'error', reason: 'newOwner is required for reassign' });
        const [conflict] = await supaGet('companion_conflicts', `id=eq.${conflictId}&select=prospect_id`);
        if (conflict && conflict.prospect_id) {
          await supaPatch('companion_prospects', `id=eq.${conflict.prospect_id}`, { owner_counselor: newOwner, updated_at: new Date().toISOString() });
        }
        const updated = await supaPatch('companion_conflicts', `id=eq.${conflictId}`, {
          resolution: 'transferred', resolved_by: adminName || 'Admin', resolved_at: new Date().toISOString()
        });
        return res.status(200).json({ status: 'ok', conflict: updated[0] });
      }

      if (action === 'approve_shared') {
        const updated = await supaPatch('companion_conflicts', `id=eq.${conflictId}`, {
          resolution: 'shared', resolved_by: adminName || 'Admin', resolved_at: new Date().toISOString()
        });
        return res.status(200).json({ status: 'ok', conflict: updated[0] });
      }

      if (action === 'dismiss') {
        const updated = await supaPatch('companion_conflicts', `id=eq.${conflictId}`, {
          resolution: 'dismissed', resolved_by: adminName || 'Admin', resolved_at: new Date().toISOString()
        });
        return res.status(200).json({ status: 'ok', conflict: updated[0] });
      }

      return res.status(400).json({ status: 'error', reason: 'Unknown action' });
    }

    res.status(405).json({ status: 'error', reason: 'Method Not Allowed' });
  } catch (err) {
    console.error('[companion/admin-conflicts]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
