-- Diamonds 101 (IGI Team Training) video clips, 2026-11-18, per Sunil.
-- Four short clips from "How Lab Diamonds Are Made" (The Process, YouTube) for internal training,
-- streamed like the IGI films (encrypted HLS in R2, films/tt-lab-*). Rows are inserted separately
-- (they carry the AES keys). Team Training films are listed and played only for people who may
-- open the Team Training decks (HOD, or a Library grant that includes IGI Team Training).

create or replace function public.lesson_film_list()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not public.lesson_film_allowed(c) then return jsonb_build_object('status','error','reason','Films are for instructors'); end if;
  return jsonb_build_object('status','ok','me', c->>'name', 'approver', (c->>'approver')::boolean,
    'rows', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'title', f.title, 'subtitle', f.subtitle,
        'course', f.course, 'decks', f.deck_keys, 'duration', f.duration_s,
        'plays', (select count(*) from public.lesson_film_log l where l.film_id = f.id and l.purpose = 'play'))
        order by f.course, f.sort) from public.lesson_films f
        where f.is_active and (f.course <> 'IGI Team Training' or public.lesson_team_ok(c))), '[]'));
end $function$;

create or replace function public.lesson_film_authorize(p_film text, p_purpose text default 'play')
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare c jsonb; f public.lesson_films;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if not public.lesson_film_allowed(c) then return jsonb_build_object('status','error','reason','Films are for instructors'); end if;
  select * into f from public.lesson_films where id = p_film and is_active;
  if f.id is null then return jsonb_build_object('status','error','reason','Film not found'); end if;
  if f.course = 'IGI Team Training' and not public.lesson_team_ok(c) then
    return jsonb_build_object('status','error','reason','This clip is for IGI Team Training only'); end if;
  insert into public.lesson_film_log(film_id, opened_by, purpose)
  values (f.id, c->>'name', case when p_purpose in ('prepare','offline') then p_purpose else 'play' end);
  return jsonb_build_object('status','ok','me', c->>'name', 'film', jsonb_build_object('id', f.id, 'title', f.title,
    'variants', f.variants, 'key', f.enc_key));
end $function$;
