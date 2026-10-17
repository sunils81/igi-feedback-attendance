alter table public.lesson_decks add column if not exists part integer not null default 1;

drop index if exists public.lesson_decks_course_day_active;

create unique index if not exists lesson_decks_course_day_part_active on public.lesson_decks(course, syllabus_day, part) where is_active;

create or replace function public.lesson_batch_plan(p_batch_code text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c jsonb; b public.batches; st jsonb;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  select * into b from public.batches where batch_code = p_batch_code;
  if b.batch_code is null then return jsonb_build_object('status','error','reason','No such batch'); end if;
  if not (c->>'approver')::boolean and not public.lesson_can_access_batch(c->>'name', b) then
    return jsonb_build_object('status','error','reason','This batch is not assigned to you');
  end if;
  st := public.lesson_day_state(p_batch_code);
  return jsonb_build_object('status','ok', 'me', c, 'state', st,
    'decks', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'day', d.syllabus_day, 'part', d.part, 'title', d.title,
                         'subtitle', d.subtitle, 'version', d.version, 'slides', d.slide_count, 'bytes', d.bytes) order by d.syllabus_day, d.part)
                        from public.lesson_decks d where d.is_active and d.course = st->>'deck_course'), '[]'));
end $$;

create or replace function public.lesson_list_requests(p_scope text default 'pending') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD can review lesson requests'); end if;
  return jsonb_build_object('status','ok', 'me', c, 'rows', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id, 'batch_code', r.batch_code, 'course', r.course, 'day', r.syllabus_day,
      'requested_by', r.requested_by, 'reason', r.reason, 'status', r.status,
      'decided_by', r.decided_by, 'decision_note', r.decision_note, 'decided_at', r.decided_at,
      'valid_until', r.valid_until, 'created_at', r.created_at,
      'centre', b.centre,
      'deck_title', (select string_agg(d.title, ' + ' order by d.part) from public.lesson_decks d where d.is_active and d.course = public.lesson_deck_course(r.course) and d.syllabus_day = r.syllabus_day),
      'covered_upto', (select max(coalesce(s.syllabus_day_to::int, s.syllabus_day)) from public.sessions s
                        where s.batch_code = r.batch_code and s.syllabus_day is not null
                          and not coalesce(s.is_cancelled,false) and coalesce(s.session_type,'') <> 'Cancelled'
                          and s.session_date <= public.lesson_today()))
      order by (r.status = 'pending') desc, r.created_at desc)
    from public.lesson_unlock_requests r join public.batches b on b.batch_code = r.batch_code
    where (p_scope = 'pending' and r.status = 'pending')
       or (p_scope = 'all' and (r.status = 'pending' or r.created_at > now() - interval '45 days'))), '[]'));
end $$;

create or replace function public.lesson_authorize_open(p_batch_code text, p_day integer, p_deck_id uuid default null, p_purpose text default 'open') returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare c jsonb; b public.batches; st jsonb; v_basis text; d public.lesson_decks;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;

  -- HOD previewing a deck from the library, with no batch
  if p_batch_code is null or p_batch_code = '' then
    if not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Pick a batch first'); end if;
    select * into d from public.lesson_decks where id = p_deck_id and is_active;
    if d.id is null then return jsonb_build_object('status','error','reason','Deck not found'); end if;
    insert into public.lesson_access_log(batch_code, syllabus_day, deck_id, deck_version, opened_by, basis, purpose)
    values (null, d.syllabus_day, d.id, d.version, c->>'name', 'hod', coalesce(p_purpose,'open'));
    return jsonb_build_object('status','ok','basis','hod','deck', jsonb_build_object('id', d.id, 'path', d.storage_path, 'version', d.version, 'title', d.title, 'day', d.syllabus_day));
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
end $$;

create or replace function public.lesson_library() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null or not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD'); end if;
  return jsonb_build_object('status','ok','rows', coalesce((select jsonb_agg(jsonb_build_object(
    'id', d.id, 'course', d.course, 'day', d.syllabus_day, 'part', d.part, 'title', d.title, 'version', d.version,
    'slides', d.slide_count, 'bytes', d.bytes, 'updated_at', d.updated_at,
    'opens_30d', (select count(*) from public.lesson_access_log l where l.deck_id = d.id and l.purpose = 'open' and l.opened_at > now() - interval '30 days'))
    order by d.course, d.syllabus_day, d.part) from public.lesson_decks d where d.is_active), '[]'));
end $$;
