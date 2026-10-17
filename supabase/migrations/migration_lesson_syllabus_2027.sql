-- Lesson decks for the January 2027 DG / CSG schedules ("7 Weeks & 3 Weeks GG Schedule.xlsx").
-- Batches of Diamond Graduate / Colored Stone Graduate starting on or after 2027-01-01 follow
--   Full Day  -> "<course> (3 Weeks)"  18 days, Mon-Sat, one syllabus day per session
--   otherwise -> "<course> (7 Weeks)"  35 days, Mon-Fri
-- Older batches keep the 30-day syllabus. Mirrors syllabusKeyFor() in assets/shared.js and
-- api/_lib/syllabi.cjs — change all three together.

create or replace function public.lesson_syllabus_key(b public.batches) returns text
language sql immutable as $$
  select case
    when b.start_date >= date '2027-01-01'
     and lower(trim(coalesce(b.course,''))) = 'diamond graduate'
      then 'Diamond Graduate' || case when lower(trim(coalesce(b.type,''))) = 'full day' then ' (3 Weeks)' else ' (7 Weeks)' end
    when b.start_date >= date '2027-01-01'
     and lower(trim(coalesce(b.course,''))) in ('colored stone graduate','coloured stone graduate')
      then 'Colored Stone Graduate' || case when lower(trim(coalesce(b.type,''))) = 'full day' then ' (3 Weeks)' else ' (7 Weeks)' end
    else public.lesson_deck_course(b.course) end
$$;

create or replace function public.lesson_pace(b public.batches) returns integer
language sql immutable as $$
  select case
    when public.lesson_syllabus_key(b) like '% Weeks)' then 1   -- the 2027 plans list every day of the batch
    when coalesce(b.syllabus_days_per_session,0) >= 1 then b.syllabus_days_per_session::int
    when lower(trim(coalesce(b.type,''))) = 'full day'
     and lower(trim(coalesce(b.course,''))) in ('diamond graduate','colored stone graduate','coloured stone graduate') then 2
    else 1 end
$$;

