-- Lesson Decks: each syllabus day's lecture as an animated HTML deck, opened day-wise
-- from the instructor portal. 2026-10-15, per Sunil:
--   "everyday presentation be converted into beautiful animated HTML and it should open
--    day wise, and if anyone want to change the order or open other day ppt html then it
--    should request the HOD for the same for reason"
--
-- Rules (agreed with Sunil 2026-10-15):
--   * Open without asking: days the batch has already covered (recap), the batch's next
--     syllabus day(s) while the batch is running, and whatever today's session recorded.
--   * Anything else (a future day, teaching out of order) needs a request with a reason.
--     The HOD (Admin) approves, with Bhavin Patel as backup approver (lesson_approvers).
--     An approval lasts until the end of the IST day it was given, unless the approver
--     picks a longer window.
--   * Smart Learning / free-topic courses (DG Integrated, Coloured Stone Integrated, SDA,
--     iRES) are outside the day lock: every deck of the parent course is open.
--   * Students never get access. Nothing here is granted to the student portal and the
--     deck files live in a PRIVATE bucket.
--
-- Identity comes from the portal session token (X-Portal-Session header -> app_session()),
-- never from a name the browser sends. Tables are closed to anon; every read and write
-- goes through the SECURITY DEFINER functions below.
--
-- Opening a deck: the browser calls /api/push/lesson-open, which calls
-- lesson_authorize_open() with the service key while forwarding the caller's session
-- header, then signs a 5-minute URL for the deck file. lesson_authorize_open is granted
-- to service_role only, so a storage path is never handed out without the check.

