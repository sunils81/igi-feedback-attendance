#!/usr/bin/env node
// Testimonial video pipeline — run by .github/workflows/testimonial-video-pipeline.yml
//
// Finds new videos in each centre's "Testimonials" Drive subfolder
// (Graduation Images / Year / Centre / Testimonials), mixes in one of the two
// royalty-free tracks bundled at course-catalog-site/assets/audio/ under the
// original spoken audio with ffmpeg, uploads the finished clip to the
// Supabase Storage "testimonial-videos" bucket, and records it in the
// testimonial_videos table. Fully automatic — no approval step — per
// instruction; the site reads only rows with status='ready'.
//
// Requires env: GDRIVE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Requires: ffmpeg on PATH (pre-installed on GitHub's ubuntu-latest runners).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const GDRIVE_KEY = process.env.GDRIVE_API_KEY;
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROOT_FOLDER_ID = process.env.GDRIVE_GRADUATION_FOLDER_ID || '1guJoQ2Q8Z7RwawvFsMkAfOAjMN-mkdVO';

const MUSIC_TRACKS = [
  { name: 'blueprint-for-excellence', file: path.join(process.cwd(), 'course-catalog-site/assets/audio/blueprint-for-excellence.mp3') },
  { name: 'rising-ambitions', file: path.join(process.cwd(), 'course-catalog-site/assets/audio/rising-ambitions.mp3') }
];
const MUSIC_VOLUME = 0.18;       // background music level under the spoken testimonial

// Supabase free tier caps Storage at 1GB total and 50MB per uploaded file.
// MAX_DURATION_SECONDS keeps clips short enough to stay watchable at a bitrate
// that fits TARGET_MAX_BYTES; TARGET_MAX_BYTES leaves headroom under the 50MB
// hard limit so container overhead never pushes a file over the edge.
const MAX_DURATION_SECONDS = 240;        // 4 min safety cap — longer videos are flagged, not processed
const TARGET_MAX_BYTES = 42 * 1024 * 1024; // ~42MB target output size (Supabase free-tier hard cap is 50MB/file)
const AUDIO_BITRATE_KBPS = 96;

const YEAR_RE = /^\d{4}$/;

function isFolder(f) { return f.mimeType === 'application/vnd.google-apps.folder'; }
function isVideo(f) { return (f.mimeType || '').indexOf('video/') === 0; }

async function driveList(folderId) {
  var out = [];
  var pageToken = '';
  do {
    var url = 'https://www.googleapis.com/drive/v3/files' +
      '?q=' + encodeURIComponent("'" + folderId + "' in parents and trashed = false") +
      '&fields=' + encodeURIComponent('nextPageToken,files(id,name,mimeType)') +
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

async function findTestimonialVideos() {
  var found = []; // { id, name, year, centre }
  var yearFolders = (await driveList(ROOT_FOLDER_ID)).filter(isFolder).filter(function (f) { return YEAR_RE.test(f.name); });

  for (const yearFolder of yearFolders) {
    var centreFolders = (await driveList(yearFolder.id)).filter(isFolder).filter(function (f) { return f.name !== 'Testimonials'; });
    for (const centreFolder of centreFolders) {
      var children = await driveList(centreFolder.id);
      var testimonialsFolder = children.find(function (f) { return isFolder(f) && f.name === 'Testimonials'; });
      if (!testimonialsFolder) continue;
      var videos = (await driveList(testimonialsFolder.id)).filter(isVideo);
      for (const v of videos) found.push({ id: v.id, name: v.name, year: yearFolder.name, centre: centreFolder.name });
    }
  }
  return found;
}

async function supaGet(qs) {
  var r = await fetch(SUPA_URL + '/rest/v1/testimonial_videos?' + qs, {
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY }
  });
  if (!r.ok) throw new Error('Supabase GET failed: ' + r.status + ' ' + await r.text());
  return r.json();
}

async function supaInsert(row) {
  var r = await fetch(SUPA_URL + '/rest/v1/testimonial_videos', {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal,resolution=ignore-duplicates' },
    body: JSON.stringify(row)
  });
  if (!r.ok) throw new Error('Supabase INSERT failed: ' + r.status + ' ' + await r.text());
}

async function supaUpdate(driveFileId, patch) {
  var r = await fetch(SUPA_URL + '/rest/v1/testimonial_videos?drive_file_id=eq.' + encodeURIComponent(driveFileId), {
    method: 'PATCH',
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(patch)
  });
  if (!r.ok) throw new Error('Supabase PATCH failed: ' + r.status + ' ' + await r.text());
}

async function downloadDriveFile(fileId, destPath) {
  var url = 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media&key=' + GDRIVE_KEY;
  var r = await fetch(url);
  if (!r.ok) throw new Error('Drive download failed for ' + fileId + ': ' + r.status);
  var buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(destPath, buf);
}

function ffprobeDuration(filePath) {
  var out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath]).toString().trim();
  return parseFloat(out) || 0;
}

