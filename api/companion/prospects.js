// /api/companion/prospects.js
// Vercel serverless — Prospects & Notes Companion (consolidated to stay within the
// Hobby plan's 12-function-per-deployment limit; was 4 separate files).
//
// GET  ?scope=mine|admin&counselorName=&centre=&status=&temperature=&course=&concernTag=&search=
//      → list prospects (own or org-wide)
//
// POST body.op decides the operation:
//   op:'save'   (default) — create or update a prospect, with real-time dedup check
//                on create. See prospects-save's original logic.
//   op:'claim'             — resolve a duplicate-claim conflict (view_only / request_transfer / flag_shared)
//   op:'import'            — CSV bulk import. body.mode = 'preview' | 'commit'

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

function normPhone(v) { if (!v) return ''; return String(v).replace(/[^\d]/g, '').replace(/^0+/, '').slice(-10); }
function normEmail(v) { if (!v) return ''; return String(v).trim().toLowerCase(); }

// ── GET: list ─────────────────────────────────────────────────
async function handleList(req, res) {
  const {
    scope = 'mine', counselorName, centre, status, temperature, course, concernTag, search, includeArchived
  } = req.query;

  if (scope === 'mine' && !counselorName) {
    return res.status(400).json({ status: 'error', reason: 'counselorName is required for scope=mine' });
  }

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
}

// ── POST op=save: create or update ───────────────────────────
async function handleSave(req, res, body) {
  const {
    id, name, phone, email, course_interest, temperature, concern_tags, concern_note,
    status, intake_cycle, next_follow_up, last_contacted, centre, owner_counselor,
    force, feeEntry, source, conflictId
  } = body;

  if (!owner_counselor) return res.status(400).json({ status: 'error', reason: 'owner_counselor is required' });

  const phoneNorm = normPhone(phone);
  const emailNorm = normEmail(email);

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
        id: match.id, name: match.name, owner_counselor: match.owner_counselor, temperature: match.temperature,
        status: match.status, course_interest: match.course_interest, last_contacted: match.last_contacted, created_at: match.created_at
      }
    });
  }

  if (match && match.owner_counselor !== owner_counselor && force) {
    newRow.concern_note = `(Shared interest — also tracked by ${match.owner_counselor}${newRow.concern_note ? '. ' + newRow.concern_note : '.'})`;
    const created = await supaPost('companion_prospects', newRow);
    if (conflictId) {
      await supaPatch('companion_conflicts', `id=eq.${conflictId}`, {
        resolution: 'shared', resolved_by: owner_counselor, resolved_at: new Date().toISOString()
      });
      return res.status(200).json({ status: 'ok', prospect: created[0], conflictLogged: true });
    }
    await supaPost('companion_conflicts', {
      prospect_id: match.id, existing_owner: match.owner_counselor, claimant_counselor: owner_counselor,
      match_type: matchType, claimant_payload: newRow, source: source || 'manual',
      resolution: 'shared', resolved_by: owner_counselor, resolved_at: new Date().toISOString()
    });
    return res.status(200).json({ status: 'ok', prospect: created[0], conflictLogged: true });
  }

  const created = await supaPost('companion_prospects', newRow);
  return res.status(200).json({ status: 'ok', prospect: created[0] });
}

// ── POST op=claim: resolve a duplicate-claim conflict ────────
const CLAIM_RESOLUTION_MAP = { view_only: 'view_only', request_transfer: 'transfer_requested', flag_shared: 'shared' };
async function handleClaim(req, res, body) {
  const { conflictId, action, actorName } = body;
  if (!conflictId || !action) return res.status(400).json({ status: 'error', reason: 'conflictId and action are required' });
  if (!CLAIM_RESOLUTION_MAP[action]) return res.status(400).json({ status: 'error', reason: 'Unknown action' });

  const patch = { resolution: CLAIM_RESOLUTION_MAP[action] };
  if (action !== 'request_transfer') {
    patch.resolved_by = actorName || '';
    patch.resolved_at = new Date().toISOString();
  }
  const updated = await supaPatch('companion_conflicts', `id=eq.${conflictId}`, patch);
  res.status(200).json({ status: 'ok', conflict: updated[0] });
}

// ── POST op=import: CSV preview / commit ─────────────────────
async function checkRow(row) {
  const phoneNorm = normPhone(row.phone);
  const emailNorm = normEmail(row.email);
  let match = null, matchType = null;
  if (phoneNorm) {
    const r = await supaGet('companion_prospects', `phone=eq.${encodeURIComponent(phoneNorm)}&archived_at=is.null&limit=1`);
    if (r.length) { match = r[0]; matchType = 'phone'; }
  }
  if (!match && emailNorm) {
    const r = await supaGet('companion_prospects', `email=eq.${encodeURIComponent(emailNorm)}&archived_at=is.null&limit=1`);
    if (r.length) { match = r[0]; matchType = 'email'; }
  }
  return { phoneNorm, emailNorm, match, matchType };
}

