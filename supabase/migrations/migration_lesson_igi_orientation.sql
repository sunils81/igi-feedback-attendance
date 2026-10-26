-- IGI Orientation deck (2026-10-26): HOD-only. The HOD takes this orientation personally, so the
-- deck (course 'IGI Orientation') is visible only to an Admin-role session (the HOD), in the
-- Library. It matches no batch course, so it never appears in a Lessons tab; it is NOT in
-- lesson_ref_courses_all(), so it cannot be granted to anyone through Library access, and the
-- backup approver (lesson_approvers) does not see it either.
create or replace function public.lesson_is_hod(c jsonb)
returns boolean language sql immutable as $f$ select coalesce(c->>'role','') = 'Admin' $f$;

create or replace function public.lesson_ref_course(p_course text)
returns text language sql immutable as $function$
  select case
    when coalesce(p_course,'') like 'Diamond Graduate%' then 'Diamond Graduate'
    when coalesce(p_course,'') like 'Colored Stone Graduate%' then 'Colored Stone Graduate'
    when coalesce(p_course,'') = 'Jewelry Business Essentials' then 'Jewelry Business Essentials'
    when coalesce(p_course,'') = 'Gem-A Foundation Orientation' then 'Gem-A Foundation Orientation'
    when coalesce(p_course,'') = 'Gem-A Foundation' then 'Gem-A Foundation'
    when coalesce(p_course,'') = 'IGI Orientation' then 'IGI Orientation'
  end
$function$;

create or replace function public.lesson_ref_library()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare c jsonb; g public.lesson_library_access; v_courses text[];
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if (c->>'approver')::boolean then
    v_courses := public.lesson_ref_courses_all();
    if public.lesson_is_hod(c) then v_courses := v_courses || array['IGI Orientation']; end if;
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
    'courses',to_jsonb(public.lesson_ref_courses_all() || case when public.lesson_is_hod(c) then array['IGI Orientation'] else array[]::text[] end)); end if;
  g := public.lesson_library_grant_for(c->>'name');
  return jsonb_build_object('status','ok','allowed', g.id is not null, 'approver', false, 'until', g.valid_until, 'courses', to_jsonb(g.courses));
end $function$;

create or replace function public.lesson_authorize_open(p_batch_code text, p_day integer, p_deck_id uuid default null::uuid, p_purpose text default 'open'::text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare c jsonb; b public.batches; st jsonb; v_basis text; d public.lesson_decks;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;

  if p_batch_code is null or p_batch_code = '' then
    if (c->>'approver')::boolean then v_basis := 'hod';
    elsif (public.lesson_library_grant_for(c->>'name')).id is not null then v_basis := 'reference';
    else return jsonb_build_object('status','error','reason','Ask the HOD for Library access');
    end if;
    select * into d from public.lesson_decks where id = p_deck_id and is_active;
    if d.id is null then return jsonb_build_object('status','error','reason','Deck not found'); end if;
    -- HOD-only decks
    if d.course = 'IGI Orientation' and not public.lesson_is_hod(c) then
      return jsonb_build_object('status','error','reason','Only the HOD can open this presentation');
    end if;
    if v_basis = 'reference' and not coalesce(public.lesson_ref_course(d.course) = any((public.lesson_library_grant_for(c->>'name')).courses), false) then
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

create or replace function public.lesson_library()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null or not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD'); end if;
  return jsonb_build_object('status','ok','rows', coalesce((select jsonb_agg(jsonb_build_object(
    'id', d.id, 'course', d.course, 'day', d.syllabus_day, 'part', d.part, 'title', d.title, 'version', d.version,
    'slides', d.slide_count, 'bytes', d.bytes, 'updated_at', d.updated_at,
    'opens_30d', (select count(*) from public.lesson_access_log l where l.deck_id = d.id and l.purpose = 'open' and l.opened_at > now() - interval '30 days'))
    order by d.course, d.syllabus_day, d.part) from public.lesson_decks d
    where d.is_active and (d.course <> 'IGI Orientation' or public.lesson_is_hod(c))), '[]'));
end $function$;
