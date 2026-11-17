-- IGI Team Training (2026-11-17, per Sunil): "Diamonds 101", two 2-hour internal sessions for new
-- colleagues from marketing and other teams (the rough, the 4Cs, reading an IGI report), taken by
-- the HOD. Decks have course 'IGI Team Training' (day 1 = Part 1, day 2 = Part 2). They match no
-- batch course, so they never appear in a Lessons tab.
--   * The HOD (Admin session) sees them in the admin Library.
--   * Anyone else sees them only if the HOD ticks "IGI Team Training" on their Library access
--     (per person, per period). The backup approver does NOT get them automatically.
--   * The films the decks play are already open to instructors, Admin and Library-grant holders.

create or replace function public.lesson_ref_course(p_course text)
returns text language sql immutable as $function$
  select case
    when coalesce(p_course,'') like 'Diamond Graduate%' then 'Diamond Graduate'
    when coalesce(p_course,'') like 'Colored Stone Graduate%' then 'Colored Stone Graduate'
    when coalesce(p_course,'') = 'Jewelry Business Essentials' then 'Jewelry Business Essentials'
    when coalesce(p_course,'') = 'Gem-A Foundation Orientation' then 'Gem-A Foundation Orientation'
    when coalesce(p_course,'') = 'Gem-A Foundation' then 'Gem-A Foundation'
    when coalesce(p_course,'') = 'IGI Orientation' then 'IGI Orientation'
    when coalesce(p_course,'') = 'Retail Technical Training' then 'Retail Technical Training'
    when coalesce(p_course,'') = 'IGI Team Training' then 'IGI Team Training'
  end
$function$;

-- grantable courses (the HOD's tick boxes); Team Training is grantable
create or replace function public.lesson_ref_courses_all()
returns text[] language sql immutable as $function$
  select array['Diamond Graduate','Colored Stone Graduate','Jewelry Business Essentials','Gem-A Foundation Orientation','Gem-A Foundation','Retail Technical Training','IGI Team Training']
$function$;

-- may this caller see Team Training? the HOD, or someone whose live grant includes it
create or replace function public.lesson_team_ok(c jsonb)
returns boolean language sql stable security definer set search_path to 'public' as $function$
  select c is not null and (public.lesson_is_hod(c)
    or coalesce('IGI Team Training' = any((public.lesson_library_grant_for(c->>'name')).courses), false))
$function$;
revoke all on function public.lesson_team_ok(jsonb) from public, anon, authenticated;

-- the courses an approver sees: everything grantable, minus Team Training unless allowed, plus IGI Orientation for the HOD
create or replace function public.lesson_ref_courses_for_approver(c jsonb)
returns text[] language sql stable security definer set search_path to 'public' as $function$
  select (case when public.lesson_team_ok(c) then public.lesson_ref_courses_all()
               else array_remove(public.lesson_ref_courses_all(), 'IGI Team Training') end)
         || case when public.lesson_is_hod(c) then array['IGI Orientation'] else array[]::text[] end
$function$;
revoke all on function public.lesson_ref_courses_for_approver(jsonb) from public, anon, authenticated;

create or replace function public.lesson_ref_library()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare c jsonb; g public.lesson_library_access; v_courses text[];
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if (c->>'approver')::boolean then
    v_courses := public.lesson_ref_courses_for_approver(c);
  else
    g := public.lesson_library_grant_for(c->>'name');
    if g.id is null then return jsonb_build_object('status','error','reason','Ask the HOD for Library access'); end if;
    v_courses := g.courses;
  end if;
  return jsonb_build_object('status','ok', 'me', c->>'name', 'approver', (c->>'approver')::boolean, 'until', g.valid_until,
    'courses', to_jsonb(v_courses),
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
      'id', d.id, 'course', d.course, 'day', d.syllabus_day, 'part', d.part, 'title', d.title, 'subtitle', d.subtitle,
      'version', d.version, 'slides', d.slide_count, 'bytes', d.bytes, 'key', public.lesson_deck_key(d.storage_path),
      'studied', exists (select 1 from public.lesson_study s where s.person = c->>'name' and s.deck_key = public.lesson_deck_key(d.storage_path)))
      order by d.course, d.syllabus_day, d.part)
      from public.lesson_decks d where d.is_active and public.lesson_ref_course(d.course) = any(v_courses)), '[]'));
end $function$;

create or replace function public.lesson_ref_status()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare c jsonb; g public.lesson_library_access;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if (c->>'approver')::boolean then return jsonb_build_object('status','ok','allowed',true,'approver',true,
    'courses',to_jsonb(public.lesson_ref_courses_for_approver(c))); end if;
  g := public.lesson_library_grant_for(c->>'name');
  return jsonb_build_object('status','ok','allowed', g.id is not null, 'approver', false, 'until', g.valid_until, 'courses', to_jsonb(g.courses));
end $function$;

-- opening: a Team Training deck needs the HOD or a grant that includes it, even for the backup approver
do $$ declare d text; begin
  d := pg_get_functiondef('public.lesson_authorize_open(text,integer,uuid,text)'::regprocedure);
  if position('lesson_team_ok' in d) = 0 then
    d := replace(d,
      'if v_basis = ''reference'' and not coalesce(',
      'if d.course = ''IGI Team Training'' and not public.lesson_team_ok(c) then
      return jsonb_build_object(''status'',''error'',''reason'',''Ask the HOD for IGI Team Training access'');
    end if;
    if v_basis = ''reference'' and not coalesce(');
    if position('lesson_team_ok' in d) = 0 then raise exception 'lesson_authorize_open: anchor not found'; end if;
    execute d;
  end if;
end $$;
