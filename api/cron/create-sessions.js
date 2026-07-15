// Vercel Cron — runs daily at 06:00 IST (00:30 UTC)
// Idempotent: checks if a session for today already exists before creating.
// Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Each session is auto-created with its topic already set to the next
// syllabus day for that batch, worked out from the batch's own session
// history (not a fixed calendar offset) — so instructors only need to touch
// the topic if they want to override it for that day.

import syllabiLib from '../_lib/syllabi.cjs';
const { getSyllabusForCourse, computeNextSyllabusDay } = syllabiLib;

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
    // Fetch all active batches where today is within the batch dates.
    // is_active is treated as null-or-true (not a strict eq.true) because some
    // older batch rows never got backfilled after the column was added — the
    // rest of the app (see shared.js) already treats a missing/null is_active
    // as active for the same reason; a strict eq.true here silently excluded
    // those batches from ever getting an auto-created session.
    const batches = await supaGet(
      'batches',
      `and=(or(is_active.is.null,is_active.eq.true),start_date.lte.${today},or(end_date.is.null,end_date.gte.${today}))&select=batch_code,course,instructor,co_instructor,co_instructor_until`
    );

    for (const b of batches) {
      try {
        // Effective instructor for TODAY: co_instructor takes precedence while active
        // (same rule used everywhere else — student portal, proctor room, etc.)
        const effectiveInstructor =
          (b.co_instructor && (!b.co_instructor_until || b.co_instructor_until >= today))
            ? b.co_instructor
            : (b.instructor || '');
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

        // Work out the next syllabus day from this batch's own session history
        // (past non-cancelled sessions, oldest first) rather than a calendar offset —
        // this way skipped/holiday/extra days don't throw off the progression.
        const syllabus = getSyllabusForCourse(b.course);
        let topic = '';
        if (syllabus.length) {
          const pastSessions = await supaGet(
            'sessions',
            `batch_code=eq.${encodeURIComponent(b.batch_code)}&session_date=lt.${today}&session_type=neq.Cancelled&select=topic,session_date&order=session_date.asc`
          );
          const progress = computeNextSyllabusDay(syllabus, pastSessions);
          topic = progress.topic || '';
        }

        await supaPost('sessions', {
          session_code: sessCode,
          batch_code: b.batch_code,
          session_date: today,
          sess_no: nextNo,
          instructor: effectiveInstructor,
          session_type: 'Scheduled',
          topic
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
