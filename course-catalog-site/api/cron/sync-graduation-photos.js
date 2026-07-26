// Vercel Cron — crawls the "Graduation Images" Google Drive folder tree
// (Year > Centre > Month > photos, with a sibling "Testimonials" folder at the
// Centre level that we skip) and caches a flattened manifest in Supabase, so
// the public gallery (api/graduation-manifest.js) never has to talk to Drive
// itself. A live per-page-load crawl would mean dozens of sequential Drive API
// calls (years x centres x months) — much too slow for a visitor-facing request.
//
// Requires env vars on the igi-course-catalog Vercel project (separate from the
// main igi-feedback-attendance project's env vars — these need to be added here
// too): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GDRIVE_API_KEY.
// Optional: GDRIVE_GRADUATION_FOLDER_ID (defaults to the known folder below).
//
// Also callable manually (just hit the URL) to force an immediate refresh —
// useful right after deploying this for the first time, or after a bulk upload.

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GDRIVE_KEY = process.env.GDRIVE_API_KEY;
const ROOT_FOLDER_ID = process.env.GDRIVE_GRADUATION_FOLDER_ID || '1guJoQ2Q8Z7RwawvFsMkAfOAjMN-mkdVO';

const YEAR_RE = /^\d{4}$/;

function isFolder(f) { return f.mimeType === 'application/vnd.google-apps.folder'; }
function isImage(f) { return (f.mimeType || '').indexOf('image/') === 0; }

// Drive's thumbnailLink comes back as ...=s220 — swap the size suffix to get a
// bigger/smaller rendition instead of hand-building a different URL scheme.
function resize(thumbnailLink, size) {
  if (!thumbnailLink) return '';
  return thumbnailLink.replace(/=s\d+$/, '=s' + size);
}

async function listChildren(folderId) {
  var out = [];
  var pageToken = '';
  do {
    var url = 'https://www.googleapis.com/drive/v3/files' +
      '?q=' + encodeURIComponent("'" + folderId + "' in parents and trashed = false") +
      '&fields=' + encodeURIComponent('nextPageToken,files(id,name,mimeType,thumbnailLink)') +
      '&pageSize=1000&key=' + GDRIVE_KEY +
      (pageToken ? '&pageToken=' + pageToken : '');
    var r = await fetch(url);
    if (!r.ok) throw new Error('Drive list failed for ' + folderId + ': ' + r.status + ' ' + await r.text());
    var data = await r.json();
    out = out.concat(data.files || []);
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return out;
}

// A photo's month bucket is '' (empty string) when its Drive folder doesn't
// separate by month at all (older years) — the front-end treats that as "no
// month step, go straight from Centre to photos" rather than showing a fake
// single month tab.
async function buildManifest() {
  var manifest = {}; // { "2026": { "Mumbai": { "April": [ {id,thumb,full}, ... ], ... }, ... }, ... }

  var yearFolders = (await listChildren(ROOT_FOLDER_ID)).filter(isFolder).filter(function (f) { return YEAR_RE.test(f.name); });

  for (var yi = 0; yi < yearFolders.length; yi++) {
    var yearFolder = yearFolders[yi];
    var centres = {}; // { "Mumbai": { "April": [...], "": [...] }, ... }
    var centreFolders = (await listChildren(yearFolder.id)).filter(isFolder).filter(function (f) { return f.name !== 'Testimonials'; });

    for (var ci = 0; ci < centreFolders.length; ci++) {
      var centreFolder = centreFolders[ci];
      var centreChildren = await listChildren(centreFolder.id);
      var months = {};

      // Two folder layouts coexist in this Drive: newer years nest photos one
      // level deeper under a Month folder (Year > Centre > Month > photos);
      // older years drop photos straight into the Centre folder (Year > Centre >
      // photos). Handle both — anything that's an image right here goes in the
      // '' (no-month) bucket, and anything that's a subfolder (besides
      // "Testimonials") gets treated as a month and recursed into.
      var directImages = centreChildren.filter(isImage);
      if (directImages.length) {
        months[''] = directImages.map(function (df) {
          return { id: df.id, thumb: resize(df.thumbnailLink, 500), full: resize(df.thumbnailLink, 1600) };
        });
      }

      var monthFolders = centreChildren.filter(isFolder).filter(function (f) { return f.name !== 'Testimonials'; });
      for (var mi = 0; mi < monthFolders.length; mi++) {
        var monthFolder = monthFolders[mi];
        var files = (await listChildren(monthFolder.id)).filter(isImage);
        if (!files.length) continue;
        months[monthFolder.name] = files.map(function (f) {
          return { id: f.id, thumb: resize(f.thumbnailLink, 500), full: resize(f.thumbnailLink, 1600) };
        });
      }

      if (Object.keys(months).length) centres[centreFolder.name] = months;
    }

    if (Object.keys(centres).length) manifest[yearFolder.name] = centres;
  }

  return manifest;
}

function countPhotos(manifest) {
  var n = 0;
  Object.keys(manifest).forEach(function (y) {
    Object.keys(manifest[y]).forEach(function (c) {
      Object.keys(manifest[y][c]).forEach(function (m) { n += manifest[y][c][m].length; });
    });
  });
  return n;
}

async function saveManifest(manifest) {
  var r = await fetch(SUPA_URL + '/rest/v1/graduation_gallery_cache?id=eq.main', {
    method: 'PATCH',
    headers: {
      apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ manifest: manifest, updated_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error('Supabase save failed: ' + r.status + ' ' + await r.text());
}

export default async function handler(req, res) {
  if (!GDRIVE_KEY) return res.status(500).json({ status: 'error', message: 'GDRIVE_API_KEY not set' });
  if (!SUPA_URL || !SUPA_KEY) return res.status(500).json({ status: 'error', message: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set' });

  try {
    var manifest = await buildManifest();
    await saveManifest(manifest);
    return res.status(200).json({ status: 'ok', years: Object.keys(manifest), totalPhotos: countPhotos(manifest) });
  } catch (e) {
    console.error('sync-graduation-photos failed:', e);
    return res.status(500).json({ status: 'error', message: String((e && e.message) || e) });
  }
}
