-- Lesson Library: access is granted per course (2026-10-22, per Sunil).
-- Until now a Library grant covered every course in the Library, so adding JBE gave it to
-- everyone automatically. Each grant now lists its courses; the HOD picks them when granting
-- and can change them later without resetting the end date.
-- Existing grants (all given 2026-10-18, before JBE was in the Library) keep DG + CSG.

alter table public.lesson_library_access
  add column if not exists courses text[] not null default '{Diamond Graduate,Colored Stone Graduate}';
alter table public.lesson_library_access alter column courses drop default;

-- Which Library course a deck belongs to (null = not in the Library). One place for the rule.
create or replace function public.lesson_ref_course(p_course text) returns text
language sql immutable as $$
  select case
    when coalesce(p_course,'') like 'Diamond Graduate%' then 'Diamond Graduate'
    when coalesce(p_course,'') like 'Colored Stone Graduate%' then 'Colored Stone Graduate'
    when coalesce(p_course,'') = 'Jewelry Business Essentials' then 'Jewelry Business Essentials'
  end
$$;
create or replace function public.lesson_in_library(p_course text) returns boolean
language sql immutable as $$ select public.lesson_ref_course(p_course) is not null $$;
create or replace function public.lesson_ref_courses_all() returns text[]
language sql immutable as $$ select array['Diamond Graduate','Colored Stone Graduate','Jewelry Business Essentials'] $$;

-- the grantee's list: only the courses on their grant (the HOD sees everything)
create or replace function public.lesson_ref_library()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb; g public.lesson_library_access; v_courses text[];
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if (c->>'approver')::boolean then v_courses := public.lesson_ref_courses_all();
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
end $$;

-- opening a reference copy re-checks the course
do $$ declare d text; begin
  d := pg_get_functiondef('public.lesson_authorize_open(text,integer,uuid,text)'::regprocedure);
  if position('lesson_ref_course' in d) = 0 then
    d := replace(d, 'if v_basis = ''reference'' and not public.lesson_in_library(d.course) then',
      'if v_basis = ''reference'' and not coalesce(public.lesson_ref_course(d.course) = any((public.lesson_library_grant_for(c->>''name'')).courses), false) then');
    if position('lesson_ref_course' in d) = 0 then raise exception 'lesson_authorize_open: anchor not found'; end if;
    execute d;
  end if;
end $$;

-- grant with courses (replaces the 3-argument version)
drop function if exists public.lesson_ref_grant(text, integer, text);
create or replace function public.lesson_ref_grant(p_person text, p_days integer, p_note text, p_courses text[])
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c jsonb; v text[];
begin
  c := public.lesson_caller();
  if c is null or not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD'); end if;
  if not exists (select 1 from public.users u where u.name = p_person and u.is_active) then
    return jsonb_build_object('status','error','reason','No such active user');
  end if;
  select array_agg(x order by x) into v from (select distinct unnest(p_courses) x) t where x = any(public.lesson_ref_courses_all());
  if v is null then return jsonb_build_object('status','error','reason','Pick at least one course'); end if;
  update public.lesson_library_access set revoked_at = now(), revoked_by = c->>'name'
   where person = p_person and revoked_at is null;
  insert into public.lesson_library_access(person, granted_by, valid_until, note, courses)
  values (p_person, c->>'name',
          case when coalesce(p_days, 0) > 0 then ((public.lesson_today() + p_days)::timestamp + time '23:59') at time zone 'Asia/Kolkata' end,
          nullif(trim(coalesce(p_note, '')), ''), v);
  return jsonb_build_object('status','ok');
end $$;

-- change the courses on an existing grant, keeping its end date
create or replace function public.lesson_ref_set_courses(p_id uuid, p_courses text[])
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c jsonb; v text[];
begin
  c := public.lesson_caller();
  if c is null or not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD'); end if;
  select array_agg(x order by x) into v from (select distinct unnest(p_courses) x) t where x = any(public.lesson_ref_courses_all());
  if v is null then return jsonb_build_object('status','error','reason','Pick at least one course, or remove the access'); end if;
  update public.lesson_library_access set courses = v where id = p_id and revoked_at is null;
  if not found then return jsonb_build_object('status','error','reason','Grant not found or already ended'); end if;
  return jsonb_build_object('status','ok');
end $$;

-- the HOD's list shows each grant's courses, and "studied N of M" counts only those courses
create or replace function public.lesson_ref_grants()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null or not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD'); end if;
  return jsonb_build_object('status','ok', 'courses', to_jsonb(public.lesson_ref_courses_all()),
    'total', (select count(distinct public.lesson_deck_key(storage_path)) from public.lesson_decks where is_active and public.lesson_in_library(course)),
    'grants', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'person', a.person, 'by', a.granted_by, 'at', a.granted_at,
        'until', a.valid_until, 'note', a.note, 'courses', to_jsonb(a.courses),
        'active', a.revoked_at is null and (a.valid_until is null or a.valid_until > now()),
        'total', (select count(distinct public.lesson_deck_key(d.storage_path)) from public.lesson_decks d
                   where d.is_active and public.lesson_ref_course(d.course) = any(a.courses)),
        'studied', (select count(*) from public.lesson_study s where s.person = a.person and s.deck_key in
                     (select public.lesson_deck_key(d.storage_path) from public.lesson_decks d
                       where d.is_active and public.lesson_ref_course(d.course) = any(a.courses))),
        'opens', (select count(*) from public.lesson_access_log l where l.opened_by = a.person and l.basis = 'reference' and l.purpose = 'open'),
        'last_open', (select max(opened_at) from public.lesson_access_log l where l.opened_by = a.person and l.basis = 'reference'))
        order by (a.revoked_at is null and (a.valid_until is null or a.valid_until > now())) desc, a.granted_at desc)
      from public.lesson_library_access a where a.revoked_at is null or a.revoked_at > now() - interval '60 days'), '[]'),
    'people', coalesce((select jsonb_agg(u.name order by u.name) from public.users u
      where u.is_active and u.role in ('Instructor','AcademicHead')), '[]'));
end $$;

-- the grantee's status carries their courses too
create or replace function public.lesson_ref_status()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb; g public.lesson_library_access;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if (c->>'approver')::boolean then return jsonb_build_object('status','ok','allowed',true,'approver',true,'courses',to_jsonb(public.lesson_ref_courses_all())); end if;
  g := public.lesson_library_grant_for(c->>'name');
  return jsonb_build_object('status','ok','allowed', g.id is not null, 'approver', false, 'until', g.valid_until, 'courses', to_jsonb(g.courses));
end $$;

revoke all on function public.lesson_ref_grant(text, integer, text, text[]) from public;
grant execute on function public.lesson_ref_grant(text, integer, text, text[]) to anon, authenticated;
revoke all on function public.lesson_ref_set_courses(uuid, text[]) from public;
grant execute on function public.lesson_ref_set_courses(uuid, text[]) to anon, authenticated;
grant execute on function public.lesson_ref_course(text) to anon, authenticated, service_role;
grant execute on function public.lesson_ref_courses_all() to anon, authenticated, service_role;
