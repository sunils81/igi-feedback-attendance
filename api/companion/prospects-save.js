// /api/companion/prospects-save.js
// Vercel serverless — Prospects & Notes Companion
// POST: create a new prospect (id omitted) or update an existing one (id provided).
// Create path runs the real-time phone/email duplicate check across the whole org
// before writing anything, per the Plan of Action's ownership rule: first claim wins.
//
// Body (create): { name, phone, email, course_interest[], temperature, concern_tags[],
//                   concern_note, status, intake_cycle, next_follow_up, last_contacted,
//                   centre, owner_counselor, force? }
// Body (update): { id, ...same fields to change, owner_counselor, feeEntry? }
//
// Response on a genuine cross-owner duplicate (create path, force!=true):
//   { status: 'conflict', matchType, conflictId, existing: {...} }  — nothing written.

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

function normPhone(v) {
  if (!v) return '';
  return String(v).replace(/[^\d]/g, '').replace(/^0+/, '').slice(-10);
}
function normEmail(v) {
  if (!v) return '';
  return String(v).trim().toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', reason: 'Method Not Allowed' });
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', reason: 'Missing env vars' });

  const body = req.body || {};
  const {
    id, name, phone, email, course_interest, temperature, concern_tags, concern_note,
    status, intake_cycle, next_follow_up, last_contacted, centre, owner_counselor,
    force, feeEntry, source, conflictId
  } = body;

  if (!owner_counselor) return res.status(400).json({ status: 'error', reason: 'owner_counselor is required' });

  const phoneNorm = normPhone(phone);
  const emailNorm = normEmail(email);

  try {
    // ── UPDATE PATH ──────────────────────────────────────────────
    if (id) {
      const patch = { updated_at: new Date().toISOString() };
      if (name !== undefined) patch.name = name;
      if (phone !== undefined) { patch.phone = phoneNorm; patch.phone_raw = phone; }
      if (email !== undefined) patch.email = emailNorm;
      if (course_interest !== undefined) patch.course_interest = course_interest;
      if (temperature !== undefined) patch.temperature = temperature;
      if (concern_tags !== undefined) patch.concern_tags = concern_tags;
      if (concern_note !== undefined) patch.concern_note = concern_note;
      if (status !== undefined) patch.status = status;
      if (intake_cycle !== undefined) patch.intake_cycle = intake_cycle;
      if (next_follow_up !== undefined) patch.next_follow_up = next_follow_up || null;
      if (last_contacted !== undefined) patch.last_contacted = last_contacted || null;
      if (centre !== undefined) patch.centre = centre;

      // Conversion logic: a fee/token entry auto-moves status, per the spec —
      // no manual "mark as converted" step required.
      if (feeEntry && feeEntry.amount) {
        const existing = await supaGet('companion_prospects', `id=eq.${id}&select=fee_entries`);
        const priorEntries = (existing[0] && existing[0].fee_entries) || [];
        patch.fee_entries = [...priorEntries, { amount: feeEntry.amount, date: feeEntry.date || new Date().toISOString().slice(0, 10), type: feeEntry.type || 'token' }];
        patch.status = feeEntry.type === 'full' ? 'Converted-Full' : 'Converted-Partial';
        patch.last_contacted = new Date().toISOString().slice(0, 10);
      }

      const updated = await supaPatch('companion_prospects', `id=eq.${id}`, patch);
      return res.status(200).json({ status: 'ok', prospect: updated[0] });
    }

    // ── CREATE PATH ──────────────────────────────────────────────
    if (!name) return res.status(400).json({ status: 'error', reason: 'name is required' });

    let match = null;
    let matchType = null;
    if (phoneNorm) {
      const byPhone = await supaGet('companion_prospects', `phone=eq.${encodeURIComponent(phoneNorm)}&archived_at=is.null&limit=1`);
      if (byPhone.length) { match = byPhone[0]; matchType = 'phone'; }
    }
    if (!match && emailNorm) {
      const byEmail = await supaGet('companion_prospects', `email=eq.${encodeURIComponent(emailNorm)}&archived_at=is.null&limit=1`);
      if (byEmail.length) { match = byEmail[0]; matchType = 'email'; }
    }

    const newRow = {
      name,
      phone: phoneNorm, phone_raw: phone || '',
      email: emailNorm,
      course_interest: course_interest || [],
      temperature: temperature || 'Warm',
      concern_tags: concern_tags || [],
      concern_note: concern_note || '',
      status: status || 'Active',
      intake_cycle: intake_cycle || '',
      next_follow_up: next_follow_up || null,
      last_contacted: last_contacted || null,
      centre: centre || '',
      owner_counselor,
      fee_entries: []
    };

    // Same counsellor already tracking this person — treat as an update-in-place,
    // not a new record (avoids self-duplication on repeat manual adds).
    if (match && match.owner_counselor === owner_counselor) {
      const updated = await supaPatch('companion_prospects', `id=eq.${match.id}`, {
        course_interest: newRow.course_interest.length ? newRow.course_interest : match.course_interest,
        temperature: newRow.temperature,
        concern_tags: newRow.concern_tags.length ? newRow.concern_tags : match.concern_tags,
        concern_note: newRow.concern_note || match.concern_note,
        updated_at: new Date().toISOString()
      });
      return res.status(200).json({ status: 'ok', prospect: updated[0], note: 'Matched your own existing record — updated instead of duplicating.' });
    }

    // Cross-counsellor duplicate — do not write, surface the conflict.
    if (match && match.owner_counselor !== owner_counselor && !force) {
      const conflictLog = await supaPost('companion_conflicts', {
        prospect_id: match.id,
        existing_owner: match.owner_counselor,
        claimant_counselor: owner_counselor,
        match_type: matchType,
        claimant_payload: newRow,
        source: source || 'manual',
        resolution: 'pending'
      });
      return res.status(200).json({
        status: 'conflict',
        matchType,
        conflictId: conflictLog[0].id,
        existing: {
          id: match.id,
          name: match.name,
          owner_counselor: match.owner_counselor,
          temperature: match.temperature,
          status: match.status,
          course_interest: match.course_interest,
          last_contacted: match.last_contacted,
          created_at: match.created_at
        }
      });
    }

    // force=true (client already chose "Flag as shared interest") — create a
    // linked reference record rather than a silent second independent thread.
    if (match && match.owner_counselor !== owner_counselor && force) {
      newRow.concern_note = `(Shared interest — also tracked by ${match.owner_counselor}${newRow.concern_note ? '. ' + newRow.concern_note : '.'})`;
      const created = await supaPost('companion_prospects', newRow);
      // Resolve the original pending conflict row rather than logging a second one, when we have it.
      if (conflictId) {
        await supaPatch('companion_conflicts', `id=eq.${conflictId}`, {
          resolution: 'shared', resolved_by: owner_counselor, resolved_at: new Date().toISOString()
        });
        return res.status(200).json({ status: 'ok', prospect: created[0], conflictLogged: true });
      }
      await supaPost('companion_conflicts', {
        prospect_id: match.id,
        existing_owner: match.owner_counselor,
        claimant_counselor: owner_counselor,
        match_type: matchType,
        claimant_payload: newRow,
        source: source || 'manual',
        resolution: 'shared',
        resolved_by: owner_counselor,
        resolved_at: new Date().toISOString()
      });
      return res.status(200).json({ status: 'ok', prospect: created[0], conflictLogged: true });
    }

    // No match at all — clean create.
    const created = await supaPost('companion_prospects', newRow);
    return res.status(200).json({ status: 'ok', prospect: created[0] });

  } catch (err) {
    console.error('[companion/prospects-save]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
