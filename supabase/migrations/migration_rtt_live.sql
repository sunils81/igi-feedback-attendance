-- Retail Technical Training (RTT): Library course + live audience quiz (2026-11-02, per Sunil).
--
-- 1) "Retail Technical Training" becomes a Lesson Library course. The HOD grants it per person
--    (Library access → tick "Retail Technical Training"), like DG / CSG / JBE.
-- 2) Live quiz: the instructor starts a session from inside the RTT deck, participants join on
--    their phones at /rtt-join.html with a 4-letter code (no login), answer each question while it
--    is open, and the deck shows answer counts, the reveal, the leaderboard and the podium.
--    Every session is linked to the client's RTT batch (corporate_batches, programme_type 'RTT'),
--    and every answer is kept, so results can feed ARP / client reports later.
--    RTT has no tests: these scores are engagement only, never a certificate criterion.
--
-- Security: all four tables have RLS on and no policies. Everything goes through the
-- SECURITY DEFINER functions below.
--   * host functions resolve the portal session (X-Portal-Session → app_session()) and require
--     the HOD/approver or a Library grant that includes "Retail Technical Training";
--   * player functions take the session code plus the player's id and secret (issued at join).
--   * answer keys never leave the database before a question closes.

-- ── 1. Library course ─────────────────────────────────────────────────────────────────
create or replace function public.lesson_ref_course(p_course text) returns text
language sql immutable as $$
  select case
    when coalesce(p_course,'') like 'Diamond Graduate%' then 'Diamond Graduate'
    when coalesce(p_course,'') like 'Colored Stone Graduate%' then 'Colored Stone Graduate'
    when coalesce(p_course,'') = 'Jewelry Business Essentials' then 'Jewelry Business Essentials'
    when coalesce(p_course,'') = 'Gem-A Foundation Orientation' then 'Gem-A Foundation Orientation'
    when coalesce(p_course,'') = 'Gem-A Foundation' then 'Gem-A Foundation'
    when coalesce(p_course,'') = 'IGI Orientation' then 'IGI Orientation'
    when coalesce(p_course,'') = 'Retail Technical Training' then 'Retail Technical Training'
  end
$$;
create or replace function public.lesson_ref_courses_all() returns text[]
language sql immutable as $$
  select array['Diamond Graduate','Colored Stone Graduate','Jewelry Business Essentials','Gem-A Foundation Orientation','Gem-A Foundation','Retail Technical Training']
$$;

-- ── 2. Tables ─────────────────────────────────────────────────────────────────────────
create table if not exists public.rtt_live_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  host text not null,
  corporate_batch_id uuid references public.corporate_batches(id) on delete set null,
  batch_code text, client text, centre text,
  track text not null default 'both' check (track in ('natural','lab','both')),
  focus text not null default 'full' check (focus in ('full','tech','sales')),
  status text not null default 'live' check (status in ('live','ended')),
  view text not null default 'idle' check (view in ('idle','lobby','question','board','podium')),
  quiz text, quiz_title text, questions jsonb, qi int,
  seq int not null default 0,
  q_ms int, q_open_at timestamptz, q_end_at timestamptz, paused_at timestamptz,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index if not exists rtt_live_sessions_code_live on public.rtt_live_sessions(code) where status = 'live';
create index if not exists rtt_live_sessions_batch on public.rtt_live_sessions(corporate_batch_id);

create table if not exists public.rtt_live_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.rtt_live_sessions(id) on delete cascade,
  name text not null,
  store text not null default '',
  secret text not null,
  score int not null default 0,
  correct int not null default 0,
  answered int not null default 0,
  ms_total bigint not null default 0,
  streak int not null default 0,
  best_streak int not null default 0,
  last_seq int,
  prev_rank int,
  joined_at timestamptz not null default now()
);
create index if not exists rtt_live_players_session on public.rtt_live_players(session_id);

-- one row per question actually asked (so results keep the wording even if the deck changes)
create table if not exists public.rtt_live_questions (
  session_id uuid not null references public.rtt_live_sessions(id) on delete cascade,
  seq int not null,
  quiz text not null, quiz_title text, qi int not null,
  question text not null, options jsonb not null, answer int not null,
  asked_at timestamptz not null default now(),
  primary key (session_id, seq)
);

