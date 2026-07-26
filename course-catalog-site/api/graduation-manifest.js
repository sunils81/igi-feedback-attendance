// Public read-only endpoint the course-catalog-site gallery calls on page load.
// Always fast — just returns whatever api/cron/sync-graduation-photos.js last
// cached in Supabase. Never talks to Google Drive itself (that crawl is too
// slow to run per visitor; see the cron file for why).

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (!SUPA_URL || !SUPA_KEY) return res.status(200).json({});
  try {
    var r = await fetch(SUPA_URL + '/rest/v1/graduation_gallery_cache?id=eq.main&select=manifest', {
      headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY }
    });
    var rows = await r.json();
    var manifest = (rows && rows[0] && rows[0].manifest) || {};
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.status(200).json(manifest);
  } catch (e) {
    return res.status(200).json({});
  }
}