-- day state: decks and syllabus come from the batch's plan, not just its course name
do $$ declare d text; begin
  d := pg_get_functiondef('public.lesson_day_state'::regproc);
  if position('lesson_syllabus_key' in d) = 0 then
    d := replace(d, '''deck_course'', public.lesson_deck_course(b.course),',
                    '''deck_course'', public.lesson_syllabus_key(b), ''syllabus_key'', public.lesson_syllabus_key(b),');
    if position('lesson_syllabus_key' in d) = 0 then raise exception 'lesson_day_state: anchor not found'; end if;
    execute d;
  end if;
  d := pg_get_functiondef('public.lesson_list_requests'::regproc);
  if position('lesson_syllabus_key' in d) = 0 then
    d := replace(d, 'd.course = public.lesson_deck_course(r.course)', 'd.course = public.lesson_syllabus_key(b)');
    if position('lesson_syllabus_key' in d) = 0 then raise exception 'lesson_list_requests: anchor not found'; end if;
    execute d;
  end if;
end $$;

-- deck rows for the new plans point at the same published files as the 30-day plan
insert into public.lesson_decks(course, syllabus_day, part, title, subtitle, storage_path, version, slide_count, bytes, is_active)
select m.plan, m.day, m.part, d.title, d.subtitle, d.storage_path, d.version, d.slide_count, d.bytes, true
  from (values
    -- Diamond Graduate, 7 weeks (35 half days)
    ('Diamond Graduate (7 Weeks)', 1,1,'dg-evolution-of-diamonds'),('Diamond Graduate (7 Weeks)', 2,1,'dg-evolution-of-diamonds'),
    ('Diamond Graduate (7 Weeks)', 3,1,'dg-rough-morphology'),
    ('Diamond Graduate (7 Weeks)', 4,1,'dg-rough-sorting'),('Diamond Graduate (7 Weeks)', 4,2,'dg-rough-trading'),
    ('Diamond Graduate (7 Weeks)', 5,1,'dg-origin-of-rough'),
    ('Diamond Graduate (7 Weeks)', 6,1,'dg-clarity-inclusions'),('Diamond Graduate (7 Weeks)', 7,1,'dg-clarity-grading'),
    ('Diamond Graduate (7 Weeks)', 8,1,'dg-colour-grading'),('Diamond Graduate (7 Weeks)', 9,1,'dg-measurements'),
    ('Diamond Graduate (7 Weeks)',10,1,'dg-proportions'),
    ('Diamond Graduate (7 Weeks)',11,1,'dg-cut-finish'),('Diamond Graduate (7 Weeks)',12,1,'dg-cut-finish'),
    ('Diamond Graduate (7 Weeks)',18,1,'dg-fancy-shapes'),('Diamond Graduate (7 Weeks)',19,1,'dg-fancy-shapes'),
    ('Diamond Graduate (7 Weeks)',21,1,'dg-treatments'),
    ('Diamond Graduate (7 Weeks)',22,1,'dg-synthetics-imitations'),('Diamond Graduate (7 Weeks)',23,1,'dg-synthetics-imitations'),
    ('Diamond Graduate (7 Weeks)',24,1,'dg-pricing'),
    ('Diamond Graduate (7 Weeks)',26,1,'dg-assortment'),('Diamond Graduate (7 Weeks)',27,1,'dg-assortment'),('Diamond Graduate (7 Weeks)',28,1,'dg-assortment'),
    ('Diamond Graduate (7 Weeks)',29,1,'dg-mounted-jewellery'),('Diamond Graduate (7 Weeks)',30,1,'dg-mounted-jewellery'),
    ('Diamond Graduate (7 Weeks)',33,1,'dg-jewellery-business'),
    ('Diamond Graduate (7 Weeks)',34,1,'dg-settings'),('Diamond Graduate (7 Weeks)',34,2,'dg-metal-qa'),
    -- Diamond Graduate, 3 weeks (18 full days)
    ('Diamond Graduate (3 Weeks)', 1,1,'dg-evolution-of-diamonds'),
    ('Diamond Graduate (3 Weeks)', 2,1,'dg-rough-morphology'),('Diamond Graduate (3 Weeks)', 2,2,'dg-rough-sorting'),
    ('Diamond Graduate (3 Weeks)', 2,3,'dg-rough-trading'),('Diamond Graduate (3 Weeks)', 2,4,'dg-origin-of-rough'),
    ('Diamond Graduate (3 Weeks)', 3,1,'dg-clarity-inclusions'),('Diamond Graduate (3 Weeks)', 3,2,'dg-clarity-grading'),
    ('Diamond Graduate (3 Weeks)', 4,1,'dg-colour-grading'),('Diamond Graduate (3 Weeks)', 4,2,'dg-measurements'),
    ('Diamond Graduate (3 Weeks)', 5,1,'dg-proportions'),('Diamond Graduate (3 Weeks)', 6,1,'dg-cut-finish'),
    ('Diamond Graduate (3 Weeks)',10,1,'dg-fancy-shapes'),
    ('Diamond Graduate (3 Weeks)',11,1,'dg-treatments'),('Diamond Graduate (3 Weeks)',11,2,'dg-synthetics-imitations'),
    ('Diamond Graduate (3 Weeks)',12,1,'dg-pricing'),
    ('Diamond Graduate (3 Weeks)',14,1,'dg-assortment'),('Diamond Graduate (3 Weeks)',15,1,'dg-assortment'),
    ('Diamond Graduate (3 Weeks)',16,1,'dg-mounted-jewellery'),
    ('Diamond Graduate (3 Weeks)',17,1,'dg-jewellery-business'),('Diamond Graduate (3 Weeks)',17,2,'dg-settings'),('Diamond Graduate (3 Weeks)',17,3,'dg-metal-qa')
  ) as m(plan, day, part, slug)
  join public.lesson_decks d
    on d.is_active and d.course = 'Diamond Graduate' and d.storage_path like 'diamond-graduate/' || m.slug || '-v%'
on conflict do nothing;
