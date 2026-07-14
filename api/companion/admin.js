// /api/companion/admin.js
// Vercel serverless — Prospects & Notes Companion, admin-side (consolidated to stay
// within the Hobby plan's 12-function-per-deployment limit; was 3 separate files).
//
// GET ?view=conflicts&resolution=pending|all   — Conflict Queue
// GET ?view=analytics&centre=                  — concern themes + per-counsellor stats
//
// POST body.op decides the operation:
//   op:'resolve-conflict' — { conflictId, action:'reassign'|'approve_shared'|'dismiss', adminName, newOwner? }
//   op:'reassign'         — { prospectId | prospectIds[], newOwner, reassignedBy }

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

// ── GET view=conflicts ────────────────────────────────────────
async function handleConflicts(req, res) {
  const { resolution = 'pending' } = req.query;
  let qs = `select=*,companion_prospects(id,name,phone_raw,email,temperature,status,course_interest)&order=created_at.desc&limit=500`;
  if (resolution !== 'all') {
    qs += resolution === 'pending' ? `&resolution=in.(pending,transfer_requested)` : `&resolution=eq.${encodeURIComponent(resolution)}`;
  }
  const conflicts = await supaGet('companion_conflicts', qs);
  const now = Date.now();
  const enriched = conflicts.map(c => ({
    ...c,
    is_escalated: c.resolution === 'transfer_requested' && (now - new Date(c.created_at).getTime()) > 48 * 3600000
  }));
  res.status(200).json({ status: 'ok', conflicts: enriched });
}

// ── GET view=analytics ────────────────────────────────────────
async function handleAnalytics(req, res) {
  const { centre } = req.query;
  let qs = 'select=owner_counselor,status,temperature,concern_tags,last_contacted,created_at,centre&archived_at=is.null&limit=5000';
  if (centre) qs += `&centre=eq.${encodeURIComponent(centre)}`;
  const rows = await supaGet('companion_prospects', qs);

  const concernTally = {};
  rows.forEach(r => (r.concern_tags || []).forEach(tag => { concernTally[tag] = (concernTally[tag] || 0) + 1; }));
  const concernThemes = Object.entries(concernTally).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));

  const byCounselor = {};
  const staleCutoff = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
  rows.forEach(r => {
    const owner = r.owner_counselor || 'Unassigned';
    if (!byCounselor[owner]) byCounselor[owner] = { counselor: owner, total: 0, active: 0, stale: 0, convertedPartial: 0, convertedFull: 0, lost: 0 };
    const b = byCounselor[owner];
    b.total++;
    if (r.status === 'Active') {
      b.active++;
      if (!r.last_contacted || r.last_contacted <= staleCutoff) b.stale++;
    }
    if (r.status === 'Converted-Partial') b.convertedPartial++;
    if (r.status === 'Converted-Full') b.convertedFull++;
    if (r.status === 'Lost') b.lost++;
  });
  const counselorStats = Object.values(byCounselor).map(b => ({
    ...b, conversionRate: b.total ? Math.round(((b.convertedPartial + b.convertedFull) / b.total) * 1000) / 10 : 0
  })).sort((a, b) => b.total - a.total);

  res.status(200).json({
    status: 'ok',
    generatedAt: new Date().toISOString(),
    totals: {
      totalProspects: rows.length,
      totalStale: counselorStats.reduce((s, c) => s + c.stale, 0),
      totalConverted: counselorStats.reduce((s, c) => s + c.convertedPartial + c.convertedFull, 0)
    },
    concernThemes,
    counselorStats
  });
}

// ── POST op=resolve-conflict ──────────────────────────────────
async function handleResolveConflict(req, res, body) {
  const { conflictId, action, adminName, newOwner } = body;
  if (!conflictId || !action) return res.status(400).json({ status: 'error', reason: 'conflictId and action are required' });

  if (action === 'reassign') {
    if (!newOwner) return res.status(400).json({ status: 'error', reason: 'newOwner is required for reassign' });
    const [conflict] = await supaGet('companion_conflicts', `id=eq.${conflictId}&select=prospect_id`);
    if (conflict && conflict.prospect_id) {
      await supaPatch('companion_prospects', `id=eq.${conflict.prospect_id}`, { owner_counselor: newOwner, updated_at: new Date().toISOString() });
    }
    const updated = await supaPatch('companion_conflicts', `id=eq.${conflictId}`, { resolution: 'transferred', resolved_by: adminName || 'Admin', resolved_at: new Date().toISOString() });
    return res.status(200).json({ status: 'ok', conflict: updated[0] });
  }
  if (action === 'approve_shared') {
    const updated = await supaPatch('companion_conflicts', `id=eq.${conflictId}`, { resolution: 'shared', resolved_by: adminName || 'Admin', resolved_at: new Date().toISOString() });
    return res.status(200).json({ status: 'ok', conflict: updated[0] });
  }
  if (action === 'dismiss') {
    const updated = await supaPatch('companion_conflicts', `id=eq.${conflictId}`, { resolution: 'dismissed', resolved_by: adminName || 'Admin', resolved_at: new Date().toISOString() });
    return res.status(200).json({ status: 'ok', conflict: updated[0] });
  }
  return res.status(400).json({ status: 'error', reason: 'Unknown action' });
}

// ── POST op=reassign ──────────────────────────────────────────
async function handleReassign(req, res, body) {
  const { prospectId, prospectIds, newOwner, reassignedBy } = body;
  const ids = prospectIds && Array.isArray(prospectIds) ? prospectIds : (prospectId ? [prospectId] : []);
  if (!ids.length) return res.status(400).json({ status: 'error', reason: 'prospectId or prospectIds is required' });
  if (!newOwner || !newOwner.trim()) return res.status(400).json({ status: 'error', reason: 'newOwner is required' });
  if (ids.length > 200) return res.status(400).json({ status: 'error', reason: 'Maximum 200 prospects per bulk reassign' });

  const idsFilter = 'id=in.(' + ids.map(id => `"${id}"`).join(',') + ')';
  const updated = await supaPatch('companion_prospects', idsFilter, { owner_counselor: newOwner.trim(), updated_at: new Date().toISOString() });
  res.status(200).json({ status: 'ok', reassigned: updated.length, newOwner: newOwner.trim(), reassignedBy: reassignedBy || 'Admin' });
}

export default async function handler(req, res) {
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', reason: 'Missing env vars' });
  try {
    if (req.method === 'GET') {
      const view = req.query.view || 'conflicts';
      if (view === 'analytics') return await handleAnalytics(req, res);
      return await handleConflicts(req, res);
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      if (body.op === 'reassign') return await handleReassign(req, res, body);
      if (body.op === 'resolve-conflict') return await handleResolveConflict(req, res, body);
      return res.status(400).json({ status: 'error', reason: 'Unknown op' });
    }
    res.status(405).json({ status: 'error', reason: 'Method Not Allowed' });
  } catch (err) {
    console.error('[companion/admin]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
