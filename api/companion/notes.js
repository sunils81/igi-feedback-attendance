// /api/companion/notes.js
// Vercel serverless — Notes tab of the Prospects & Notes Companion.
// GET    ?counselorName=&search=&linkedProspectId=   — list, pinned first
// POST   { text, owner_counselor, linked_prospect_id?, pinned?, reminder_at? }   — create
// PATCH  { id, text?, pinned?, linked_prospect_id?, reminder_at? }               — update
// DELETE { id }                                                    — delete
//
// reminder_at (ISO timestamp, nullable) is a one-time reminder for a notebook note —
// surfaced as a due/overdue badge on the note card and an optional desktop notification
// (see cmpCheckReminders in counselor.html). Pass null/omit to leave unset, or PATCH with
// reminder_at:null to clear an existing reminder.
//
// Notes are private to their owner by default — every query here is owner-scoped
// and there is intentionally no "scope=admin" mode, per the Plan of Action.

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supaGet(table, qs) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}
async function supaPost(table, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`POST ${table} failed: ${res.status} ${err}`); }
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
async function supaDelete(table, qs) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    method: 'DELETE',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' }
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`DELETE ${table} failed: ${res.status} ${err}`); }
  return true;
}

export default async function handler(req, res) {
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', reason: 'Missing env vars' });

  try {
    if (req.method === 'GET') {
      const { counselorName, search, linkedProspectId } = req.query;
      if (!counselorName) return res.status(400).json({ status: 'error', reason: 'counselorName is required' });
      let qs = `owner_counselor=eq.${encodeURIComponent(counselorName)}&order=pinned.desc,created_at.desc&limit=500`;
      if (linkedProspectId) qs += `&linked_prospect_id=eq.${encodeURIComponent(linkedProspectId)}`;
      if (search) qs += `&text=ilike.${encodeURIComponent(`*${search}*`)}`;
      const notes = await supaGet('companion_notes', qs);
      return res.status(200).json({ status: 'ok', notes });
    }

    if (req.method === 'POST') {
      const { text, owner_counselor, linked_prospect_id, pinned, reminder_at } = req.body || {};
      if (!text || !text.trim()) return res.status(400).json({ status: 'error', reason: 'text is required' });
      if (!owner_counselor) return res.status(400).json({ status: 'error', reason: 'owner_counselor is required' });
      const created = await supaPost('companion_notes', {
        text: text.trim(),
        owner_counselor,
        linked_prospect_id: linked_prospect_id || null,
        pinned: !!pinned,
        reminder_at: reminder_at || null
      });
      return res.status(200).json({ status: 'ok', note: created[0] });
    }

    if (req.method === 'PATCH') {
      const { id, text, pinned, linked_prospect_id, reminder_at } = req.body || {};
      if (!id) return res.status(400).json({ status: 'error', reason: 'id is required' });
      const patch = { updated_at: new Date().toISOString() };
      if (text !== undefined) patch.text = text;
      if (pinned !== undefined) patch.pinned = !!pinned;
      if (linked_prospect_id !== undefined) patch.linked_prospect_id = linked_prospect_id || null;
      if (reminder_at !== undefined) patch.reminder_at = reminder_at || null;
      const updated = await supaPatch('companion_notes', `id=eq.${id}`, patch);
      return res.status(200).json({ status: 'ok', note: updated[0] });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ status: 'error', reason: 'id is required' });
      await supaDelete('companion_notes', `id=eq.${id}`);
      return res.status(200).json({ status: 'ok' });
    }

    res.status(405).json({ status: 'error', reason: 'Method Not Allowed' });
  } catch (err) {
    console.error('[companion/notes]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
