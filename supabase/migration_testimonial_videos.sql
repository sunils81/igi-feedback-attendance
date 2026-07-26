-- Backing store for the automated testimonial video pipeline.
--
-- WHY: counsellors drop raw testimonial videos into each centre's existing
-- "Testimonials" Drive subfolder (Graduation Images / Year / Centre /
-- Testimonials — the same folder the photo gallery already skips). A daily
-- GitHub Action (.github/workflows/testimonial-video-pipeline.yml, script at
-- scripts/process-testimonial-videos.mjs) finds new videos there, mixes in
-- royalty-free background music with ffmpeg, uploads the finished clip to
-- Supabase Storage, and records it here. The public site's video testimonials
-- section (course-catalog-site/api/testimonial-videos.js) reads only the
-- 'ready' rows — fully automatic, no manual approval step, per instruction.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

CREATE TABLE IF NOT EXISTS public.testimonial_videos (
  drive_file_id  TEXT PRIMARY KEY,           -- source video's Drive file id — the dedupe key so a video is never re-processed
  year           TEXT,
  centre         TEXT,
  source_name    TEXT DEFAULT '',            -- original filename, for troubleshooting
  video_url      TEXT,                       -- public URL of the finished (music-mixed) video in Supabase Storage
  music_track    TEXT,                       -- which of the two rotating tracks was used
  status         TEXT DEFAULT 'processing',  -- 'processing' | 'ready' | 'error' | 'skipped_too_long'
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  processed_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_testimonial_videos_status ON public.testimonial_videos(status);

-- Same story as graduation_gallery_cache: this project revokes default table
-- privileges, so every new table needs an explicit grant or service_role gets
-- "permission denied" even though it normally bypasses RLS.
GRANT SELECT, INSERT, UPDATE ON public.testimonial_videos TO service_role;

-- Public bucket for the finished videos. Buckets are just rows in
-- storage.buckets, so this can be done here instead of the Storage dashboard.
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-videos', 'testimonial-videos', true)
ON CONFLICT (id) DO NOTHING;
