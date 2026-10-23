-- Gem-A Foundation day decks (2026-10-23, per Sunil).
-- Decks with course 'Gem-A Foundation' already show in the Lessons tab of that batch's
-- instructors (Seema, Deepak) through lesson_deck_course(b.course), the same way DG/CSG work.
-- This adds them to the Library as their own course, so the HOD can also grant them to anyone
-- else via Library access (tick "Gem-A Foundation"). The Orientation deck stays separate.
create or replace function public.lesson_ref_course(p_course text)
returns text language sql immutable as $function$
  select case
    when coalesce(p_course,'') like 'Diamond Graduate%' then 'Diamond Graduate'
    when coalesce(p_course,'') like 'Colored Stone Graduate%' then 'Colored Stone Graduate'
    when coalesce(p_course,'') = 'Jewelry Business Essentials' then 'Jewelry Business Essentials'
    when coalesce(p_course,'') = 'Gem-A Foundation Orientation' then 'Gem-A Foundation Orientation'
    when coalesce(p_course,'') = 'Gem-A Foundation' then 'Gem-A Foundation'
  end
$function$;

create or replace function public.lesson_ref_courses_all()
returns text[] language sql immutable as $function$
  select array['Diamond Graduate','Colored Stone Graduate','Jewelry Business Essentials','Gem-A Foundation Orientation','Gem-A Foundation']
$function$;
