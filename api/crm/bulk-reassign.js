// /api/crm/bulk-reassign.js
// Vercel serverless — Bulk lead reassignment for Admin CRM Dashboard
// Body: { leadIds: string[], newOwner: string, reassignedBy: string }
// Updates lead_owner on each lead, appends a note to the activity timeline

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supaPatch(table, qs, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PATCH ${table} failed: ${res.status} ${err}`);
  }
  return res.json();
}

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { leadIds, newOwner, reassignedBy } = req.body || {};

  if (!leadIds || !Array.isArray(leadIds) || !leadIds.length) {
    return res.status(400).json({ status: 'error', reason: 'leadIds array is required' });
  }
  if (!newOwner || !newOwner.trim()) {
    return res.status(400).json({ status: 'error', reason: 'newOwner is required' });
  }
  if (leadIds.length > 200) {
    return res.status(400).json({ status: 'error', reason: 'Maximum 200 leads per bulk reassign' });
  }

  const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const reassigner = (reassignedBy || 'Admin').trim();
  const newOwnerClean = newOwner.trim();

  try {
    // Fetch current lead data to capture old owner for notes
    const idsFilter = 'id=in.(' + leadIds.map(id => `"${id}"`).join(',') + ')';
    const existingLeads = await supaGet('crm_leads', `select=id,lead_owner,notes&${idsFilter}`);

    const ownerMap = {};
    existingLeads.forEach(l => { ownerMap[l.id] = l; });

    // Update each lead individually to append owner-change note
    const updates = await Promise.allSettled(leadIds.map(async (id) => {
      const existing = ownerMap[id];
      const oldOwner = existing ? (existing.lead_owner || 'Unassigned') : 'Unknown';
      const existingNotes = existing ? (existing.notes || '') : '';
      const noteEntry = `[${ts} IST] Lead reassigned from ${oldOwner} → ${newOwnerClean} by ${reassigner}`;
      const updatedNotes = noteEntry + '\n\n' + existingNotes;

      return supaPatch('crm_leads', `id=eq.${id}`, {
        lead_owner: newOwnerClean,
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      });
    }));

    const succeeded = updates.filter(r => r.status === 'fulfilled').length;
    const failed = updates.filter(r => r.status === 'rejected');

    if (failed.length > 0) {
      console.error('[bulk-reassign] partial failure:', failed.map(f => f.reason?.message));
    }

    res.status(200).json({
      status: 'ok',
      reassigned: succeeded,
      failed: failed.length,
      newOwner: newOwnerClean,
      reassignedBy: reassigner,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('[bulk-reassign]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
