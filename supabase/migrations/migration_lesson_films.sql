-- Lesson Films (2026-11-16, per Sunil): the IGI voice+music films stream inside the portal only.
-- Each film is cut into encrypted 6-second HLS pieces (1080/720/480) in the private
-- lesson-videos bucket. The AES key and the piece paths never leave the server except through
-- /api/push/film-play, which asks lesson_film_authorize() (service_role only) first and logs
-- every play / class-preparation. No download file is ever offered.

create table if not exists public.lesson_films (
  id text primary key,                 -- slug, also the folder in lesson-videos
  title text not null,
  subtitle text,
  course text not null,                -- 'Diamond Graduate' | 'Colored Stone Graduate'
  deck_keys text[] not null default '{}',  -- decks that show a "Watch the film" slide
  duration_s integer,
  sort integer not null default 0,
  variants jsonb not null default '[]',    -- [{v,bw,res,playlist,segs[]}] playlist has key://<id>
  enc_key text,                         -- base64 AES-128 key (server only)
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.lesson_films enable row level security;
revoke all on public.lesson_films from anon, authenticated;

create table if not exists public.lesson_film_log (
  id bigserial primary key,
  film_id text not null,
  opened_by text not null,
  purpose text not null default 'play', -- play | prepare | offline
  opened_at timestamptz not null default now()
);
alter table public.lesson_film_log enable row level security;
revoke all on public.lesson_film_log from anon, authenticated;

-- may this caller use Films? instructors, academic heads, admin/HOD, Library grant holders
create or replace function public.lesson_film_allowed(c jsonb)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select c is not null and (
    coalesce((c->>'approver')::boolean, false)
    or coalesce(c->>'role','') in ('Instructor','AcademicHead','Admin')
    or (public.lesson_library_grant_for(c->>'name')).id is not null)
$$;
revoke all on function public.lesson_film_allowed(jsonb) from public, anon, authenticated;

-- list for the Films tab (no key, no paths)
create or replace function public.lesson_film_list()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not public.lesson_film_allowed(c) then return jsonb_build_object('status','error','reason','Films are for instructors'); end if;
  return jsonb_build_object('status','ok','me', c->>'name', 'approver', (c->>'approver')::boolean,
    'rows', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'title', f.title, 'subtitle', f.subtitle,
        'course', f.course, 'decks', f.deck_keys, 'duration', f.duration_s,
        'plays', (select count(*) from public.lesson_film_log l where l.film_id = f.id and l.purpose = 'play'))
        order by f.course, f.sort) from public.lesson_films f where f.is_active), '[]'));
end $$;
grant execute on function public.lesson_film_list() to anon, authenticated;

-- server gate: logs and returns what the handler needs to sign
create or replace function public.lesson_film_authorize(p_film text, p_purpose text default 'play')
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c jsonb; f public.lesson_films;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not public.lesson_film_allowed(c) then return jsonb_build_object('status','error','reason','Films are for instructors'); end if;
  select * into f from public.lesson_films where id = p_film and is_active;
  if f.id is null then return jsonb_build_object('status','error','reason','Film not found'); end if;
  insert into public.lesson_film_log(film_id, opened_by, purpose)
  values (f.id, c->>'name', case when p_purpose in ('prepare','offline') then p_purpose else 'play' end);
  return jsonb_build_object('status','ok','me', c->>'name', 'film', jsonb_build_object('id', f.id, 'title', f.title,
    'variants', f.variants, 'key', f.enc_key));
end $$;
revoke all on function public.lesson_film_authorize(text, text) from public, anon, authenticated;
grant execute on function public.lesson_film_authorize(text, text) to service_role;

-- HOD: who watched what (last 60 days)
create or replace function public.lesson_film_usage()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null or not (c->>'approver')::boolean then return jsonb_build_object('status','error','reason','Only the HOD'); end if;
  return jsonb_build_object('status','ok','rows', coalesce((select jsonb_agg(jsonb_build_object(
      'film', l.film_id, 'by', l.opened_by, 'purpose', l.purpose, 'at', l.opened_at) order by l.opened_at desc)
    from (select * from public.lesson_film_log where opened_at > now() - interval '60 days' order by opened_at desc limit 500) l), '[]'));
end $$;
grant execute on function public.lesson_film_usage() to anon, authenticated;

-- The pieces themselves live in Cloudflare R2 (bucket igi-films, prefix films/), not Supabase:
-- free egress, and the Supabase free plan has 1 GB storage. The lesson-videos bucket below is unused.
insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-videos', 'lesson-videos', false, 20971520)
on conflict (id) do nothing;
