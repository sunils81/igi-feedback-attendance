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
    title = `New task from ${task.assigned_by || 'your manager'}`;
    body = task.title + (task.priority === 'urgent' || task.priority === 'high' ? ` (${task.priority})` : '');
  } else if (kind === 'status') {
    recipients = [task.assigned_to, task.assigned_by];
    const label = { todo: 'To do', in_progress: 'In progress', blocked: 'Blocked', done: 'Done ✅' }[task.status] || task.status;
    title = `${who || task.assigned_to} · ${label}`;
    body = task.title;
  } else if (kind === 'comment') {
    recipients = [task.assigned_to, task.assigned_by];
    title = `${who || 'Comment'} on: ${task.title}`;
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

export default async function handler(req, res) {
  const action = (req.query && req.query.action) || '';
  if (action === 'send') return handleSend(req, res);
  if (action === 'subscribe') return handleSubscribe(req, res);
  if (action === 'unsubscribe') return handleUnsubscribe(req, res);
  if (action === 'task-notify') return handleTaskNotify(req, res);
  return res.status(400).json({ status: 'error', reason: 'Unknown or missing action' });
}
