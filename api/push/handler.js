// /api/push/handler.js
//
// Consolidates what used to be three separate files — send.js, subscribe.js,
// unsubscribe.js — into one Vercel Serverless Function. Each file is one
// "Serverless Function" for billing/deployment purposes regardless of how
// small it is, and the Hobby plan caps a deployment at 12 total; this project
// crossed that cap on 2026-08-08 when api/push/{send,subscribe,unsubscribe}.js
// were added, and every deployment since has failed at the "Deploying
// outputs" step with exceeded_serverless_functions_per_deployment — silently,
// with no error shown anywhere except `vercel inspect --logs` / the Vercel
// API, so code changes looked "pushed" but never actually went live.
//
// vercel.json rewrites /api/push/send, /api/push/subscribe, and
// /api/push/unsubscribe to this file with ?action=<name> appended, so no
// caller (assets/push-subscribe.js, or any external cron/admin script hitting
// /api/push/send) needs to change — the public URLs are unchanged.

import webpush from 'web-push';

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PORTAL_URLS = {
  student: '/student',
  counselor: '/counselor',
  instructor: '/instructor-portal',
  admin: '/admin.html',   // added 2026-09-08 so managers get Work-dashboard pushes on the admin portal
};
const PORTALS = ['student', 'counselor', 'instructor', 'admin'];

function configureWebPush() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    throw new Error('VAPID env vars not configured');
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function fetchSubscriptions(portal, userKey) {
  let qs = `portal=eq.${encodeURIComponent(portal)}`;
  if (userKey) qs += `&user_key=eq.${encodeURIComponent(userKey)}`;
  const r = await fetch(`${SUPA_URL}/rest/v1/push_subscriptions?${qs}&select=*`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!r.ok) throw new Error(`Fetch subscriptions failed: ${r.status} ${await r.text()}`);
  return r.json();
}

// All of one person's subscriptions regardless of which portal registered them
// (a manager may have the admin portal on the laptop and the counselor PWA on the phone).
// De-duplicated by endpoint so one device never gets the same notification twice.
async function fetchSubscriptionsAllPortals(userKey) {
  const r = await fetch(`${SUPA_URL}/rest/v1/push_subscriptions?user_key=eq.${encodeURIComponent(userKey)}&select=*`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!r.ok) throw new Error(`fetch subs ${r.status}`);
  const rows = await r.json();
  const seen = new Set();
  return rows.filter((s) => (seen.has(s.endpoint) ? false : (seen.add(s.endpoint), true)));
}

