// /api/companion/admin-analytics.js
// Vercel serverless — admin.html "Prospects Companion" analytics widgets.
// GET ?centre=  (optional filter)
// Returns: concern theme tally, stale-prospect counts per counsellor,
// tentative-to-converted rate per counsellor.

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supaGet(table, qs) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', reason: 'Method Not Allowed' });
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', reason: 'Missing env vars' });

  const { centre } = req.query;

  try {
    let qs = 'select=owner_counselor,status,temperature,concern_tags,last_contacted,created_at,centre&archived_at=is.null&limit=5000';
    if (centre) qs += `&centre=eq.${encodeURIComponent(centre)}`;
    const rows = await supaGet('companion_prospects', qs);

    // Concern theme tally
    const concernTally = {};
    rows.forEach(r => (r.concern_tags || []).forEach(tag => { concernTally[tag] = (concernTally[tag] || 0) + 1; }));
    const concernThemes = Object.entries(concernTally).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));

    // Per-counsellor stats
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
      ...b,
      conversionRate: b.total ? Math.round(((b.convertedPartial + b.convertedFull) / b.total) * 1000) / 10 : 0
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
  } catch (err) {
    console.error('[companion/admin-analytics]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