create table if not exists public.rtt_live_answers (
  session_id uuid not null references public.rtt_live_sessions(id) on delete cascade,
  player_id uuid not null references public.rtt_live_players(id) on delete cascade,
  seq int not null,
  choice int not null,
  correct boolean not null,
  ms int not null,
  points int not null,
  at timestamptz not null default now(),
  primary key (player_id, seq)
);
create index if not exists rtt_live_answers_seq on public.rtt_live_answers(session_id, seq);

alter table public.rtt_live_sessions  enable row level security;
alter table public.rtt_live_players   enable row level security;
alter table public.rtt_live_questions enable row level security;
alter table public.rtt_live_answers   enable row level security;
revoke all on public.rtt_live_sessions, public.rtt_live_players, public.rtt_live_questions, public.rtt_live_answers from anon, authenticated;

-- ── 3. Helpers ────────────────────────────────────────────────────────────────────────
create or replace function public._rtt_ms(t timestamptz) returns bigint
language sql immutable as $$ select (extract(epoch from t) * 1000)::bigint $$;

-- who is calling, and may they run RTT sessions?
create or replace function public.rtt_live_caller() returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb; g public.lesson_library_access;
begin
  c := public.lesson_caller();
  if c is null then return null; end if;
  if (c->>'approver')::boolean then return c || jsonb_build_object('ok', true); end if;
  g := public.lesson_library_grant_for(c->>'name');
  return c || jsonb_build_object('ok', g.id is not null and 'Retail Technical Training' = any(g.courses));
end $$;

-- a live session ends by itself 12 hours after it started
create or replace function public._rtt_get(p_code text) returns public.rtt_live_sessions
language plpgsql security definer set search_path to 'public' as $$
declare s public.rtt_live_sessions;
begin
  select * into s from public.rtt_live_sessions where code = upper(trim(coalesce(p_code,''))) order by (status = 'live') desc, created_at desc limit 1;
  if s.id is not null and s.status = 'live' and s.created_at < now() - interval '12 hours' then
    update public.rtt_live_sessions set status = 'ended', ended_at = now(), view = 'podium' where id = s.id returning * into s;
  end if;
  return s;
end $$;

-- leaderboard: score, then correct answers, then total answer time
create or replace function public._rtt_ranked(p_session uuid)
returns table(id uuid, name text, store text, score int, correct int, answered int, streak int, best_streak int, prev_rank int, rank bigint)
language sql stable security definer set search_path to 'public' as $$
  select p.id, p.name, p.store, p.score, p.correct, p.answered, p.streak, p.best_streak, p.prev_rank,
         rank() over (order by p.score desc, p.correct desc, p.ms_total asc) as rank
    from public.rtt_live_players p where p.session_id = p_session
$$;

-- clock for the current question
create or replace function public._rtt_clock(s public.rtt_live_sessions) returns jsonb
language sql stable as $$
  select case when s.q_open_at is null then null else jsonb_build_object(
    'open_at', public._rtt_ms(s.q_open_at), 'end_at', public._rtt_ms(s.q_end_at),
    'paused_at', case when s.paused_at is null then null else public._rtt_ms(s.paused_at) end,
    'ms', s.q_ms,
    'closed', (coalesce(s.paused_at, clock_timestamp()) >= s.q_end_at)) end
$$;

-- ── 4. Host functions ─────────────────────────────────────────────────────────────────
-- RTT batches to link a session to (recent and upcoming first)
create or replace function public.rtt_live_batches() returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb;
begin
  c := public.rtt_live_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not (c->>'ok')::boolean then return jsonb_build_object('status','error','reason','Ask the HOD for access to Retail Technical Training'); end if;
  return jsonb_build_object('status','ok','me',c->>'name','rows', coalesce((select jsonb_agg(r order by r.sort desc) from (
    select b.id, b.batch_code, b.company_name as client, b.centre, b.training_start as start,
           coalesce(b.training_start, b.created_at::date) as sort,
           (select count(*) from public.rtt_live_sessions s where s.corporate_batch_id = b.id) as sessions
      from public.corporate_batches b
     where b.programme_type = 'RTT'
       and coalesce(b.training_start, b.created_at::date) >= current_date - 120
     order by coalesce(b.training_start, b.created_at::date) desc limit 80) r), '[]'::jsonb));
end $$;