async function deleteSubscriptionByEndpoint(endpoint) {
  return fetch(`${SUPA_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
    method: 'DELETE',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, Prefer: 'return=minimal' },
  });
}

// ── /api/push/send — internal, protected by x-push-secret ──────────────────

// ── Shared fan-out: send one payload to every subscription for (portal, userKey) ──
// Returns { targeted, sent, pruned, errors }. Used by handleSend and handleTaskNotify.
async function pushTo(portal, userKey, payloadObj, subsOverride) {
  const subs = subsOverride || await fetchSubscriptions(portal, userKey);
  const payload = JSON.stringify(payloadObj);
  let sent = 0, pruned = 0;
  const errors = [];
  await Promise.all(
    subs.map(async (s) => {
      const pushSub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      try {
        await webpush.sendNotification(pushSub, payload);
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          try { await deleteSubscriptionByEndpoint(s.endpoint); } catch (_e) {}
          pruned++;
        } else {
          errors.push({ endpoint: s.endpoint, error: e.message });
        }
      }
    })
  );
  return { targeted: subs.length, sent, pruned, errors };
}

async function handleSend(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ status: 'error', reason: 'Server not configured' });
  }

  const secret = req.headers['x-push-secret'];
  if (!process.env.PUSH_SEND_SECRET || secret !== process.env.PUSH_SEND_SECRET) {
    return res.status(401).json({ status: 'error', reason: 'Unauthorized' });
  }

  const { portal, userKey, title, body, url, tag } = req.body || {};
  if (!PORTALS.includes(portal)) {
    return res.status(400).json({ status: 'error', reason: 'Invalid portal' });
  }
  if (!title || !body) {
    return res.status(400).json({ status: 'error', reason: 'Missing title or body' });
  }

  try {
    configureWebPush();
  } catch (e) {
    return res.status(500).json({ status: 'error', reason: e.message });
  }

  try {
    const out = await pushTo(portal, userKey, { title, body, url: url || PORTAL_URLS[portal], tag: tag || portal });
    return res.status(200).json({ status: 'ok', ...out });
  } catch (e) {
    console.error('push send fetch subs error', e);
    return res.status(500).json({ status: 'error', reason: 'Could not load subscriptions' });
  }
}

// ── /api/push/subscribe — called from the browser after login ──────────────
async function handleSubscribe(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ status: 'error', reason: 'Server not configured' });
  }

  const { portal, userKey, subscription } = req.body || {};

  if (!PORTALS.includes(portal)) {
    return res.status(400).json({ status: 'error', reason: 'Invalid portal' });
  }
  if (!userKey || typeof userKey !== 'string') {
    return res.status(400).json({ status: 'error', reason: 'Missing userKey' });
  }
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ status: 'error', reason: 'Invalid subscription' });
  }

  try {
    const row = {
      portal,
      user_key: userKey,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: req.headers['user-agent'] || null,
      last_seen_at: new Date().toISOString(),
    };

    const r = await fetch(`${SUPA_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error('push subscribe upsert failed', r.status, text);
      return res.status(500).json({ status: 'error', reason: 'Could not save subscription' });
    }

    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error('push subscribe error', e);
    return res.status(500).json({ status: 'error', reason: 'Unexpected error' });
  }
}

// ── /api/push/unsubscribe ───────────────────────────────────────────────────
async function handleUnsubscribe(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ status: 'error', reason: 'Server not configured' });
  }

  const { endpoint } = req.body || {};
  if (!endpoint) {
    return res.status(400).json({ status: 'error', reason: 'Missing endpoint' });
  }

  try {
    const r = await deleteSubscriptionByEndpoint(endpoint);
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error('push unsubscribe delete failed', r.status, text);
      return res.status(500).json({ status: 'error', reason: 'Could not remove subscription' });
    }
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error('push unsubscribe error', e);
    return res.status(500).json({ status: 'error', reason: 'Unexpected error' });
  }
}

// ── /api/push/task-notify — Work Assignment dashboard (assets/work.js) ─────────
// Called from the browser (no shared secret — the browser can't hold one). Instead of
// trusting the request body for the message, the server re-reads the task by id with
// the service key and composes the notification itself, so the worst a caller can do
// is re-send a notification about a task that really exists.
//   body: { taskId, kind: 'assigned' | 'status' | 'comment', actor, note? }
// Recipients: 'assigned' -> the assignee; 'status'/'comment' -> assignee + assigner,
// minus whoever performed the action.
const WORK_DISPLAY = { Admin: 'HOD – Sunil Sharma' };
const wdn = (n) => WORK_DISPLAY[n] || n;
const WORK_PORTAL_BY_ROLE = { Instructor: 'instructor', AcademicHead: 'instructor', Admin: 'admin', Manager: 'admin', RevenueManager: 'admin' };

async function supaGet(path) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  return r.json();
}

