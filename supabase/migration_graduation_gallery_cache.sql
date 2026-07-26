-- Cache table for the course-catalog-site "Graduation Pics" gallery.
--
-- WHY: photos live in a Google Drive folder (Year > Centre > Month > photos),
-- organized by staff dropping files in as batches graduate. Crawling that whole
-- tree via the Drive API takes dozens of sequential calls (6 years x ~7 centres x
-- ~12 months) — far too slow to do on every visitor's page load. Instead, a
-- Vercel Cron job (course-catalog-site/api/cron/sync-graduation-photos.js) walks
-- the tree every 20 minutes and writes a flattened manifest here; the public site
-- reads this single row (course-catalog-site/api/graduation-manifest.js) instead
-- of ever calling Drive directly.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

CREATE TABLE IF NOT EXISTS public.graduation_gallery_cache (
  id          TEXT PRIMARY KEY DEFAULT 'main',
  manifest    JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the one row this table will ever have (id is always 'main' — this isn't
-- a per-user or per-year table, just a single cached blob).
INSERT INTO public.graduation_gallery_cache (id, manifest)
VALUES ('main', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
