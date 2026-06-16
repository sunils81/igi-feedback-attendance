// Vercel Cron — runs daily at 06:00 IST (00:30 UTC)
// Idempotent: checks if a session for today already exists before creating.
// Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supaPost(table, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST ${table} failed: ${res.status} ${err}`);
  }
}

function todayISO() {
  // Today in IST (UTC+5:30)
  const now = new Date();
  now.setMinutes(now.getMinutes() + 330);
  return now.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars' });
  }

  const today = todayISO();
  const created = [];
  const skipped = [];
  const errors = [];

  // Skip weekends — sessions are Mon–Fri only (instructors create manually if Sat needed)
  const dayOfWeek = new Date(today + 'T00:00:00+05:30').getDay(); // 0=Sun, 6=Sat
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.status(200).json({ date: today, message: 'Weekend — no auto sessions', created: [], skipped: [], errors: [] });
  }

  try {
    // Fetch all active batches where today is within the batch dates
    const batches = await supaGet(
      'batches',
      `is_active=eq.true&start_date=lte.${today}&or=(end_date.is.null,end_date.gte.${today})&select=batch_code,instructor`
    );

    for (const b of batches) {
      try {
        // Check if a session already exists for this batch today (idempotency guard)
        const todaySess = await supaGet(
          'sessions',
          `batch_code=eq.${encodeURIComponent(b.batch_code)}&session_date=eq.${today}&select=session_code&limit=1`
        );
        if (todaySess.length > 0) {
          skipped.push({ batch: b.batch_code, existing: todaySess[0].session_code });
          continue;
        }

        // Get highest sess_no for this batch to compute next sequence number
        const lastSess = await supaGet(
          'sessions',
          `batch_code=eq.${encodeURIComponent(b.batch_code)}&select=sess_no&order=sess_no.desc&limit=1`
        );
        const nextNo = lastSess.length ? (Number(lastSess[0].sess_no) + 1) : 1;
        const sessCode = `${b.batch_code}-S${String(nextNo).padStart(2, '0')}`;

        await supaPost('sessions', {
          session_code: sessCode,
          batch_code: b.batch_code,
          session_date: today,
          sess_no: nextNo,
          instructor: b.instructor || '',
          session_type: 'Scheduled'
        });

        created.push(sessCode);
      } catch (err) {
        errors.push({ batch: b.batch_code, error: err.message });
      }
    }

    return res.status(200).json({
      date: today,
      batchesProcessed: batches.length,
      created,
      skipped,
      errors
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
