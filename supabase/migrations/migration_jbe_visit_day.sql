-- Jewelry Business Essentials: floating factory-visit day.
-- APPLIED to the live database on 2026-10-21 (Supabase migrations "batches_visit_day"
-- 20261021045024 and "lesson_syllabus_key_jbe_visit_day" 20261021045112). This file is the
-- record of what was run; re-running it is safe.
--
-- The course runs 5 half days, one of which is a visit to a host factory. Which day depends on
-- the factory's availability, so batches.visit_day (1-5, default 3 when null) picks one of five
-- syllabus variants: "Jewelry Business Essentials" (visit on day 3) or
-- "Jewelry Business Essentials (Visit Day N)". Mirrors syllabusKeyFor() in assets/shared.js and
-- api/_lib/syllabi.cjs - change all three together.

alter table batches add column if not exists visit_day smallint;
comment on column batches.visit_day is 'Jewelry Business Essentials only: which of the 5 half days is the factory visit (1-5, default 3). Set per batch because it depends on the host factory''s availability.';

create or replace function public.lesson_syllabus_key(b batches)
 returns text
 language sql
 immutable
as $function$
  select case
    when b.start_date >= date '2027-01-01'
     and lower(trim(coalesce(b.course,''))) = 'diamond graduate'
      then 'Diamond Graduate' || case when lower(trim(coalesce(b.type,''))) = 'full day' then ' (3 Weeks)' else ' (7 Weeks)' end
    when b.start_date >= date '2027-01-01'
     and lower(trim(coalesce(b.course,''))) in ('colored stone graduate','coloured stone graduate')
      then 'Colored Stone Graduate' || case when lower(trim(coalesce(b.type,''))) = 'full day' then ' (3 Weeks)' else ' (7 Weeks)' end
    -- Jewelry Business Essentials: the factory visit floats with the host factory's
    -- availability, so visit_day (1-5, default 3) picks the syllabus variant.
    when lower(trim(coalesce(b.course,''))) = 'jewelry business essentials'
      then 'Jewelry Business Essentials' ||
           case when coalesce(b.visit_day, 3) between 1 and 5 and coalesce(b.visit_day, 3) <> 3
                then ' (Visit Day ' || b.visit_day || ')' else '' end
    else public.lesson_deck_course(b.course) end
$function$;

-- Deck rows: lessons-src/upload.py jbe-day-1 ... jbe-day-5 creates the base rows and, from each
-- deck.json "also" list, the rows for the four other visit-day variants (same files).
