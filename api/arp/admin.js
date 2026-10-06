// /api/arp/admin.js
//
// Server-side proxy for every ARP admin action, so the ARP staff key never reaches a
// browser.
//
// Background. The ARP tables carry no anon policy at all: the only way in or out is a
// set of security-definer functions, and the internal ones (arp_admin_*,
// arp_manager_overview) demand a staff key held in arp_internal_keys. Putting that key
// in admin.html would have made it readable by anyone who opened view-source on the
// portal - the exact problem /api/auth/verify-pin was built to fix for the login pins.
//
// So the key stays on the server. The browser sends the admin pin it was given, this
// endpoint checks it the same way verify-pin does (constant time, against the same env
// vars, failing closed when they are unset), reads the staff key with the service role,
// and makes the RPC call itself. The browser never sees the key, and a client manager
// holding an ARP link has nothing that reaches these actions.
//
// REQUIRED Vercel env vars (all already set for /api/auth/verify-pin):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   ADMIN_LOGIN_PIN
//   MASTER_BREAKGLASS_PIN   (optional, break-glass only)

import crypto from 'crypto';
import { readTicket } from '../_auth-ticket.js';

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/* Only these may be called, and each names the arguments it accepts. An allow-list
   rather than a pass-through: without it this endpoint would be a way to call any
   function in the database with the service role. */
const ALLOWED = {
  assessments:      ['p_staff_key'],
  responses:        ['p_staff_key', 'p_assessment_id'],
  open_assessment:  ['p_staff_key', 'p_batch_id', 'p_client_name', 'p_centre', 'p_trainer',
                     'p_country', 'p_diamond_type', 'p_session_code', 'p_code_minutes', 'p_opened_by'],
  set_flags:        ['p_staff_key', 'p_assessment_id', 'p_post_test_open',
                     'p_feedback_released', 'p_close'],
  issue_access:     ['p_staff_key', 'p_batch_id', 'p_client_name', 'p_manager_name',
                     'p_manager_email', 'p_issued_by', 'p_days'],
  revoke_access:    ['p_staff_key', 'p_access_id', 'p_revoked_by'],
  access_list:      ['p_staff_key'],
  overview:         ['p_staff_key', 'p_from', 'p_to', 'p_centre', 'p_client', 'p_trainer']
};
const FN = {
  assessments:     'arp_admin_assessments',
  responses:       'arp_admin_responses',
  open_assessment: 'arp_admin_open_assessment',
  set_flags:       'arp_admin_set_assessment_flags',
  issue_access:    'arp_admin_issue_access',
  revoke_access:   'arp_admin_revoke_access',
  access_list:     'arp_admin_access_list',
  overview:        'arp_manager_overview'
};

// Hash both sides to a fixed digest first so timingSafeEqual cannot throw on a length
// mismatch and leak the secret's length through error-vs-no-error timing.
function safeEqual(submitted, secret) {
  if (!submitted || !secret) return false;
  const a = crypto.createHash('sha256').update(String(submitted)).digest();
  const b = crypto.createHash('sha256').update(String(secret)).digest();
  return crypto.timingSafeEqual(a, b);
}
function pinIsAdmin(pin) {
  return safeEqual(pin, process.env.ADMIN_LOGIN_PIN)
      || safeEqual(pin, process.env.MASTER_BREAKGLASS_PIN);
}

async function sb(path, init) {
  const r = await fetch(SUPA_URL + '/rest/v1' + path, {
    ...init,
    headers: {
      apikey: SUPA_KEY,
      Authorization: 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      ...(init && init.headers)
    }
  });
  const text = await r.text();
  if (!r.ok) throw new Error('supabase ' + r.status + ': ' + text.slice(0, 300));
  return text ? JSON.parse(text) : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'error', reason: 'method_not_allowed' });
    return;
  }
  if (!SUPA_URL || !SUPA_KEY) {
    // Fail closed and say so plainly, rather than looking like a permissions problem.
    res.status(500).json({ status: 'error', reason: 'server_not_configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const action = body.action, params = body.params;

  // Two ways to prove admin, both server-checked:
  //   ticket — the signed, expiring proof issued at login by /api/auth/verify-pin. The
  //            normal path: the admin already passed the pin check to reach this page,
  //            so asking again was pure friction and tempted us to store the pin.
  //   pin    — still accepted, so a ticket that has expired mid-session, or a browser
  //            that signed in before this shipped, can fall back rather than fail.
  const authorised = readTicket(body.ticket) === 'admin' || pinIsAdmin(body.pin);
  if (!authorised) {
    // 'ticket_expired' tells the page to ask for the pin once instead of showing a
    // bare failure; anything else is a genuine refusal.
    res.status(401).json({
      status: 'error',
      reason: body.ticket && !body.pin ? 'ticket_expired' : 'not_authorised'
    });
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(ALLOWED, action)) {
    res.status(400).json({ status: 'error', reason: 'unknown_action' });
    return;
  }

  try {
    const keys = await sb('/arp_internal_keys?id=eq.1&select=staff_key');
    const staffKey = keys && keys[0] && keys[0].staff_key;
    if (!staffKey) {
      res.status(500).json({ status: 'error', reason: 'staff_key_missing' });
      return;
    }

    // Only the arguments this action declares are forwarded; anything else the caller
    // tried to smuggle in is dropped rather than passed to the database.
    const allowed = ALLOWED[action];
    const payload = { p_staff_key: staffKey };
    for (let i = 0; i < allowed.length; i++) {
      const k = allowed[i];
      if (k === 'p_staff_key') continue;
      payload[k] = (params && params[k] !== undefined) ? params[k] : null;
    }

    const out = await sb('/rpc/' + FN[action], { method: 'POST', body: JSON.stringify(payload) });
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ status: 'error', reason: String(e.message || e) });
  }
}
