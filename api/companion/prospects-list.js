// /api/companion/prospects-list.js
// Vercel serverless — Prospects & Notes Companion
// GET a counsellor's own prospects (scope=mine, default) or the org-wide table (scope=admin)
// Used by counselor.html "Prospects" tab and admin.html "Prospects Companion" tab

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supaGet(table, qs) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', reason: 'Method Not Allowed' });
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', reason: 'Missing env vars' });

  const {
    scope = 'mine',
    counselorName,
    centre,
    status,
    temperature,
    course,
    concernTag,
    search,
    includeArchived
  } = req.query;

  if (scope === 'mine' && !counselorName) {
    return res.status(400).json({ status: 'error', reason: 'counselorName is required for scope=mine' });
  }

  try {
    let qs = 'select=*&order=updated_at.desc&limit=1000';
    if (scope === 'mine') qs += `&owner_counselor=eq.${encodeURIComponent(counselorName)}`;
    if (!includeArchived) qs += '&archived_at=is.null';
    if (centre) qs += `&centre=eq.${encodeURIComponent(centre)}`;
    if (status) qs += `&status=eq.${encodeURIComponent(status)}`;
    if (temperature) qs += `&temperature=eq.${encodeURIComponent(temperature)}`;
    if (course) qs += `&course_interest=cs.${encodeURIComponent(JSON.stringify([course]))}`;
    if (concernTag) qs += `&concern_tags=cs.${encodeURIComponent(JSON.stringify([concernTag]))}`;
    if (search) {
      const s = encodeURIComponent(`*${search}*`);
      qs += `&or=(name.ilike.${s},phone.ilike.${s},email.ilike.${s})`;
    }

    const rows = await supaGet('companion_prospects', qs);

    const todayStr = new Date().toISOString().slice(0, 10);
    const goingColdCutoff = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);

    const enriched = rows.map(p => ({
      ...p,
      is_due_today: !!(p.next_follow_up && p.next_follow_up <= todayStr && !['Converted-Partial', 'Converted-Full', 'Lost'].includes(p.status)),
      is_going_cold: !!((!p.last_contacted || p.last_contacted <= goingColdCutoff) && p.status === 'Active')
    }));

    const summary = {
      total: enriched.length,
      dueToday: enriched.filter(p => p.is_due_today).length,
      goingCold: enriched.filter(p => p.is_going_cold).length,
      hot: enriched.filter(p => p.temperature === 'Hot' && p.status === 'Active').length
    };

    res.status(200).json({ status: 'ok', prospects: enriched, summary });
  } catch (err) {
    console.error('[companion/prospects-list]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
