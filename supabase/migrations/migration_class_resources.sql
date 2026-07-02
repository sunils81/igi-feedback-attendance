-- Migration: Class Resources (instructor-posted materials + recorded lecture links)
-- Run this in Supabase SQL Editor
--
-- Covers two related features:
--   1. Reference materials (PDF/JPEG) instructors post for students — attachable to a
--      whole batch (category='material', session_code IS NULL) or to one specific
--      session/lecture (category='material', session_code set).
--   2. Recorded lecture links (Zoom cloud recording / Teams / YouTube unlisted / Drive) —
--      always attached to a specific session (category='recording'). Link-paste only,
--      no video file upload, by design.

CREATE TABLE IF NOT EXISTS class_resources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_code      TEXT REFERENCES batches(batch_code),
  session_code    TEXT REFERENCES sessions(session_code),   -- NULL = batch-wide material
  category        TEXT NOT NULL DEFAULT 'material',         -- 'material' | 'recording'
  title           TEXT NOT NULL,
  source_type     TEXT NOT NULL DEFAULT 'link',             -- 'upload' | 'link'
  file_url        TEXT DEFAULT '',                          -- set when source_type='upload' (class-materials bucket)
  external_url    TEXT DEFAULT '',                          -- set when source_type='link'
  file_size_bytes NUMERIC(12,0),
  uploaded_by     TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_class_resources_batch ON class_resources(batch_code);
CREATE INDEX IF NOT EXISTS idx_class_resources_session ON class_resources(session_code);

-- Enable RLS (same permissive anon-role model as the rest of this app's tables)
ALTER TABLE class_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_class_resources" ON class_resources;
CREATE POLICY "allow_all_class_resources"
  ON class_resources
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);


-- ── Storage bucket for uploaded reference materials (PDF/JPEG only — recordings are link-only) ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-materials', 'class-materials', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "igi_anon_class_materials_read" ON storage.objects;
CREATE POLICY "igi_anon_class_materials_read"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'class-materials');

DROP POLICY IF EXISTS "igi_anon_class_materials_write" ON storage.objects;
CREATE POLICY "igi_anon_class_materials_write"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'class-materials');

DROP POLICY IF EXISTS "igi_anon_class_materials_delete" ON storage.objects;
CREATE POLICY "igi_anon_class_materials_delete"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'class-materials');

-- Done. After running: Storage → class-materials bucket should exist and be public.
