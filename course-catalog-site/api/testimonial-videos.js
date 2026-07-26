// Public read-only endpoint for the video testimonials section. Returns only
// videos the pipeline has finished processing (status='ready') — never talks
// to Google Drive or does any processing itself, just reads what
// scripts/process-testimonial-videos.mjs (run via GitHub Actions) already
// finished and stored.

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (!SUPA_URL || !SUPA_KEY) return res.status(200).json([]);
  try {
    var r = await fetch(SUPA_URL + '/rest/v1/testimonial_videos?status=eq.ready&select=drive_file_id,year,centre,video_url&order=processed_at.desc', {
      headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY }
    });
    var rows = await r.json();
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return res.status(200).json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    return res.status(200).json([]);
  }
}
