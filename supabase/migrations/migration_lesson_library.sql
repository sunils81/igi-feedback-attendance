-- Lesson Library (2026-10-18, per Sunil): every DG and CSG deck in one tab for reference,
-- for tutors and new joiners. Access is granted per person by the HOD (Admin or a name in
-- lesson_approvers), optionally for a fixed period. Reference openings are logged with
-- basis 'reference' and never touch a batch's day lock. People can mark decks "Studied".

create table if not exists public.lesson_library_access (
  id uuid primary key default gen_random_uuid(),
  person text not null,
  granted_by text not null,
  granted_at timestamptz not null default now(),
  valid_until timestamptz,
  note text,
  revoked_at timestamptz,
  revoked_by text
);
create index if not exists lesson_library_access_person on public.lesson_library_access (person);
alter table public.lesson_library_access enable row level security;

create table if not exists public.lesson_study (
  person text not null,
  deck_key text not null,            -- deck slug without version, e.g. csg-corundum
  studied_at timestamptz not null default now(),
  primary key (person, deck_key)
);
alter table public.lesson_study enable row level security;

create or replace function public.lesson_deck_key(p_path text)
returns text language sql immutable as $$
  select regexp_replace(coalesce(p_path, ''), '^.*/(.*)-v[0-9]+\.html$', '\1')
$$;

-- active grant for a person (null if none)
create or replace function public.lesson_library_grant_for(p_name text)
returns public.lesson_library_access language sql stable security definer set search_path to 'public' as $$
  select * from public.lesson_library_access a
   where a.person = p_name and a.revoked_at is null and (a.valid_until is null or a.valid_until > now())
   order by a.valid_until desc nulls first limit 1
$$;

-- who am I for the library: { allowed, approver, until }
create or replace function public.lesson_ref_status()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb; g public.lesson_library_access;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if (c->>'approver')::boolean then return jsonb_build_object('status','ok','allowed',true,'approver',true); end if;
  g := public.lesson_library_grant_for(c->>'name');
  return jsonb_build_object('status','ok','allowed', g.id is not null, 'approver', false, 'until', g.valid_until);
end $$;

-- all active DG and CSG decks, per syllabus plan, with my "studied" marks
create or replace function public.lesson_ref_library()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb; g public.lesson_library_access;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not (c->>'approver')::boolean then
    g := public.lesson_library_grant_for(c->>'name');
    if g.id is null then return jsonb_build_object('status','error','reason','Ask the HOD for Library access'); end if;
  end if;
  return jsonb_build_object('status','ok', 'me', c->>'name', 'approver', (c->>'approver')::boolean, 'until', g.valid_until,
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
      'id', d.id, 'course', d.course, 'day', d.syllabus_day, 'part', d.part, 'title', d.title, 'subtitle', d.subtitle,
      'version', d.version, 'slides', d.slide_count, 'bytes', d.bytes, 'key', public.lesson_deck_key(d.storage_path),
      'studied', exists (select 1 from public.lesson_study s where s.person = c->>'name' and s.deck_key = public.lesson_deck_key(d.storage_path)))
      order by d.course, d.syllabus_day, d.part)
      from public.lesson_decks d where d.is_active and (d.course like 'Diamond Graduate%' or d.course like 'Colored Stone Graduate%')), '[]'));
end $$;

create or replace function public.lesson_ref_mark(p_key text, p_done boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not (c->>'approver')::boolean and (public.lesson_library_grant_for(c->>'name')).id is null then
    return jsonb_build_object('status','error','reason','No Library access');
  end if;
  if p_done then
    insert into public.lesson_study(person, deck_key) values (c->>'name', p_key) on conflict do nothing;
  else
    delete from public.lesson_study where person = c->>'name' and deck_key = p_key;
  end if;
  return jsonb_build_object('status','ok');
end $$;

-- HOD: list grants with study progress, and the people who could be given access
create or replace function public.lesson_ref_grants()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb; v_total int;
begin
  c := public.lesson_caller();
  if c is null or not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD'); end if;
  select count(distinct public.lesson_deck_key(storage_path)) into v_total from public.lesson_decks
   where is_active and (course like 'Diamond Graduate%' or course like 'Colored Stone Graduate%');
  return jsonb_build_object('status','ok', 'total', v_total,
    'grants', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'person', a.person, 'by', a.granted_by, 'at', a.granted_at,
        'until', a.valid_until, 'note', a.note,
        'active', a.revoked_at is null and (a.valid_until is null or a.valid_until > now()),
        'studied', (select count(*) from public.lesson_study s where s.person = a.person),
        'opens', (select count(*) from public.lesson_access_log l where l.opened_by = a.person and l.basis = 'reference' and l.purpose = 'open'),
        'last_open', (select max(opened_at) from public.lesson_access_log l where l.opened_by = a.person and l.basis = 'reference'))
        order by (a.revoked_at is null and (a.valid_until is null or a.valid_until > now())) desc, a.granted_at desc)
      from public.lesson_library_access a where a.revoked_at is null or a.revoked_at > now() - interval '60 days'), '[]'),
    'people', coalesce((select jsonb_agg(u.name order by u.name) from public.users u
      where u.is_active and u.role in ('Instructor','AcademicHead')), '[]'));
