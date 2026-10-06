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

// A matched pin is turned into an ordinary portal session here (auth_issue_pin_session),
// so pin logins and password logins carry the same credential. Note for anyone adding to
// this folder: the Vercel Hobby plan allows twelve serverless functions and we are at
// twelve. A thirteenth does not fail loudly — the build is rejected and the previous
// deployment keeps answering, which is confusing to debug. Add a mode here instead.

import crypto from 'crypto';

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

  const { pin, name } = req.body || {};
  if (!pin) return res.status(200).json({ matchedType: null });

  let matchedType = null;
  if (safeEqual(pin, process.env.ADMIN_LOGIN_PIN)) matchedType = 'admin';
  else if (safeEqual(pin, process.env.HR_LOGIN_PIN)) matchedType = 'hr';
  else if (safeEqual(pin, process.env.MASTER_BREAKGLASS_PIN)) matchedType = 'master';

  if (matchedType === 'master') {
    await logMasterPinUse(name, req);
  }

  // A matched pin becomes an ordinary portal session, issued by the database, so a pin
  // login and a password login hand back the same kind of credential from here on. The
  // browser gets only an opaque token; the pin itself never leaves this function.
  //
  // auth_issue_pin_session has EXECUTE granted to service_role alone — if anon could
  // call it, anyone could mint themselves an admin session and the whole exercise would
  // be pointless. That is why this has to be minted here, server-side, and not by
  // shared.js.
  let ticket = null;
  if (matchedType && SUPA_URL && SUPA_KEY) {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/rpc/auth_issue_pin_session`, {
        method: 'POST',
        headers: {
          apikey: SUPA_KEY,
          Authorization: `Bearer ${SUPA_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Break-glass binds to the named person's own row where one exists, so the
          // portal behaves exactly as it does for them.
          p_name: matchedType === 'master' ? (name || '') : '',
          p_role: matchedType === 'hr' ? 'HR' : 'Admin',
          p_via:  matchedType + '_pin'
        })
      });
      if (r.ok) {
        const d = await r.json();
        if (d && d.status === 'ok') ticket = d.token;
      }
    } catch (e) {
      // No session: the caller falls back to asking for the pin where one is needed.
      // Never fail the login itself over this.
    }
  }

  return res.status(200).json({ matchedType, ticket });
}
