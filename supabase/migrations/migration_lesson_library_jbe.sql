-- Lesson Library: add Jewelry Business Essentials (2026-10-22, per Sunil).
-- The Library listed only DG and CSG decks; the rule was written out in three functions.
-- One helper now decides what is in the Library. For JBE only the default plan
-- ("Jewelry Business Essentials", visit on day 3) is listed: the four "(Visit Day N)" plans
-- point at the same five files and would show as duplicates.

create or replace function public.lesson_in_library(p_course text) returns boolean
language sql immutable as $$
  select coalesce(p_course,'') like 'Diamond Graduate%'
      or coalesce(p_course,'') like 'Colored Stone Graduate%'
      or coalesce(p_course,'') = 'Jewelry Business Essentials'
$$;

do $$ declare d text; f text; old text; new text; begin
  foreach f in array array['public.lesson_ref_library()','public.lesson_authorize_open(text,integer,uuid,text)','public.lesson_ref_grants()'] loop
    d := pg_get_functiondef(f::regprocedure);
    if position('lesson_in_library' in d) > 0 then continue; end if;
    old := d;
    d := replace(d, '(d.course like ''Diamond Graduate%'' or d.course like ''Colored Stone Graduate%'')', 'public.lesson_in_library(d.course)');
    d := replace(d, '(course like ''Diamond Graduate%'' or course like ''Colored Stone Graduate%'')', 'public.lesson_in_library(course)');
    if d = old then raise exception '%: anchor not found', f; end if;
    execute d;
  end loop;
end $$;

grant execute on function public.lesson_in_library(text) to anon, authenticated, service_role;