create or replace function public.rtt_live_start(p_batch_id uuid, p_track text, p_focus text, p_centre text default null)
returns jsonb language plpgsql volatile security definer set search_path to 'public' as $$
declare c jsonb; b public.corporate_batches; v_code text; i int := 0; s public.rtt_live_sessions;
  alph text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  c := public.rtt_live_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not (c->>'ok')::boolean then return jsonb_build_object('status','error','reason','Ask the HOD for access to Retail Technical Training'); end if;
  if p_batch_id is not null then
    select * into b from public.corporate_batches where id = p_batch_id;
    if b.id is null or coalesce(b.programme_type,'') <> 'RTT' then return jsonb_build_object('status','error','reason','Choose an RTT batch'); end if;
  end if;
  loop
    v_code := '';
    for k in 1..4 loop v_code := v_code || substr(alph, 1 + floor(random() * length(alph))::int, 1); end loop;
    exit when not exists (select 1 from public.rtt_live_sessions where code = v_code and status = 'live');
    i := i + 1; if i > 50 then return jsonb_build_object('status','error','reason','Try again'); end if;
  end loop;
  insert into public.rtt_live_sessions(code, host, corporate_batch_id, batch_code, client, centre, track, focus)
  values (v_code, c->>'name', b.id, b.batch_code, b.company_name, coalesce(nullif(p_centre,''), b.centre),
          case when p_track in ('natural','lab','both') then p_track else 'both' end,
          case when p_focus in ('full','tech','sales') then p_focus else 'full' end)
  returning * into s;
  return jsonb_build_object('status','ok','code', s.code, 'id', s.id, 'batch_code', s.batch_code, 'client', s.client);
end $$;