end $$;

create or replace function public.lesson_ref_grant(p_person text, p_days integer, p_note text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null or not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD'); end if;
  if not exists (select 1 from public.users u where u.name = p_person and u.is_active) then
    return jsonb_build_object('status','error','reason','No such active user');
  end if;
  update public.lesson_library_access set revoked_at = now(), revoked_by = c->>'name'
   where person = p_person and revoked_at is null;
  insert into public.lesson_library_access(person, granted_by, valid_until, note)
  values (p_person, c->>'name',
          case when coalesce(p_days, 0) > 0 then ((public.lesson_today() + p_days)::timestamp + time '23:59') at time zone 'Asia/Kolkata' end,
          nullif(trim(coalesce(p_note, '')), ''));
  return jsonb_build_object('status','ok');
end $$;

create or replace function public.lesson_ref_revoke(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null or not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD'); end if;
  update public.lesson_library_access set revoked_at = now(), revoked_by = c->>'name' where id = p_id and revoked_at is null;
  return jsonb_build_object('status','ok');
end $$;

-- Opening with no batch: the HOD as before, or anyone holding Library access (basis 'reference').
create or replace function public.lesson_authorize_open(p_batch_code text, p_day integer, p_deck_id uuid default null::uuid, p_purpose text default 'open'::text)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare c jsonb; b public.batches; st jsonb; v_basis text; d public.lesson_decks;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;

  -- HOD preview or Library reference, with no batch
  if p_batch_code is null or p_batch_code = '' then
    if (c->>'approver')::boolean then v_basis := 'hod';
    elsif (public.lesson_library_grant_for(c->>'name')).id is not null then v_basis := 'reference';
    else return jsonb_build_object('status','error','reason','Ask the HOD for Library access');
    end if;
    select * into d from public.lesson_decks where id = p_deck_id and is_active;
    if d.id is null then return jsonb_build_object('status','error','reason','Deck not found'); end if;
    if v_basis = 'reference' and not (d.course like 'Diamond Graduate%' or d.course like 'Colored Stone Graduate%') then
      return jsonb_build_object('status','error','reason','Not in the Library');
    end if;
    insert into public.lesson_access_log(batch_code, syllabus_day, deck_id, deck_version, opened_by, basis, purpose)
    values (null, d.syllabus_day, d.id, d.version, c->>'name', v_basis, coalesce(p_purpose,'open'));
    return jsonb_build_object('status','ok','basis',v_basis,'deck', jsonb_build_object('id', d.id, 'path', d.storage_path, 'version', d.version, 'title', d.title, 'day', d.syllabus_day));
  end if;

  select * into b from public.batches where batch_code = p_batch_code;
  if b.batch_code is null then return jsonb_build_object('status','error','reason','No such batch'); end if;
  if not (c->>'approver')::boolean and not public.lesson_can_access_batch(c->>'name', b) then
    return jsonb_build_object('status','error','reason','This batch is not assigned to you');
  end if;
  st := public.lesson_day_state(p_batch_code);
  v_basis := public.lesson_open_basis(st, p_day, (c->>'approver')::boolean);
  if v_basis is null then
    return jsonb_build_object('status','locked','reason','This day is locked. Request access from the HOD.');
  end if;
  select * into d from public.lesson_decks
   where is_active and course = st->>'deck_course' and syllabus_day = p_day
     and (p_deck_id is null or id = p_deck_id) order by part limit 1;
  if d.id is null then return jsonb_build_object('status','error','reason','No presentation for this day yet'); end if;
  insert into public.lesson_access_log(batch_code, syllabus_day, deck_id, deck_version, opened_by, basis, purpose)
  values (p_batch_code, p_day, d.id, d.version, c->>'name', v_basis, coalesce(p_purpose,'open'));
  return jsonb_build_object('status','ok','basis', v_basis,
    'deck', jsonb_build_object('id', d.id, 'path', d.storage_path, 'version', d.version, 'title', d.title, 'day', d.syllabus_day));
end $function$;

revoke all on function public.lesson_authorize_open(text, integer, uuid, text) from public, anon, authenticated;
grant execute on function public.lesson_authorize_open(text, integer, uuid, text) to service_role;
revoke all on function public.lesson_library_grant_for(text) from public, anon, authenticated;
grant execute on function public.lesson_ref_status() to anon, authenticated;
grant execute on function public.lesson_ref_library() to anon, authenticated;
grant execute on function public.lesson_ref_mark(text, boolean) to anon, authenticated;
grant execute on function public.lesson_ref_grants() to anon, authenticated;
grant execute on function public.lesson_ref_grant(text, integer, text) to anon, authenticated;
grant execute on function public.lesson_ref_revoke(uuid) to anon, authenticated;
