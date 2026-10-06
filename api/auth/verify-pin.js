// /api/auth/verify-pin.js
//
// Server-side home for the three "shared secret" pins that used to be hardcoded
// literals inside assets/shared.js ('IGI2026' for Admin, 'IGIHR2026' for the HR
// role account, 'IGIMaster2026' as a break-glass override for any user). That
// file ships as plain text to every browser that opens any portal, so anyone
// who opened dev tools / view-source could read those strings and log in as
// Admin, HR, or (via the master pin) literally any registered user.
//
// Fix: the three secrets now live only as Vercel environment variables, never
// sent to the browser. The client posts the pin it was given and asks "did
// this match one of the special roles?" — this endpoint answers with only a
// type label (or null), never the secret itself.
//
// REQUIRED Vercel env vars (set these before deploying, or the corresponding
// login path will simply stop working — normal per-user password logins are
// completely unaffected either way):
//   ADMIN_LOGIN_PIN        — replaces the old hardcoded 'IGI2026'
//   HR_LOGIN_PIN           — replaces the old hardcoded 'IGIHR2026'
//   MASTER_BREAKGLASS_PIN  — replaces the old hardcoded 'IGIMaster2026'
// Any of the three left unset simply means that login path can never match
// (fails closed) rather than falling back to an insecure default.
//
// Every successful match of MASTER_BREAKGLASS_PIN is logged to the
// admin_override_log table (see supabase/migrations/create_admin_override_log.sql)
// with the name that was accessed, timestamp, IP and user-agent, so break-glass
// use is always traceable after the fact — logging is best-effort and never
// blocks or fails the login itself.

// ── Second job: verifying a named user's own password (mode: 'user') ──────────
// This lives here rather than in its own /api/auth/verify-user because the Vercel
// Hobby plan allows twelve serverless functions per deployment and we are at twelve.
// A thirteenth file does not fail loudly — the deployment simply never goes live, and
// the previous one keeps answering, which cost an afternoon to spot. Same concern
// either way ("check a credential, maybe issue a ticket"), so one endpoint, two modes.

import crypto from 'crypto';
import { issueTicket } from '../_auth-ticket.js';

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Constant-time comparison. Hash both sides to a fixed 32-byte digest first so
// timingSafeEqual never throws on a length mismatch (which would otherwise
// leak the real secret's length via error vs. no-error timing).
function safeEqual(submitted, secret) {
  if (!submitted || !secret) return false;
  const a = crypto.createHash('sha256').update(String(submitted)).digest();
  const b = crypto.createHash('sha256').update(String(secret)).digest();
  return crypto.timingSafeEqual(a, b);
}

async function logMasterPinUse(name, req) {
  if (!SUPA_URL || !SUPA_KEY) return; // best-effort only
  try {
    const xff = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim() || null;
    await fetch(`${SUPA_URL}/rest/v1/admin_override_log`, {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        accessed_name: name || null,
        ip,
        user_agent: req.headers['user-agent'] || null
      })
    });
  } catch (e) {
    // Logging must never be able to block or break a legitimate login.
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'Method not allowed' });
  }

  const { pin, name, password, mode } = req.body || {};

  /* ── mode: 'user' ── Re-check a named user's own portal password on the server and,
     if they hold the Admin role, issue the ticket.

     Why this exists. The per-user password check in shared.js runs in the BROWSER:
     fetch the row, hash salt|password, compare. Fine for deciding what to render,
     but it proves nothing to a server — so /api/arp/admin could not tell a real
     admin from any script posting at it, and asking for the shared pin a second time
     was the only server-checkable thing left. Sunil objected to being asked for a pin
     he had already given, and he was right to.

     The comparison itself happens in auth_check_password() inside the database
     (security definer, EXECUTE granted to service_role only, so the public anon key
     cannot use it as a password oracle). The salt and hash never leave Postgres.

     This never logs anyone in. Failure here costs the ARP tab's convenience, nothing
     more, so it returns a bare null ticket rather than an error in every bad case. */
  if (mode === 'user' || password) {
    if (!SUPA_URL || !SUPA_KEY || !name || !password) {
      return res.status(200).json({ ticket: null });
    }
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/rpc/auth_check_password`, {
        method: 'POST',
        headers: {
          apikey: SUPA_KEY,
          Authorization: `Bearer ${SUPA_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_name: String(name), p_password: String(password) })
      });
      if (!r.ok) return res.status(200).json({ ticket: null });
      const role = await r.json();
      // Only Admin earns a ticket. A counsellor with a perfectly valid password gets
      // nothing here — the ticket authorises admin-only endpoints and nothing else
      // should be able to mint one.
      return res.status(200).json({ ticket: role === 'Admin' ? issueTicket('admin') : null });
    } catch (e) {
      return res.status(200).json({ ticket: null });
    }
  }

  if (!pin) return res.status(200).json({ matchedType: null });

  let matchedType = null;
  if (safeEqual(pin, process.env.ADMIN_LOGIN_PIN)) matchedType = 'admin';
  else if (safeEqual(pin, process.env.HR_LOGIN_PIN)) matchedType = 'hr';
  else if (safeEqual(pin, process.env.MASTER_BREAKGLASS_PIN)) matchedType = 'master';

  if (matchedType === 'master') {
    await logMasterPinUse(name, req);
  }

  // Admin and break-glass logins also get a signed, expiring ticket, so later admin-only
  // calls (currently /api/arp/admin) can prove this browser passed the check without
  // asking for the pin again and without the pin ever being stored. See _auth-ticket.js.
  // Still only a label plus an opaque signature — the secret itself never leaves here.
  const ticket = (matchedType === 'admin' || matchedType === 'master')
    ? issueTicket('admin')
    : null;

  return res.status(200).json({ matchedType, ticket });
}