function mixAudio(videoPath, musicPath, outPath, durationSeconds) {
  // Loop the music indefinitely so it covers videos longer than the track;
  // amix duration=first + the video's own audio stream sets the final length,
  // so the output always matches the source video's duration exactly.
  //
  // Re-encodes video (rather than '-c:v copy') at a bitrate sized to hit
  // TARGET_MAX_BYTES for this clip's duration — phone-shot source footage is
  // often well over Supabase's 50MB/file free-tier cap at its original
  // bitrate, so stream-copying it through unchanged would get the upload
  // rejected. -maxrate/-bufsize keep it from spiking above budget on busier
  // scenes.
  var totalKbps = Math.floor((TARGET_MAX_BYTES * 8) / 1000 / durationSeconds);
  var videoKbps = Math.max(300, totalKbps - AUDIO_BITRATE_KBPS); // floor keeps even long clips watchable
  execFileSync('ffmpeg', [
    '-y',
    '-i', videoPath,
    '-stream_loop', '-1', '-i', musicPath,
    '-filter_complex', '[1:a]volume=' + MUSIC_VOLUME + '[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=2[aout]',
    '-map', '0:v', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'veryfast',
    '-b:v', videoKbps + 'k', '-maxrate', videoKbps + 'k', '-bufsize', (videoKbps * 2) + 'k',
    '-c:a', 'aac', '-b:a', AUDIO_BITRATE_KBPS + 'k',
    '-shortest',
    outPath
  ], { stdio: 'inherit' });
}

async function uploadToStorage(localPath, storagePath) {
  var buf = readFileSync(localPath);
  var r = await fetch(SUPA_URL + '/storage/v1/object/testimonial-videos/' + storagePath, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'video/mp4', 'x-upsert': 'true' },
    body: buf
  });
  if (!r.ok) throw new Error('Storage upload failed: ' + r.status + ' ' + await r.text());
  return SUPA_URL + '/storage/v1/object/public/testimonial-videos/' + storagePath;
}

async function main() {
  if (!GDRIVE_KEY || !SUPA_URL || !SUPA_KEY) {
    console.error('Missing required env vars (GDRIVE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
  }

  var candidates = await findTestimonialVideos();
  console.log('Found', candidates.length, 'testimonial video(s) in Drive.');

  var existingRows = await supaGet('select=drive_file_id');
  var known = new Set(existingRows.map(function (r) { return r.drive_file_id; }));
  var toProcess = candidates.filter(function (c) { return !known.has(c.id); });
  console.log(toProcess.length, 'new video(s) to process.');

  var tmp = mkdtempSync(path.join(tmpdir(), 'testimonial-'));

  for (let i = 0; i < toProcess.length; i++) {
    const v = toProcess[i];
    console.log('Processing:', v.name, '(' + v.centre + ' ' + v.year + ')');

    // Claim it immediately so a crashed run doesn't reprocess it next time.
    await supaInsert({ drive_file_id: v.id, year: v.year, centre: v.centre, source_name: v.name, status: 'processing' });

    try {
      const rawPath = path.join(tmp, v.id + '-raw.mp4');
      await downloadDriveFile(v.id, rawPath);

      const duration = ffprobeDuration(rawPath);
      if (duration > MAX_DURATION_SECONDS) {
        await supaUpdate(v.id, { status: 'skipped_too_long', error_message: 'Duration ' + Math.round(duration) + 's exceeds ' + MAX_DURATION_SECONDS + 's cap', processed_at: new Date().toISOString() });
        console.log('  Skipped — too long (' + Math.round(duration) + 's).');
        continue;
      }

      const track = MUSIC_TRACKS[i % MUSIC_TRACKS.length];
      const outPath = path.join(tmp, v.id + '-final.mp4');
      mixAudio(rawPath, track.file, outPath, duration);

      // Belt-and-suspenders: bitrate targeting should already land under
      // Supabase's 50MB/file free-tier cap, but verify before uploading so a
      // rejected upload doesn't surface as a confusing storage-API error.
      const outSize = statSync(outPath).size;
      if (outSize > 49 * 1024 * 1024) {
        await supaUpdate(v.id, { status: 'error', error_message: 'Encoded size ' + Math.round(outSize / 1024 / 1024) + 'MB still exceeds the 50MB Supabase free-tier file cap', processed_at: new Date().toISOString() });
        console.log('  Skipped — encoded output too large (' + Math.round(outSize / 1024 / 1024) + 'MB).');
        continue;
      }

      const storagePath = v.year + '/' + v.centre.replace(/[^a-zA-Z0-9_-]/g, '_') + '/' + v.id + '.mp4';
      const publicUrl = await uploadToStorage(outPath, storagePath);

      await supaUpdate(v.id, { status: 'ready', video_url: publicUrl, music_track: track.name, processed_at: new Date().toISOString() });
      console.log('  Done ->', publicUrl);
    } catch (e) {
      console.error('  Error:', e.message);
      await supaUpdate(v.id, { status: 'error', error_message: String(e.message || e).slice(0, 500), processed_at: new Date().toISOString() });
    }
  }

  console.log('Pipeline run complete.');
}

main().catch(function (e) { console.error('Fatal:', e); process.exit(1); });
