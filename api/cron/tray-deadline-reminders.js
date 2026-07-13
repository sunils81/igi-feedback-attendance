// Vercel Cron — runs daily at 06:30 IST (01:00 UTC)
// Ports gas.js's trayCheckDeadlineReminders() (a Google Apps Script time-trigger)
// to run against Supabase now that Tray Hub has been migrated off Sheets.
// Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// For every 'active' booking: sends a reminder at 2 days before the deadline and
// on the deadline day itself, then flips any booking past its deadline to 'overdue'.

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supaGet(table, qs) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supaPost(table, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`POST ${table} failed: ${res.status} ${await res.text()}`);
}

async function supaPatch(table, qs, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PATCH ${table} failed: ${res.status} ${await res.text()}`);
}

function uniqueId(prefix) {
  return prefix + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export default async function handler(req, res) {
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars' });
  }

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const reminders = [];
  const overdue = [];
  const errors = [];

  try {
    const bookings = await supaGet('tray_bookings', 'status=eq.active&select=booking_id,tray_id,requesting_instructor,deadline_date');
    for (const b of bookings) {
      try {
        if (!b.deadline_date) continue;
        const deadline = new Date(b.deadline_date); deadline.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((deadline - now) / 86400000);

        if (daysLeft === 2 || daysLeft === 0) {
          const msg = daysLeft === 0
            ? `URGENT: Tray ${b.tray_id} is due back TODAY (${b.deadline_date}). Please dispatch immediately.`
            : `Reminder: Tray ${b.tray_id} is due back in 2 days (${b.deadline_date}). Please plan dispatch.`;
          await supaPost('tray_notifications', {
            notif_id: uniqueId('TN-'), to_instructor: b.requesting_instructor,
            type: daysLeft === 0 ? 'overdue_warning' : 'deadline_reminder',
            booking_id: b.booking_id, message: msg, read: 'N', created_at: new Date().toISOString()
          });
          reminders.push({ bookingId: b.booking_id, trayId: b.tray_id, daysLeft });
        }
        if (daysLeft < 0) {
          await supaPatch('tray_bookings', `booking_id=eq.${encodeURIComponent(b.booking_id)}`, { status: 'overdue' });
          overdue.push(b.booking_id);
        }
      } catch (err) {
        errors.push({ bookingId: b.booking_id, error: err.message });
      }
    }
    return res.status(200).json({ checked: bookings.length, reminders, overdue, errors });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
