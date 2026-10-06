// /api/_auth-ticket.js  (leading underscore: a helper module, never routed as an endpoint)
//
// A short-lived, server-signed proof that "this browser passed the admin pin check".
//
// Why it exists. /api/auth/verify-pin answers only yes/no, so after login the browser
// held nothing a later request could prove admin with. That left /api/arp/admin no
// choice but to ask for the pin a second time — which Sunil rightly objected to: he had
// already signed in as admin on the same page. Keeping the pin in localStorage to avoid
// the re-prompt would have been worse: it is the same shared secret for every admin, it
// never rotates, and localStorage survives the session.
//
// So verify-pin now also hands back a ticket. It carries no secret, expires on its own,
// and is useless anywhere but this deployment.
//
// Signing key. Derived from SUPABASE_SERVICE_ROLE_KEY rather than a new env var, so
// nothing has to be added in Vercel before this works. The derivation is one-way and
// domain-separated by the label below, so a ticket can never be walked back to the key.
// Rotating the service role key invalidates every outstanding ticket, which is the
// behaviour you want anyway.

import crypto from 'crypto';

const LABEL = 'igi-auth-ticket-v1';
const TTL_SECONDS = 8 * 60 * 60;   // a working day's sitting; the 10-minute idle
                                   // sign-out in admin.html is the real limit in practice

function signingKey() {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) return null;
  return crypto.createHash('sha256').update(LABEL + '|' + base).digest();
}

function sign(payload) {
  const k = signingKey();
  if (!k) return null;
  return crypto.createHmac('sha256', k).update(payload).digest('base64url');
}

/* issue('admin') -> "v1.admin.<unix expiry>.<sig>", or null if the server is unconfigured. */
export function issueTicket(role) {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = 'v1|' + role + '|' + exp;
  const sig = sign(payload);
  return sig ? 'v1.' + role + '.' + exp + '.' + sig : null;
}

/* Returns the role the ticket proves, or null. Null on anything at all suspect: a
   malformed string, an unknown version, a bad signature, or an expired one. */
export function readTicket(ticket) {
  if (!ticket || typeof ticket !== 'string') return null;
  const parts = ticket.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return null;
  const [, role, expStr, sig] = parts;
  if (!/^[a-z]+$/.test(role) || !/^\d+$/.test(expStr)) return null;

  const expected = sign('v1|' + role + '|' + expStr);
  if (!expected) return null;
  // Compare digests, not the strings, so length and content leak nothing through timing.
  const a = crypto.createHash('sha256').update(sig).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) return null;

  if (Number(expStr) <= Math.floor(Date.now() / 1000)) return null;
  return role;
}