create table if not exists public.lesson_decks (
  id            uuid primary key default gen_random_uuid(),
  course        text not null,              -- syllabus course name, e.g. 'Diamond Graduate'
  syllabus_day  integer not null,
  title         text not null,
  subtitle      text default '',
  storage_path  text not null,              -- object path inside the lesson-decks bucket
  version       integer not null default 1,
  slide_count   integer,
  bytes         bigint,
  is_active     boolean not null default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
-- A syllabus day can carry more than one deck (part 1, 2, …), e.g. Day 3 = Origin of Rough +
-- Rough Trading. Added 2026-10-17.
alter table public.lesson_decks add column if not exists part integer not null default 1;
drop index if exists public.lesson_decks_course_day_active;
create unique index if not exists lesson_decks_course_day_part_active
  on public.lesson_decks(course, syllabus_day, part) where is_active;

create table if not exists public.lesson_approvers (
  name text primary key                      -- users.name of a backup approver (Admin role always approves)
);
insert into public.lesson_approvers(name) values ('Bhavin Patel') on conflict do nothing;

create table if not exists public.lesson_unlock_requests (
  id             uuid primary key default gen_random_uuid(),
  batch_code     text not null references public.batches(batch_code),
  course         text not null,
  syllabus_day   integer not null,
  requested_by   text not null,
  reason         text not null,
  status         text not null default 'pending'
                   check (status in ('pending','approved','rejected','cancelled')),
  decided_by     text,
  decision_note  text,
  decided_at     timestamptz,
  valid_until    timestamptz,
  created_at     timestamptz default now()
);
create index if not exists lesson_unlock_requests_batch on public.lesson_unlock_requests(batch_code, syllabus_day);
create index if not exists lesson_unlock_requests_pending on public.lesson_unlock_requests(status) where status = 'pending';
create unique index if not exists lesson_unlock_requests_one_pending
  on public.lesson_unlock_requests(batch_code, syllabus_day) where status = 'pending';

create table if not exists public.lesson_access_log (
  id            bigserial primary key,
  batch_code    text,
  syllabus_day  integer,
  deck_id       uuid,
  deck_version  integer,
  opened_by     text,
  basis         text,       -- covered | today | approved | free | hod
  purpose       text,       -- open | prefetch
  opened_at     timestamptz default now()
);
create index if not exists lesson_access_log_batch on public.lesson_access_log(batch_code, opened_at desc);

alter table public.lesson_decks           enable row level security;
alter table public.lesson_approvers       enable row level security;
alter table public.lesson_unlock_requests enable row level security;
alter table public.lesson_access_log      enable row level security;
revoke all on public.lesson_decks, public.lesson_approvers, public.lesson_unlock_requests, public.lesson_access_log from anon, authenticated;
grant select on public.lesson_decks, public.lesson_approvers, public.lesson_unlock_requests, public.lesson_access_log to service_role;

-- ── helpers ─────────────────────────────────────────────────────────────────────────
create or replace function public.lesson_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Kolkata')::date $$;

-- Free-topic (Smart Learning) courses borrow the decks of their parent course.
create or replace function public.lesson_deck_course(p_course text) returns text
language sql immutable as $$
  select case lower(trim(coalesce(p_course,'')))
    when 'diamond graduate integrated' then 'Diamond Graduate'
    when 'coloured stone integrated'   then 'Colored Stone Graduate'
    when 'colored stone integrated'    then 'Colored Stone Graduate'
    when 'jewelpad on-campus'          then 'JewelPad Design'
    when 'jewelpad online'             then 'JewelPad Design'
    when 'jewelpad design'             then 'JewelPad Design'
    else trim(coalesce(p_course,'')) end
$$;

create or replace function public.lesson_is_free_course(p_course text) returns boolean
language sql immutable as $$
  select lower(trim(coalesce(p_course,''))) in
    ('diamond graduate integrated','coloured stone integrated','colored stone integrated',
     'small diamond assortment','identification of res')
$$;

-- Mirrors syllabusDaysPerSession() in shared.js.
create or replace function public.lesson_pace(b public.batches) returns integer
language sql immutable as $$
  select case
    when coalesce(b.syllabus_days_per_session,0) >= 1 then b.syllabus_days_per_session::int
    when lower(trim(coalesce(b.type,''))) = 'full day'
     and lower(trim(coalesce(b.course,''))) in ('diamond graduate','colored stone graduate','coloured stone graduate') then 2
    else 1 end
$$;

-- The caller: {name, role, approver} from the session token, or null.
create or replace function public.lesson_caller() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s public.auth_sessions; v_role text;
begin
  s := public.app_session();
  if s.token is null then return null; end if;
  select u.role into v_role from public.users u where u.name = s.user_name limit 1;
  v_role := coalesce(v_role, s.role);
  return jsonb_build_object(
    'name', s.user_name,
    'role', v_role,
    'approver', (coalesce(s.role,'') = 'Admin' or coalesce(v_role,'') = 'Admin'
                 or exists (select 1 from public.lesson_approvers a where a.name = s.user_name)));
end $$;

-- Can this person teach/see this batch's lessons?
create or replace function public.lesson_can_access_batch(p_name text, b public.batches) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(b.instructor,'') = p_name
      or (coalesce(b.co_instructor,'') = p_name
          and (b.co_instructor_from is null or b.co_instructor_from <= public.lesson_today())
          and (b.co_instructor_until is null or b.co_instructor_until >= public.lesson_today()))
      or exists (select 1 from public.sessions s
                  where s.batch_code = b.batch_code and s.instructor = p_name
                    and s.session_date between public.lesson_today() - 1 and public.lesson_today() + 1)
$$;

-- Day-state for one batch: covered days, the days open as "today", approvals, pending.
create or replace function public.lesson_day_state(p_batch_code text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  b public.batches; v_today date := public.lesson_today(); v_pace int;
  v_covered int[]; v_before int[]; v_todays int[]; v_next int[] := '{}';
  g int; d int; v_running boolean; v_any_uncovered boolean;
begin
  select * into b from public.batches where batch_code = p_batch_code;
  if b.batch_code is null then return null; end if;
  v_pace := public.lesson_pace(b);

  -- every day recorded by a non-cancelled session up to and including today
  select coalesce(array_agg(distinct x order by x), '{}') into v_covered from (
    select generate_series(s.syllabus_day, coalesce(s.syllabus_day_to::int, s.syllabus_day)) x
      from public.sessions s
     where s.batch_code = p_batch_code and s.syllabus_day is not null
       and s.session_date <= v_today
       and not coalesce(s.is_cancelled,false) and coalesce(s.session_type,'') <> 'Cancelled') t;
  -- the same, before today: decides the batch's "next" day
  select coalesce(array_agg(distinct x order by x), '{}') into v_before from (
    select generate_series(s.syllabus_day, coalesce(s.syllabus_day_to::int, s.syllabus_day)) x
      from public.sessions s
     where s.batch_code = p_batch_code and s.syllabus_day is not null
       and s.session_date < v_today
       and not coalesce(s.is_cancelled,false) and coalesce(s.session_type,'') <> 'Cancelled') t;
  -- what today's session recorded, if anything
  select coalesce(array_agg(distinct x order by x), '{}') into v_todays from (
    select generate_series(s.syllabus_day, coalesce(s.syllabus_day_to::int, s.syllabus_day)) x
      from public.sessions s
     where s.batch_code = p_batch_code and s.syllabus_day is not null
       and s.session_date = v_today
       and not coalesce(s.is_cancelled,false) and coalesce(s.session_type,'') <> 'Cancelled') t;

  v_running := coalesce(b.is_active, true)
               and (b.start_date is null or b.start_date <= v_today)
               and (b.end_date is null or b.end_date >= v_today);

  -- "Next" is two groups, because real batches skip days (a factory visit recorded as a
  -- custom topic leaves its syllabus day untaught for good):
  --   1. the lowest paced group with any day not yet taught (mirrors computeSyllabusProgress),
  --   2. the group straight after the furthest day taught — where the batch actually is.
  -- KOL-DG-OCT26 on 2026-10-15 had days 1-5 and 7-9 taught: rule 1 alone would have
  -- offered only day 6 and locked day 10, the day the class was really on.
  if v_running then
    g := 1;
    while g <= 400 loop
      v_any_uncovered := false;
      for d in g .. g + v_pace - 1 loop
        if not (d = any(v_before)) then v_any_uncovered := true; end if;
      end loop;
      if v_any_uncovered then
        select array_agg(x) into v_next from generate_series(g, g + v_pace - 1) x;
        exit;
      end if;
      g := g + v_pace;
    end loop;
    if coalesce(array_length(v_before,1),0) > 0 then
      g := (v_before[array_length(v_before,1)] / v_pace) * v_pace + 1;
      select array_agg(distinct x order by x) into v_next
        from (select unnest(coalesce(v_next,'{}')) x union select generate_series(g, g + v_pace - 1)) q;
    end if;
  end if;

  return jsonb_build_object(
    'batch_code', b.batch_code, 'course', b.course, 'centre', b.centre,
    'deck_course', public.lesson_deck_course(b.course),
    'mode', case when public.lesson_is_free_course(b.course) then 'free' else 'day' end,
    'running', v_running, 'pace', v_pace, 'today', v_today,
    'covered', to_jsonb(v_covered), 'todays', to_jsonb(v_todays), 'next', to_jsonb(coalesce(v_next,'{}')),
    'approved', coalesce((select jsonb_agg(jsonb_build_object('day', r.syllabus_day, 'until', r.valid_until, 'by', r.decided_by))
                            from public.lesson_unlock_requests r
                           where r.batch_code = p_batch_code and r.status = 'approved' and r.valid_until > now()), '[]'),
    'pending', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'day', r.syllabus_day, 'at', r.created_at, 'by', r.requested_by, 'reason', r.reason))
                           from public.lesson_unlock_requests r
                          where r.batch_code = p_batch_code and r.status = 'pending'), '[]'),
    'recent', coalesce((select jsonb_agg(x order by (x->>'at') desc) from (
                          select jsonb_build_object('id', r.id, 'day', r.syllabus_day, 'status', r.status,
                                   'note', r.decision_note, 'by', r.decided_by, 'at', coalesce(r.decided_at, r.created_at),
                                   'until', r.valid_until, 'reason', r.reason, 'requested_by', r.requested_by) x
                            from public.lesson_unlock_requests r
                           where r.batch_code = p_batch_code and r.status in ('approved','rejected')
                           order by coalesce(r.decided_at, r.created_at) desc limit 10) q), '[]')
  );
