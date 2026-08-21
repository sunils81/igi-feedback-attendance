// /api/cashfree-csv.js
// Tiny server-side proxy for ONE purpose: Google Sheets' CSV export endpoint doesn't send
// CORS headers a browser will accept, so shared.js's h_cashfreeSync (which runs client-side,
// same as every other h_* handler in this app) can't fetch it directly. This route just
// fetches the sheet as this Vercel deployment (same-origin from the browser's point of view)
// and hands back the raw CSV text — no Supabase access, no parsing, no secrets.
//
// The sheet itself is shared "anyone with link can view" (confirmed 2026-08-20), so this
// isn't exposing anything the user hasn't already made link-accessible.

const SHEET_ID = '1RfI9E0FUKwdYnQYJ3jmHst5oYwiEucvD2VPmNxaRiPw';
const SHEET_GID = '0';

export default async function handler(req, res) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    const r = await fetch(url);
    if (!r.ok) {
      return res.status(502).json({ status: 'error', reason: `Sheet fetch failed: ${r.status}` });
    }
    const text = await r.text();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).json({ status: 'error', reason: String(e) });
  }
}