-- the state the presenter screen needs
create or replace function public._rtt_host_state(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare s public.rtt_live_sessions; v_q jsonb; v_n int; v_ans int; v_dist jsonb;
begin
  select * into s from public.rtt_live_sessions where id = p_id;
  select count(*) into v_n from public.rtt_live_players where session_id = s.id;
  if s.qi is not null and s.questions is not null and s.qi >= 0 then v_q := s.questions -> s.qi; end if;
  select count(*), jsonb_build_array(count(*) filter (where choice = 0), count(*) filter (where choice = 1), count(*) filter (where choice = 2), count(*) filter (where choice = 3))
    into v_ans, v_dist from public.rtt_live_answers where session_id = s.id and seq = s.seq;
  return jsonb_build_object('status','ok','server', public._rtt_ms(clock_timestamp()),
    'id', s.id, 'code', s.code, 'live', s.status = 'live', 'view', s.view, 'host', s.host,
    'batch_code', s.batch_code, 'client', s.client, 'centre', s.centre, 'track', s.track, 'focus', s.focus,
    'quiz', s.quiz, 'title', s.quiz_title, 'qi', s.qi, 'n', coalesce(jsonb_array_length(s.questions), 0), 'seq', s.seq,
    'q', v_q, 'clock', public._rtt_clock(s),
    'players', v_n, 'answered', coalesce(v_ans, 0), 'dist', v_dist,
    'names', coalesce((select jsonb_agg(x.name order by x.joined_at desc) from (select name, joined_at from public.rtt_live_players where session_id = s.id order by joined_at desc limit 60) x), '[]'::jsonb),
    'top', coalesce((select jsonb_agg(jsonb_build_object('name', r.name, 'store', r.store, 'score', r.score, 'correct', r.correct, 'rank', r.rank, 'prev', r.prev_rank, 'streak', r.streak) order by r.rank, r.name)
                       from (select * from public._rtt_ranked(s.id) order by rank, name limit 10) r), '[]'::jsonb));
end $$;

create or replace function public.rtt_live_host(p_code text) returns jsonb
language plpgsql volatile security definer set search_path to 'public' as $$
declare c jsonb; s public.rtt_live_sessions;
begin
  c := public.rtt_live_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not (c->>'ok')::boolean then return jsonb_build_object('status','error','reason','No access'); end if;
  s := public._rtt_get(p_code);
  if s.id is null then return jsonb_build_object('status','error','reason','No such session'); end if;
  if s.host <> c->>'name' and not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','This session belongs to ' || s.host); end if;
  return public._rtt_host_state(s.id);
end $$;

-- every presenter action; the work is in _rtt_ctl so it can be tested without a portal session
create or replace function public._rtt_ctl(p_id uuid, p_action text, p_args jsonb) returns jsonb
language plpgsql volatile security definer set search_path to 'public' as $$
declare s public.rtt_live_sessions; v_qs jsonb; v_now timestamptz := clock_timestamp(); v_ms int; v_q jsonb; v_t text; v_n int; i int;
begin
  select * into s from public.rtt_live_sessions where id = p_id for update;
  if s.id is null then return jsonb_build_object('status','error','reason','No such session'); end if;
  if s.status <> 'live' and p_action not in ('state') then return jsonb_build_object('status','error','reason','This session has ended'); end if;

  if p_action = 'open_quiz' then
    -- p_args: {quiz, title, questions:[{q, o:[..], a, why?, t?}]}
    v_qs := p_args -> 'questions';
    if jsonb_typeof(v_qs) is distinct from 'array' or jsonb_array_length(v_qs) = 0 or jsonb_array_length(v_qs) > 20 then
      return jsonb_build_object('status','error','reason','A quiz needs 1 to 20 questions'); end if;
    for i in 0 .. jsonb_array_length(v_qs) - 1 loop
      v_q := v_qs -> i;
      if coalesce(length(v_q->>'q'),0) = 0 or length(v_q->>'q') > 400 or jsonb_typeof(v_q->'o') is distinct from 'array'
         or jsonb_array_length(v_q->'o') not between 2 and 4 or coalesce((v_q->>'a')::int, -1) not between 0 and jsonb_array_length(v_q->'o') - 1 then
        return jsonb_build_object('status','error','reason','Question ' || (i+1) || ' is not valid'); end if;
    end loop;
    update public.rtt_live_sessions set quiz = left(coalesce(p_args->>'quiz','quiz'),40), quiz_title = left(coalesce(p_args->>'title','Quiz'),120),
      questions = v_qs, qi = -1, view = 'lobby', q_open_at = null, q_end_at = null, paused_at = null, q_ms = null where id = s.id;

  elsif p_action = 'next' then
    if s.questions is null then return jsonb_build_object('status','error','reason','Open a quiz first'); end if;
    if s.qi + 1 >= jsonb_array_length(s.questions) then return jsonb_build_object('status','error','reason','That was the last question'); end if;
    v_q := s.questions -> (s.qi + 1);
    v_ms := greatest(10000, least(60000, coalesce((v_q->>'t')::int, case when length(v_q->>'q') > 110 then 30000 else 20000 end)));
    -- remember everyone's place before this question, for the ▲▼ on the leaderboard
    update public.rtt_live_players p set prev_rank = r.rank from public._rtt_ranked(s.id) r where p.id = r.id;
    update public.rtt_live_sessions set qi = s.qi + 1, seq = s.seq + 1, view = 'question', q_ms = v_ms,
      q_open_at = v_now + interval '5 seconds', q_end_at = v_now + interval '5 seconds' + make_interval(secs => v_ms / 1000.0), paused_at = null
      where id = s.id;
    insert into public.rtt_live_questions(session_id, seq, quiz, quiz_title, qi, question, options, answer)
      values (s.id, s.seq + 1, s.quiz, s.quiz_title, s.qi + 1, v_q->>'q', v_q->'o', (v_q->>'a')::int)
      on conflict (session_id, seq) do nothing;

  elsif p_action = 'reveal' then  -- close the question now
    if s.view = 'question' and s.q_end_at is not null then
      update public.rtt_live_sessions set q_end_at = least(q_end_at, coalesce(paused_at, v_now)),
        q_open_at = least(q_open_at, coalesce(paused_at, v_now)), paused_at = null where id = s.id;
    end if;

  elsif p_action = 'extend' then
    if s.view = 'question' and coalesce(s.paused_at, v_now) < s.q_end_at then
      update public.rtt_live_sessions set q_end_at = q_end_at + interval '10 seconds', q_ms = q_ms + 10000 where id = s.id; end if;

  elsif p_action = 'pause' then
    if s.view = 'question' and s.paused_at is null and v_now < s.q_end_at then
      update public.rtt_live_sessions set paused_at = v_now where id = s.id; end if;

  elsif p_action = 'resume' then
    if s.paused_at is not null then
      update public.rtt_live_sessions set q_open_at = q_open_at + (v_now - paused_at), q_end_at = q_end_at + (v_now - paused_at), paused_at = null where id = s.id; end if;

  elsif p_action = 'board' then
    update public.rtt_live_sessions set view = 'board' where id = s.id;

  elsif p_action = 'close_quiz' then
    update public.rtt_live_sessions set view = 'idle', quiz = null, quiz_title = null, questions = null, qi = null,
      q_open_at = null, q_end_at = null, paused_at = null where id = s.id;

  elsif p_action = 'podium' then
    update public.rtt_live_sessions set view = 'podium', paused_at = null where id = s.id;

  elsif p_action = 'end' then
    update public.rtt_live_sessions set status = 'ended', ended_at = v_now, view = 'podium', paused_at = null where id = s.id;

  elsif p_action = 'settings' then
    v_t := p_args->>'track';
    update public.rtt_live_sessions set
      track = case when v_t in ('natural','lab','both') then v_t else track end,
      focus = case when p_args->>'focus' in ('full','tech','sales') then p_args->>'focus' else focus end
      where id = s.id;

  elsif p_action = 'kick' then
    delete from public.rtt_live_players where session_id = s.id and id = (p_args->>'pid')::uuid;

  elsif p_action <> 'state' then
    return jsonb_build_object('status','error','reason','Unknown action');
  end if;
  return public._rtt_host_state(s.id);
end $$;

create or replace function public.rtt_live_control(p_code text, p_action text, p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql volatile security definer set search_path to 'public' as $$
declare c jsonb; s public.rtt_live_sessions;
begin
  c := public.rtt_live_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not (c->>'ok')::boolean then return jsonb_build_object('status','error','reason','No access'); end if;
  s := public._rtt_get(p_code);
  if s.id is null then return jsonb_build_object('status','error','reason','No such session'); end if;
  if s.host <> c->>'name' and not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','This session belongs to ' || s.host); end if;
  return public._rtt_ctl(s.id, p_action, coalesce(p_args, '{}'::jsonb));
end $$;

-- results: one row per participant plus one row per question (for the CSV and later reports)
create or replace function public._rtt_results(p_id uuid) returns jsonb
language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object('status','ok',
    'session', (select jsonb_build_object('code', s.code, 'host', s.host, 'batch_code', s.batch_code, 'client', s.client, 'centre', s.centre,
                 'track', s.track, 'focus', s.focus, 'started', s.created_at, 'ended', s.ended_at) from public.rtt_live_sessions s where s.id = p_id),
    'players', coalesce((select jsonb_agg(jsonb_build_object('rank', r.rank, 'name', r.name, 'store', r.store, 'score', r.score, 'correct', r.correct,
                 'answered', r.answered, 'best_streak', r.best_streak) order by r.rank, r.name) from public._rtt_ranked(p_id) r), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_build_object('seq', q.seq, 'quiz', q.quiz_title, 'qi', q.qi + 1, 'question', q.question,
                 'answer', q.options ->> q.answer,
                 'answered', (select count(*) from public.rtt_live_answers a where a.session_id = p_id and a.seq = q.seq),
                 'correct', (select count(*) from public.rtt_live_answers a where a.session_id = p_id and a.seq = q.seq and a.correct)) order by q.seq)
                 from public.rtt_live_questions q where q.session_id = p_id), '[]'::jsonb))