end $$;

-- Why may this person open this day? Returns the basis, or null when locked.
create or replace function public.lesson_open_basis(p_state jsonb, p_day integer, p_approver boolean) returns text
language sql immutable as $$
  select case
    when p_approver then 'hod'
    when p_state->>'mode' = 'free' then 'free'
    when p_state->'covered' @> to_jsonb(p_day) then 'covered'
    when p_state->'todays'  @> to_jsonb(p_day) then 'today'
    when p_state->'next'    @> to_jsonb(p_day) then 'today'
    when exists (select 1 from jsonb_array_elements(p_state->'approved') a where (a->>'day')::int = p_day) then 'approved'
    else null end
$$;

-- ── what the Lessons tab shows ───────────────────────────────────────────────────────
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

-- ── request / cancel ─────────────────────────────────────────────────────────────────
create or replace function public.lesson_request_unlock(p_batch_code text, p_day integer, p_reason text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare c jsonb; b public.batches; st jsonb; v_id uuid;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  select * into b from public.batches where batch_code = p_batch_code;
  if b.batch_code is null then return jsonb_build_object('status','error','reason','No such batch'); end if;
  if not public.lesson_can_access_batch(c->>'name', b) and not (c->>'approver')::boolean then
    return jsonb_build_object('status','error','reason','This batch is not assigned to you');
  end if;
  if length(trim(coalesce(p_reason,''))) < 10 then
    return jsonb_build_object('status','error','reason','Please give a reason (at least a short sentence).');
  end if;
  st := public.lesson_day_state(p_batch_code);
  if public.lesson_open_basis(st, p_day, false) is not null then
    return jsonb_build_object('status','error','reason','This day is already open for you.');
  end if;
  if exists (select 1 from public.lesson_unlock_requests where batch_code = p_batch_code and syllabus_day = p_day and status = 'pending') then
    return jsonb_build_object('status','error','reason','A request for this day is already waiting for the HOD.');
  end if;
  insert into public.lesson_unlock_requests(batch_code, course, syllabus_day, requested_by, reason)
  values (p_batch_code, b.course, p_day, c->>'name', left(trim(p_reason), 1000))
  returning id into v_id;
  return jsonb_build_object('status','ok','id', v_id);
end $$;

create or replace function public.lesson_cancel_request(p_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare c jsonb; n int;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  update public.lesson_unlock_requests set status = 'cancelled', decided_at = now(), decided_by = c->>'name'
   where id = p_id and status = 'pending' and requested_by = c->>'name';
  get diagnostics n = row_count;
  return case when n = 1 then jsonb_build_object('status','ok') else jsonb_build_object('status','error','reason','Not found') end;
end $$;

-- ── approvers ────────────────────────────────────────────────────────────────────────
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

create or replace function public.lesson_decide_request(p_id uuid, p_decision text, p_note text, p_valid_days integer default 1) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare c jsonb; n int; v_until timestamptz;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD can decide lesson requests'); end if;
  if p_decision not in ('approved','rejected') then return jsonb_build_object('status','error','reason','Bad decision'); end if;
  -- valid until the end of the IST day, extended by whole days if the approver asked
  v_until := ((public.lesson_today() + greatest(1, least(coalesce(p_valid_days,1), 30)))::timestamp at time zone 'Asia/Kolkata');
  update public.lesson_unlock_requests
     set status = p_decision, decided_by = c->>'name', decided_at = now(),
         decision_note = nullif(left(trim(coalesce(p_note,'')), 1000), ''),
         valid_until = case when p_decision = 'approved' then v_until else null end
   where id = p_id and status = 'pending';
  get diagnostics n = row_count;
  return case when n = 1 then jsonb_build_object('status','ok','valid_until', v_until)
              else jsonb_build_object('status','error','reason','Already decided or withdrawn') end;
end $$;

-- ── the gate (service_role only, called by /api/push/lesson-open) ─────────────────────
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

-- Approvers: the deck library (HOD preview).
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

-- ── grants ───────────────────────────────────────────────────────────────────────────
revoke all on function public.lesson_caller() from public, anon;
revoke all on function public.lesson_can_access_batch(text, public.batches) from public, anon;
revoke all on function public.lesson_day_state(text) from public, anon;
revoke all on function public.lesson_authorize_open(text, integer, uuid, text) from public, anon, authenticated;
grant execute on function public.lesson_authorize_open(text, integer, uuid, text) to service_role;
grant execute on function public.lesson_batch_plan(text) to anon, service_role;
grant execute on function public.lesson_request_unlock(text, integer, text) to anon;
grant execute on function public.lesson_cancel_request(uuid) to anon;
grant execute on function public.lesson_list_requests(text) to anon;
grant execute on function public.lesson_decide_request(uuid, text, text, integer) to anon;
grant execute on function public.lesson_library() to anon;

-- ── private bucket for the deck files ────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-decks', 'lesson-decks', false, 52428800)
on conflict (id) do update set public = false;
-- No storage.objects policies for anon: only the service key (uploads, signed URLs) touches it.
