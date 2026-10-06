-- Stone-wise Practical: custom stone count + marks per stone — 2026-10-06
-- Follows migration_practical_stone_marks.sql. null = legacy 10 marks per stone.
alter table public.assessments
  add column if not exists marks_per_stone numeric;

notify pgrst, 'reload schema';