async function handleImport(req, res, body) {
  const { mode, rows, owner_counselor, centre } = body;
  if (!owner_counselor) return res.status(400).json({ status: 'error', reason: 'owner_counselor is required' });
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ status: 'error', reason: 'rows array is required' });
  if (rows.length > 500) return res.status(400).json({ status: 'error', reason: 'Maximum 500 rows per import' });

  if (mode === 'preview') {
    const results = [];
    for (const row of rows) {
      if (!row.name) { results.push({ row, rowStatus: 'invalid', reason: 'Missing name' }); continue; }
      const { match } = await checkRow(row);
      if (!match) { results.push({ row, rowStatus: 'new' }); continue; }
      if (match.owner_counselor === owner_counselor) { results.push({ row, rowStatus: 'own_duplicate', existing: match }); continue; }
      results.push({ row, rowStatus: 'conflict', matchType: 'phone', existing: { id: match.id, name: match.name, owner_counselor: match.owner_counselor, temperature: match.temperature, status: match.status, last_contacted: match.last_contacted } });
    }
    const summary = {
      total: results.length,
      new: results.filter(r => r.rowStatus === 'new').length,
      ownDuplicate: results.filter(r => r.rowStatus === 'own_duplicate').length,
      conflict: results.filter(r => r.rowStatus === 'conflict').length,
      invalid: results.filter(r => r.rowStatus === 'invalid').length
    };
    return res.status(200).json({ status: 'ok', results, summary });
  }

  if (mode === 'commit') {
    let created = 0, updated = 0, skipped = 0, shared = 0, transferRequested = 0, failed = 0;
    for (const item of rows) {
      const row = item.row || item;
      const decision = item.decision || 'create';
      try {
        if (!row.name) { failed++; continue; }
        if (decision === 'skip') { skipped++; continue; }

        const { phoneNorm, emailNorm, match, matchType } = await checkRow(row);
        const newRow = {
          name: row.name, phone: phoneNorm, phone_raw: row.phone || '', email: emailNorm,
          course_interest: row.course_interest ? [row.course_interest] : [], temperature: 'Warm',
          concern_tags: row.concern ? [row.concern] : [], concern_note: row.notes || '',
          status: 'Active', centre: centre || '', owner_counselor, fee_entries: []
        };

        if (match && match.owner_counselor === owner_counselor) { updated++; continue; }

        if (match && match.owner_counselor !== owner_counselor) {
          if (decision === 'transfer_request') {
            await supaPost('companion_conflicts', {
              prospect_id: match.id, existing_owner: match.owner_counselor, claimant_counselor: owner_counselor,
              match_type: matchType, claimant_payload: newRow, source: 'csv_import', resolution: 'transfer_requested'
            });
            transferRequested++;
            continue;
          }
          if (decision === 'shared') {
            newRow.concern_note = `(Shared interest — also tracked by ${match.owner_counselor}${newRow.concern_note ? '. ' + newRow.concern_note : '.'})`;
            await supaPost('companion_prospects', newRow);
            await supaPost('companion_conflicts', {
              prospect_id: match.id, existing_owner: match.owner_counselor, claimant_counselor: owner_counselor,
              match_type: matchType, claimant_payload: newRow, source: 'csv_import', resolution: 'shared',
              resolved_by: owner_counselor, resolved_at: new Date().toISOString()
            });
            shared++;
            continue;
          }
          skipped++;
          continue;
        }

        await supaPost('companion_prospects', newRow);
        created++;
      } catch (rowErr) {
        console.error('[companion/prospects import row]', rowErr.message);
        failed++;
      }
    }
    return res.status(200).json({ status: 'ok', summary: { created, updated, skipped, shared, transferRequested, failed } });
  }

  return res.status(400).json({ status: 'error', reason: 'mode must be "preview" or "commit"' });
}

export default async function handler(req, res) {
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', reason: 'Missing env vars' });
  try {
    if (req.method === 'GET') return await handleList(req, res);
    if (req.method === 'POST') {
      const body = req.body || {};
      const op = body.op || 'save';
      if (op === 'save') return await handleSave(req, res, body);
      if (op === 'claim') return await handleClaim(req, res, body);
      if (op === 'import') return await handleImport(req, res, body);
      return res.status(400).json({ status: 'error', reason: 'Unknown op' });
    }
    res.status(405).json({ status: 'error', reason: 'Method Not Allowed' });
  } catch (err) {
    console.error('[companion/prospects]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
