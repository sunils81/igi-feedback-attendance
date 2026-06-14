// ============================================================
// IGI Portal — Supabase Client
// Replaces: window.GAS_URL + gasGet() + _gasPost()
// ============================================================

const SUPABASE_URL  = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const SUPABASE_ANON = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';

// Load Supabase JS from CDN — add this to your HTML <head>:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let _sb = null;

function getSupabase() {
  if (!_sb) {
    _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return _sb;
}

// ── Generic helpers ──────────────────────────────────────────

async function sbGet(table, filters = {}, select = '*') {
  const db = getSupabase();
  let query = db.from(table).select(select);
  for (const [col, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null && val !== '') {
      query = query.eq(col, val);
    }
  }
  const { data, error } = await query;
  if (error) throw new Error('DB error (' + table + '): ' + error.message);
  return data;
}

async function sbInsert(table, row) {
  const db = getSupabase();
  const { data, error } = await db.from(table).insert(row).select();
  if (error) throw new Error('Insert error (' + table + '): ' + error.message);
  return data[0];
}

async function sbUpdate(table, match, updates) {
  const db = getSupabase();
  let query = db.from(table).update(updates);
  for (const [col, val] of Object.entries(match)) {
    query = query.eq(col, val);
  }
  const { data, error } = await query.select();
  if (error) throw new Error('Update error (' + table + '): ' + error.message);
  return data;
}

async function sbUpsert(table, row, onConflict) {
  const db = getSupabase();
  const opts = onConflict ? { onConflict } : {};
  const { data, error } = await db.from(table).upsert(row, opts).select();
  if (error) throw new Error('Upsert error (' + table + '): ' + error.message);
  return data[0];
}

async function sbDelete(table, match) {
  const db = getSupabase();
  let query = db.from(table).delete();
  for (const [col, val] of Object.entries(match)) {
    query = query.eq(col, val);
  }
  const { error } = await query;
  if (error) throw new Error('Delete error (' + table + '): ' + error.message);
}
