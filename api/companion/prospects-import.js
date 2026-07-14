// /api/companion/prospects-import.js
// Vercel serverless — CSV bulk import for Prospects & Notes Companion.
// mode='preview' — parses rows client-side already (JSON), runs the same phone/email
//                   dedup check row-by-row, writes nothing. Returns per-row status.
// mode='commit'  — takes the previewed rows plus a per-conflicting-row decision
//                   ('skip' | 'shared' | 'transfer_request') and writes accordingly.
//                   Never silently merges or silently duplicates.
//
// Row shape: { name, phone, email, course_interest, concern, notes }

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

function normPhone(v) { if (!v) return ''; return String(v).replace(/[^\d]/g, '').replace(/^0+/, '').slice(-10); }
function normEmail(v) { if (!v) return ''; return String(v).trim().toLowerCase(); }

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', reason: 'Method Not Allowed' });
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', reason: 'Missing env vars' });

  const { mode, rows, owner_counselor, centre } = req.body || {};
  if (!owner_counselor) return res.status(400).json({ status: 'error', reason: 'owner_counselor is required' });
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ status: 'error', reason: 'rows array is required' });
  if (rows.length > 500) return res.status(400).json({ status: 'error', reason: 'Maximum 500 rows per import' });

  try {
    if (mode === 'preview') {
      const results = [];
      for (const row of rows) {
        if (!row.name) { results.push({ row, rowStatus: 'invalid', reason: 'Missing name' }); continue; }
        const { match, matchType } = await checkRow(row);
        if (!match) { results.push({ row, rowStatus: 'new' }); continue; }
        if (match.owner_counselor === owner_counselor) { results.push({ row, rowStatus: 'own_duplicate', existing: match }); continue; }
        results.push({ row, rowStatus: 'conflict', matchType, existing: { id: match.id, name: match.name, owner_counselor: match.owner_counselor, temperature: match.temperature, status: match.status, last_contacted: match.last_contacted } });
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
      let created = 0, skipped = 0, shared = 0, transferRequested = 0, updated = 0, failed = 0;
      for (const item of rows) {
        const row = item.row || item;
        const decision = item.decision || 'create'; // 'create' | 'skip' | 'shared' | 'transfer_request'
        try {
          if (!row.name) { failed++; continue; }
          if (decision === 'skip') { skipped++; continue; }

          const { phoneNorm, emailNorm, match, matchType } = await checkRow(row);
          const newRow = {
            name: row.name,
            phone: phoneNorm, phone_raw: row.phone || '',
            email: emailNorm,
            course_interest: row.course_interest ? [row.course_interest] : [],
            temperature: 'Warm',
            concern_tags: row.concern ? [row.concern] : [],
            concern_note: row.notes || '',
            status: 'Active',
            centre: centre || '',
            owner_counselor,
            fee_entries: []
          };

          if (match && match.owner_counselor === owner_counselor) { updated++; continue; } // already theirs, no-op

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
            // No decision supplied for a conflicting row — refuse to silently write.
            skipped++;
            continue;
          }

          await supaPost('companion_prospects', newRow);
          created++;
        } catch (rowErr) {
          console.error('[companion/prospects-import row]', rowErr.message);
          failed++;
        }
      }
      return res.status(200).json({ status: 'ok', summary: { created, updated, skipped, shared, transferRequested, failed } });
    }

    return res.status(400).json({ status: 'error', reason: 'mode must be "preview" or "commit"' });
  } catch (err) {
    console.error('[companion/prospects-import]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}
