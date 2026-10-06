// /api/auth/verify-user.js
//
// Re-checks a named user's portal password on the server and, if that user holds the
// Admin role, hands back the signed ticket from _auth-ticket.js.
//
// Why. The ARP admin tab asked for the shared admin pin even though you had just signed
// in as admin on the same page. That was not paranoia for its own sake: the per-user
// password check in shared.js happens in the BROWSER (fetch the row, hash salt|password,
// compare), so nothing about it is provable to a server. /api/arp/admin had no way to
// tell a real admin from any script posting to it, and asking for the pin was the only
// server-checkable thing left.
//
// This closes that gap properly. shared.js calls here right after a successful Admin
// login, the database re-does the comparison in auth_check_password() (security definer,
// EXECUTE granted to service_role only), and only then is a ticket issued. The existing
// client-side check is untouched, so no one's login behaviour changes -- this call is
// additive and gates nothing but the ticket.
//
// It deliberately does NOT log anyone in. A failure here costs you the ARP tab's
// convenience, nothing else.
//
// REQUIRED Vercel env vars (all already set):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { issueTicket } from '../_auth-ticket.js';

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', reason: 'method_not_allowed' });
  }
  if (!SUPA_URL || !SUPA_KEY) {
    // Fail closed: no ticket, and the page falls back to asking for the pin.
    return res.status(200).json({ ticket: null });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const name = body.name, password = body.password;
  if (!name || !password) return res.status(200).json({ ticket: null });

  try {
    const r = await fetch(SUPA_URL + '/rest/v1/rpc/auth_check_password', {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_name: String(name), p_password: String(password) })
    });
    if (!r.ok) return res.status(200).json({ ticket: null });
    const role = await r.json();

    // Only the Admin role earns a ticket. A counsellor or instructor with a perfectly
    // valid password still gets nothing here -- the ticket exists to authorise admin-only
    // endpoints, and nothing else should be able to mint one.
    const ticket = role === 'Admin' ? issueTicket('admin') : null;
    return res.status(200).json({ ticket });
  } catch (e) {
    return res.status(200).json({ ticket: null });
  }
}