$$;

create or replace function public.rtt_live_results(p_code text) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb; s public.rtt_live_sessions;
begin
  c := public.rtt_live_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not (c->>'ok')::boolean then return jsonb_build_object('status','error','reason','No access'); end if;
  select * into s from public.rtt_live_sessions where code = upper(trim(coalesce(p_code,''))) order by created_at desc limit 1;
  if s.id is null then return jsonb_build_object('status','error','reason','No such session'); end if;
  if s.host <> c->>'name' and not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','This session belongs to ' || s.host); end if;
  return public._rtt_results(s.id);
end $$;

-- earlier sessions for a batch (or, without a batch, this person's own recent sessions)
create or replace function public.rtt_live_history(p_batch_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb;
begin
  c := public.rtt_live_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not (c->>'ok')::boolean then return jsonb_build_object('status','error','reason','No access'); end if;
  return jsonb_build_object('status','ok','rows', coalesce((select jsonb_agg(x order by x.started desc) from (
    select s.code, s.host, s.batch_code, s.client, s.track, s.status, s.created_at as started,
           (select count(*) from public.rtt_live_players p where p.session_id = s.id) as players,
           (select count(*) from public.rtt_live_questions q where q.session_id = s.id) as questions,
           (select p.name from public._rtt_ranked(s.id) p order by p.rank limit 1) as winner
      from public.rtt_live_sessions s
     where (p_batch_id is not null and s.corporate_batch_id = p_batch_id)
        or (p_batch_id is null and (s.host = c->>'name' or (c->>'approver')::boolean) and s.created_at > now() - interval '60 days')
     order by s.created_at desc limit 30) x), '[]'::jsonb));
end $$;

-- ── 5. Participant functions (phones; no login) ───────────────────────────────────────
create or replace function public.rtt_live_join(p_code text, p_name text, p_store text default '', p_pid uuid default null, p_secret text default null)
returns jsonb language plpgsql volatile security definer set search_path to 'public' as $$
declare s public.rtt_live_sessions; p public.rtt_live_players; v_name text; v_store text;
begin
  s := public._rtt_get(p_code);
  if s.id is null or s.status <> 'live' then return jsonb_build_object('status','error','reason','No live session with that code'); end if;
  -- coming back on the same phone
  if p_pid is not null then
    select * into p from public.rtt_live_players where id = p_pid and session_id = s.id and secret = coalesce(p_secret,'');
    if p.id is not null then
      return jsonb_build_object('status','ok','pid', p.id, 'secret', p.secret, 'name', p.name, 'store', p.store, 'client', s.client, 'track', s.track); end if;
  end if;
  v_name := left(trim(regexp_replace(coalesce(p_name,''), '[[:cntrl:]<>]', '', 'g')), 40);
  v_store := left(trim(regexp_replace(coalesce(p_store,''), '[[:cntrl:]<>]', '', 'g')), 40);
  if length(v_name) < 2 then return jsonb_build_object('status','error','reason','Please enter your name'); end if;
  if (select count(*) from public.rtt_live_players where session_id = s.id) >= 400 then
    return jsonb_build_object('status','error','reason','This session is full'); end if;
  if exists (select 1 from public.rtt_live_players where session_id = s.id and lower(name) = lower(v_name) and lower(store) = lower(v_store)) then
    return jsonb_build_object('status','error','reason','That name is already playing. Add your surname or initial.'); end if;
  insert into public.rtt_live_players(session_id, name, store, secret)
    values (s.id, v_name, v_store, replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')) returning * into p;
  return jsonb_build_object('status','ok','pid', p.id, 'secret', p.secret, 'name', p.name, 'store', p.store, 'client', s.client, 'track', s.track);
end $$;

create or replace function public.rtt_live_poll(p_code text, p_pid uuid, p_secret text) returns jsonb
language plpgsql volatile security definer set search_path to 'public' as $$
declare s public.rtt_live_sessions; p public.rtt_live_players; v_q jsonb; v_a public.rtt_live_answers; v_rank bigint; v_of int;
  v_now timestamptz := clock_timestamp(); v_closed boolean; v_out jsonb;
begin
  s := public._rtt_get(p_code);
  if s.id is null then return jsonb_build_object('status','error','reason','No such session'); end if;
  select * into p from public.rtt_live_players where id = p_pid and session_id = s.id and secret = coalesce(p_secret,'');
  if p.id is null then return jsonb_build_object('status','gone'); end if;
  select r.rank into v_rank from public._rtt_ranked(s.id) r where r.id = p.id;
  select count(*) into v_of from public.rtt_live_players where session_id = s.id;
  v_out := jsonb_build_object('status','ok','server', public._rtt_ms(v_now), 'live', s.status = 'live', 'view', s.view,
    'client', s.client, 'title', s.quiz_title, 'qi', s.qi, 'n', coalesce(jsonb_array_length(s.questions), 0),
    'me', jsonb_build_object('name', p.name, 'store', p.store, 'score', p.score, 'correct', p.correct, 'streak', p.streak,
                             'rank', v_rank, 'prev', p.prev_rank, 'of', v_of));
  if s.view = 'question' and s.qi >= 0 then
    v_q := s.questions -> s.qi;
    v_closed := coalesce(s.paused_at, v_now) >= s.q_end_at;
    select * into v_a from public.rtt_live_answers where player_id = p.id and seq = s.seq;
    v_out := v_out || jsonb_build_object('seq', s.seq, 'clock', public._rtt_clock(s),
      'q', case when coalesce(s.paused_at, v_now) >= s.q_open_at or v_closed then jsonb_build_object('q', v_q->>'q', 'o', v_q->'o') end,
      'mine', case when v_a.player_id is null then null else jsonb_build_object('choice', v_a.choice) end,
      'reveal', case when v_closed then jsonb_build_object('a', (v_q->>'a')::int, 'why', v_q->>'why',
                     'correct', coalesce(v_a.correct, false), 'points', coalesce(v_a.points, 0), 'answered', v_a.player_id is not null) end);
  end if;
  return v_out;
end $$;

create or replace function public.rtt_live_answer(p_code text, p_pid uuid, p_secret text, p_seq int, p_choice int)
returns jsonb language plpgsql volatile security definer set search_path to 'public' as $$
declare s public.rtt_live_sessions; p public.rtt_live_players; v_q jsonb; v_now timestamptz := clock_timestamp();
  v_ok boolean; v_ms int; v_pts int := 0; v_streak int; v_n int; v_ans int;
begin
  s := public._rtt_get(p_code);
  if s.id is null or s.status <> 'live' then return jsonb_build_object('status','error','reason','Session ended'); end if;
  select * into p from public.rtt_live_players where id = p_pid and session_id = s.id and secret = coalesce(p_secret,'') for update;
  if p.id is null then return jsonb_build_object('status','gone'); end if;
  if s.view <> 'question' or p_seq <> s.seq then return jsonb_build_object('status','closed','reason','This question is closed'); end if;
  if s.paused_at is not null then return jsonb_build_object('status','closed','reason','Paused'); end if;
  if v_now < s.q_open_at then return jsonb_build_object('status','closed','reason','Not open yet'); end if;
  if v_now >= s.q_end_at + interval '600 milliseconds' then return jsonb_build_object('status','closed','reason','Time is up'); end if;
  if exists (select 1 from public.rtt_live_answers where player_id = p.id and seq = s.seq) then return jsonb_build_object('status','ok','dup',true); end if;
  v_q := s.questions -> s.qi;
  if p_choice < 0 or p_choice >= jsonb_array_length(v_q->'o') then return jsonb_build_object('status','error','reason','Invalid answer'); end if;
  v_ok := p_choice = (v_q->>'a')::int;
  v_ms := least(s.q_ms, greatest(0, (public._rtt_ms(v_now) - public._rtt_ms(s.q_open_at))::int));
  if v_ok then
    v_streak := case when p.last_seq = s.seq - 1 then p.streak + 1 else 1 end;
    v_pts := 100 + round(50.0 * greatest(0, s.q_ms - v_ms) / greatest(1, s.q_ms))::int + case when v_streak >= 3 then 20 else 0 end;
  else
    v_streak := 0;
  end if;
  insert into public.rtt_live_answers(session_id, player_id, seq, choice, correct, ms, points)
    values (s.id, p.id, s.seq, p_choice, v_ok, v_ms, v_pts);
  update public.rtt_live_players set score = score + v_pts, correct = correct + case when v_ok then 1 else 0 end,
    answered = answered + 1, ms_total = ms_total + v_ms, streak = v_streak, best_streak = greatest(best_streak, v_streak),
    last_seq = case when v_ok then s.seq else last_seq end
    where id = p.id;
  -- everyone has answered: close the question straight away
  select count(*) into v_n from public.rtt_live_players where session_id = s.id;
  select count(*) into v_ans from public.rtt_live_answers where session_id = s.id and seq = s.seq;
  if v_ans >= v_n then
    update public.rtt_live_sessions set q_end_at = least(q_end_at, v_now) where id = s.id and seq = p_seq;
  end if;
  return jsonb_build_object('status','ok');
end $$;

-- ── 6. Grants ─────────────────────────────────────────────────────────────────────────
revoke all on function public._rtt_get(text), public._rtt_ranked(uuid), public._rtt_host_state(uuid), public._rtt_ctl(uuid,text,jsonb), public._rtt_results(uuid), public.rtt_live_caller() from public, anon, authenticated;
grant execute on function public.rtt_live_batches(), public.rtt_live_start(uuid,text,text,text), public.rtt_live_host(text),
  public.rtt_live_control(text,text,jsonb), public.rtt_live_results(text), public.rtt_live_history(uuid),
  public.rtt_live_join(text,text,text,uuid,text), public.rtt_live_poll(text,uuid,text), public.rtt_live_answer(text,uuid,text,int,int)
  to anon, authenticated;
