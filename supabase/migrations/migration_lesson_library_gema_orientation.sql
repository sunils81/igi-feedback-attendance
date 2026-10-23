-- Gem-A Foundation Orientation deck: Library-only course key.
-- The deck's course ('Gem-A Foundation Orientation') matches no batch course, so it never
-- appears in an instructor's Lessons tab; it is visible in the Library to the HOD and to
-- anyone whose Library access grant includes this course.
create or replace function public.lesson_ref_course(p_course text)
returns text language sql immutable as $function$
  select case
    when coalesce(p_course,'') like 'Diamond Graduate%' then 'Diamond Graduate'
    when coalesce(p_course,'') like 'Colored Stone Graduate%' then 'Colored Stone Graduate'
    when coalesce(p_course,'') = 'Jewelry Business Essentials' then 'Jewelry Business Essentials'
    when coalesce(p_course,'') = 'Gem-A Foundation Orientation' then 'Gem-A Foundation Orientation'
  end
$function$;

create or replace function public.lesson_ref_courses_all()
returns text[] language sql immutable as $function$
  select array['Diamond Graduate','Colored Stone Graduate','Jewelry Business Essentials','Gem-A Foundation Orientation']
$function$;
