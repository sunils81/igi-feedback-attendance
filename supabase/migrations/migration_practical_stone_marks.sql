-- Stone-wise Practical marks (3 / 4 Stone Challenge) — 2026-10-06
--
-- A Practical test on the Marks tab can now be a 3- or 4-stone challenge. Each stone is
-- graded /10; assessment_marks.marks still holds the summed total (so buildDiplomaRow /
-- eligibility read it unchanged). Per-stone scores and the graded PDF for each stone are
-- stored alongside.
--
-- Run once in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
-- Safe to re-run.

-- 1. Columns ----------------------------------------------------------------
alter table public.assessments
  add column if not exists stone_count int;          -- null = classic single-total test

alter table public.assessment_marks
  add column if not exists stone_scores jsonb,       -- {"1": 8, "2": 7.5, "3": 9, "4": 6}
  add column if not exists stone_pdfs   jsonb;       -- {"1": "BATCH/ASSESSMENT/STUDENT/stone-1.pdf", ...}

-- 2. Storage bucket for graded stone sheets ---------------------------------
--    NOT public: files are opened through short-lived signed URLs from the
--    instructor portal, so a copied link stops working after 10 minutes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('practical-sheets', 'practical-sheets', false, 15728640, array['application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = 15728640, allowed_mime_types = array['application/pdf'];

-- Same anon-key trust model as fee-receipts / class-materials. UPDATE is needed
-- because re-uploading a stone's PDF overwrites the same path (x-upsert).
drop policy if exists "practical-sheets anon upload" on storage.objects;
create policy "practical-sheets anon upload"
  on storage.objects for insert to anon
  with check (bucket_id = 'practical-sheets');

drop policy if exists "practical-sheets anon update" on storage.objects;
create policy "practical-sheets anon update"
  on storage.objects for update to anon
  using (bucket_id = 'practical-sheets')
  with check (bucket_id = 'practical-sheets');

drop policy if exists "practical-sheets anon read" on storage.objects;
create policy "practical-sheets anon read"
  on storage.objects for select to anon
  using (bucket_id = 'practical-sheets');

-- 3. Reload PostgREST schema cache so the new columns are visible immediately.
notify pgrst, 'reload schema';