async function handleTaskNotify(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ status: 'error', reason: 'Server not configured' });
  }
  const { taskId, kind, actor, note } = req.body || {};
  if (!taskId || !/^[0-9a-f-]{36}$/i.test(String(taskId))) {
    return res.status(400).json({ status: 'error', reason: 'Invalid taskId' });
  }
  try { configureWebPush(); } catch (e) {
    return res.status(500).json({ status: 'error', reason: e.message });
  }

  let task;
  try {
    const rows = await supaGet(`work_tasks?id=eq.${encodeURIComponent(taskId)}&select=id,title,assigned_to,assigned_by,status,priority,due_at`);
    task = rows[0];
  } catch (e) {
    return res.status(500).json({ status: 'error', reason: 'Could not load task' });
  }
  if (!task) return res.status(404).json({ status: 'error', reason: 'Task not found' });

  const who = String(actor || '').trim();
  let recipients = [];
  let title, body;
  if (kind === 'assigned') {
    recipients = [task.assigned_to];
    title = `New task from ${wdn(task.assigned_by) || 'your manager'}`;
    body = task.title + (task.priority === 'urgent' || task.priority === 'high' ? ` (${task.priority})` : '');
  } else if (kind === 'status') {
    recipients = [task.assigned_to, task.assigned_by];
    const label = { todo: 'To do', in_progress: 'In progress', blocked: 'Blocked', done: 'Done ✅' }[task.status] || task.status;
    title = `${wdn(who || task.assigned_to)} · ${label}`;
    body = task.title;
  } else if (kind === 'comment') {
    recipients = [task.assigned_to, task.assigned_by];
    title = `${wdn(who) || 'Comment'} on: ${task.title}`;
    body = String(note || '').slice(0, 140) || 'New comment';
  } else {
    return res.status(400).json({ status: 'error', reason: 'Invalid kind' });
  }
  recipients = [...new Set(recipients.filter((n) => n && n !== who))];
  if (!recipients.length) return res.status(200).json({ status: 'ok', sent: 0, targeted: 0 });

  // Pick each recipient's portal from their primary role (Instructor -> instructor portal,
  // everyone else -> counselor portal). The admin portal has no push subscription.
  let roleByName = {};
  try {
    const q = recipients.map((n) => `"${n.replace(/"/g, '')}"`).join(',');
    const users = await supaGet(`users?name=in.(${encodeURIComponent(q)})&select=name,role`);
    users.forEach((u) => { roleByName[u.name] = u.role; });
  } catch (_e) { /* fall back to counselor portal */ }

  // Deliver to every device the person has registered on ANY portal; the click-through
  // URL is picked from their primary role (managers land on the admin portal's Work tab).
  const results = [];
  for (const name of recipients) {
    const portal = WORK_PORTAL_BY_ROLE[roleByName[name]] || 'counselor';
    try {
      const subs = await fetchSubscriptionsAllPortals(name);
      const out = await pushTo(portal, name, {
        title, body,
        url: `${PORTAL_URLS[portal]}?work=${task.id}`,
        tag: `work-${task.id}`,
      }, subs);
      results.push({ name, portal, ...out });
    } catch (e) {
      results.push({ name, portal, error: e.message });
    }
  }
  return res.status(200).json({ status: 'ok', results });
}

// ── /api/push/discount-notify — fires when the HOD approves/rejects a discount ────────
// Called from admin.html right after reviewDiscountRequest succeeds. Like task-notify it
// takes no secret (a browser can't hold one); instead the server re-reads the request by
// id with the service key and composes the message itself, so a caller can at worst
// re-send a notification about a decision that has genuinely been recorded.
//   body: { requestId, actor }
async function handleDiscountNotify(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ status: 'error', reason: 'Server not configured' });
  }
  const { requestId, actor } = req.body || {};
  if (!requestId || !/^[0-9a-f-]{36}$/i.test(String(requestId))) {
    return res.status(400).json({ status: 'error', reason: 'Invalid requestId' });
  }
  try { configureWebPush(); } catch (e) {
    return res.status(500).json({ status: 'error', reason: e.message });
  }

  let dr;
  try {
    const rows = await supaGet(`discount_requests?id=eq.${encodeURIComponent(requestId)}&select=id,student_id,student_name,batch_code,discount_pct,status,requested_by,reviewed_by,used`);
    dr = rows[0];
  } catch (e) {
    return res.status(500).json({ status: 'error', reason: 'Could not load request' });
  }
  if (!dr) return res.status(404).json({ status: 'error', reason: 'Request not found' });
  if (dr.status !== 'approved' && dr.status !== 'rejected') {
    return res.status(200).json({ status: 'ok', sent: 0, reason: 'still pending' });
  }
  const who = wdn(dr.reviewed_by || actor || 'HOD');
  const title = dr.status === 'approved'
    ? `Discount approved by ${who}`
    : `Discount not approved by ${who}`;
  const body = dr.status === 'approved'
    ? `${dr.student_name} (${dr.batch_code}) · ${dr.discount_pct}% — please enter the revenue now.`
    : `${dr.student_name} (${dr.batch_code}) · ${dr.discount_pct}% was declined.`;

  try {
    const subs = await fetchSubscriptionsAllPortals(dr.requested_by);
    const out = await pushTo('counselor', dr.requested_by, {
      title, body,
      url: `${PORTAL_URLS.counselor}?discount=${dr.id}`,
      tag: `discount-${dr.id}`,
    }, subs);
    return res.status(200).json({ status: 'ok', to: dr.requested_by, ...out });
  } catch (e) {
    return res.status(500).json({ status: 'error', reason: e.message });
  }
}

