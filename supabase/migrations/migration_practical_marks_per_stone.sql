-- Stone-wise Practical: custom stone count + marks per stone — 2026-10-06
-- Follows migration_practical_stone_marks.sql. null = legacy 10 marks per stone.
alter table public.assessments
  add column if not exists marks_per_stone numeric;

notify pgrst, 'reload schema';

-- Replacing / removing a stone PDF deletes the old file after Save.
drop policy if exists "practical-sheets anon delete" on storage.objects;
create policy "practical-sheets anon delete"
  on storage.objects for delete to anon
  using (bucket_id = 'practical-sheets');
