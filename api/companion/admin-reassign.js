// /api/companion/admin-reassign.js
// Vercel serverless — direct reassignment tool (counsellor turnover, workload
// rebalancing) independent of the Conflict Queue.
// Body: { prospectId, newOwner, reassignedBy }

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', reason: 'Method Not Allowed' });
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', reason: 'Missing env vars' });

  const { prospectId, prospectIds, newOwner, reassignedBy } = req.body || {};
  const ids = prospectIds && Array.isArray(prospectIds) ? prospectIds : (prospectId ? [prospectId] : []);
  if (!ids.length) return res.status(400).json({ status: 'error', reason: 'prospectId or prospectIds is required' });
  if (!newOwner || !newOwner.trim()) return res.status(400).json({ status: 'error', reason: 'newOwner is required' });
  if (ids.length > 200) return res.status(400).json({ status: 'error', reason: 'Maximum 200 prospects per bulk reassign' });

  try {
    const idsFilter = 'id=in.(' + ids.map(id => `"${id}"`).join(',') + ')';
    const updated = await supaPatch('companion_prospects', idsFilter, {
      owner_counselor: newOwner.trim(),
      updated_at: new Date().toISOString()
    });
    res.status(200).json({ status: 'ok', reassigned: updated.length, newOwner: newOwner.trim(), reassignedBy: reassignedBy || 'Admin' });
  } catch (err) {
    console.error('[companion/admin-reassign]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