// ── /api/push/lesson-open — gate for the day-wise lesson decks (assets/lessons.js) ─────
// The browser sends its portal session token (X-Portal-Session). We hand it to
// lesson_authorize_open() — granted to service_role only — which decides from the batch's
// syllabus progress and any HOD approval whether this person may open this day, logs the
// opening, and returns the deck's storage path. Only then do we sign a 5-minute URL for the
// file in the private lesson-decks bucket. The path itself never reaches the browser.
//   body: { batchCode, day, deckId?, purpose?: 'open' | 'prefetch' }
async function handleLessonOpen(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ status: 'error', reason: 'Server not configured' });
  }
  const token = String(req.headers['x-portal-session'] || '').trim();
  if (!token) return res.status(401).json({ status: 'error', reason: 'session' });
  const { batchCode, day, deckId, purpose } = req.body || {};
  if (deckId && !/^[0-9a-f-]{36}$/i.test(String(deckId))) {
    return res.status(400).json({ status: 'error', reason: 'Invalid deckId' });
  }
  let gate;
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/lesson_authorize_open`, {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json', 'X-Portal-Session': token,
      },
      body: JSON.stringify({
        p_batch_code: batchCode ? String(batchCode) : null,
        p_day: day === undefined || day === null || day === '' ? null : Number(day),
        p_deck_id: deckId || null,
        p_purpose: purpose === 'prefetch' ? 'prefetch' : 'open',
      }),
    });
    if (!r.ok) throw new Error(`gate ${r.status} ${await r.text()}`);
    gate = await r.json();
  } catch (e) {
    console.error('lesson-open gate failed', e);
    return res.status(500).json({ status: 'error', reason: 'Could not check access' });
  }
  if (!gate || gate.status !== 'ok' || !gate.deck || !gate.deck.path) {
    return res.status(200).json({ status: (gate && gate.status) || 'error', reason: (gate && gate.reason) || 'Not allowed' });
  }
  try {
    const path = String(gate.deck.path).split('/').map(encodeURIComponent).join('/');
    const r = await fetch(`${SUPA_URL}/storage/v1/object/sign/lesson-decks/${path}`, {
      method: 'POST',
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 300 }),
    });
    if (!r.ok) throw new Error(`sign ${r.status} ${await r.text()}`);
    const d = await r.json();
    const signed = d.signedURL || d.signedUrl;
    if (!signed) throw new Error('no signedURL');
    const { path: _omit, ...deck } = gate.deck;
    return res.status(200).json({ status: 'ok', basis: gate.basis, deck, url: `${SUPA_URL}/storage/v1${signed}` });
  } catch (e) {
    console.error('lesson-open sign failed', e);
    return res.status(500).json({ status: 'error', reason: 'Could not prepare the presentation' });
  }
}

// ── /api/push/lesson-notify — a lesson-unlock request was raised or decided ───────────
// Same pattern as discount-notify: no secret, the server re-reads the request by id and
// composes the message, and only for an event in the last 15 minutes, so a caller can at
// worst repeat a notification about something that genuinely just happened.
//   pending  -> the HOD (Admin) and the backup approvers in lesson_approvers
//   approved / rejected -> the instructor who asked
//   body: { requestId }
async function handleLessonNotify(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ status: 'error', reason: 'Server not configured' });
  }
  const { requestId } = req.body || {};
  if (!requestId || !/^[0-9a-f-]{36}$/i.test(String(requestId))) {
    return res.status(400).json({ status: 'error', reason: 'Invalid requestId' });
  }
  try { configureWebPush(); } catch (e) {
    return res.status(500).json({ status: 'error', reason: e.message });
  }
  let rq;
  try {
    const rows = await supaGet(`lesson_unlock_requests?id=eq.${encodeURIComponent(requestId)}&select=id,batch_code,syllabus_day,requested_by,reason,status,decided_by,decision_note,decided_at,created_at`);
    rq = rows[0];
  } catch (e) {
    return res.status(500).json({ status: 'error', reason: 'Could not load request' });
  }
  if (!rq) return res.status(404).json({ status: 'error', reason: 'Request not found' });
  const fresh = (t) => t && (Date.now() - new Date(t).getTime()) < 15 * 60 * 1000;

  const results = [];
  if (rq.status === 'pending') {
    if (!fresh(rq.created_at)) return res.status(200).json({ status: 'ok', sent: 0, reason: 'stale' });
    let approvers = [];
    try { approvers = (await supaGet('lesson_approvers?select=name')).map((r) => r.name); } catch (_e) {}
    const targets = [{ name: 'Admin', portal: 'admin', url: '/admin.html?lessons=1' }]
      .concat(approvers.map((n) => ({ name: n, portal: 'instructor', url: '/instructor-portal?lessons=approvals' })));
    for (const t of targets) {
      try {
        const subs = await fetchSubscriptionsAllPortals(t.name);
        const out = await pushTo(t.portal, t.name, {
          title: `Lesson access request · Day ${rq.syllabus_day}`,
          body: `${rq.requested_by} (${rq.batch_code}): ${String(rq.reason || '').slice(0, 110)}`,
          url: t.url, tag: `lesson-${rq.id}`,
        }, subs);
        results.push({ name: t.name, ...out });
      } catch (e) { results.push({ name: t.name, error: e.message }); }
    }
    return res.status(200).json({ status: 'ok', results });
  }
  if (rq.status === 'approved' || rq.status === 'rejected') {
    if (!fresh(rq.decided_at)) return res.status(200).json({ status: 'ok', sent: 0, reason: 'stale' });
    const who = wdn(rq.decided_by || 'HOD');
    const title = rq.status === 'approved'
      ? `Day ${rq.syllabus_day} unlocked by ${who}`
      : `Day ${rq.syllabus_day} request declined by ${who}`;
    const body = `${rq.batch_code}${rq.decision_note ? ' · ' + String(rq.decision_note).slice(0, 110) : (rq.status === 'approved' ? ' · open it from the Lessons tab' : '')}`;
    try {
      const subs = await fetchSubscriptionsAllPortals(rq.requested_by);
      const out = await pushTo('instructor', rq.requested_by, {
        title, body, url: '/instructor-portal?lessons=1', tag: `lesson-${rq.id}`,
      }, subs);
      return res.status(200).json({ status: 'ok', to: rq.requested_by, ...out });
    } catch (e) {
      return res.status(500).json({ status: 'error', reason: e.message });
    }
  }
  return res.status(200).json({ status: 'ok', sent: 0 });
}

export default async function handler(req, res) {
  const action = (req.query && req.query.action) || '';
  if (action === 'send') return handleSend(req, res);
  if (action === 'subscribe') return handleSubscribe(req, res);
  if (action === 'unsubscribe') return handleUnsubscribe(req, res);
  if (action === 'task-notify') return handleTaskNotify(req, res);
  if (action === 'discount-notify') return handleDiscountNotify(req, res);
  if (action === 'lesson-open') return handleLessonOpen(req, res);
  if (action === 'lesson-notify') return handleLessonNotify(req, res);
  return res.status(400).json({ status: 'error', reason: 'Unknown or missing action' });
}
