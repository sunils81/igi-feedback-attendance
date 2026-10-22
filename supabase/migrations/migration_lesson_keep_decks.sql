-- Lesson decks: which saved copies may stay on this person's laptop (2026-10-22, per Sunil).
-- The portal calls this after sign-in and deletes every saved deck (Cache Storage) that is not
-- on the list, so a revoked Library grant or a finished batch also removes the copies.
-- Keep = the current version of
--   * every deck of a batch this person teaches (instructor / co-instructor / a session within
--     a day of today), if the batch is active and ended no more than 21 days ago (the same
--     window the Lessons tab lists), and
--   * NOT Library decks: reference copies are no longer saved on laptops at all.
-- The HOD (approver) keeps everything.
create or replace function public.lesson_keep_decks()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c jsonb;
begin
  c := public.lesson_caller();
  if c is null then return jsonb_build_object('status','error','reason','session'); end if;
  if (c->>'approver')::boolean then return jsonb_build_object('status','ok','all',true); end if;
  return jsonb_build_object('status','ok','all',false,
    'decks', coalesce((select jsonb_agg(distinct jsonb_build_object('id', d.id, 'version', d.version))
      from public.batches b
      join public.lesson_decks d on d.is_active and d.course = public.lesson_syllabus_key(b)
     where coalesce(b.is_active, true)
       and (b.end_date is null or b.end_date >= public.lesson_today() - 21)
       and public.lesson_can_access_batch(c->>'name', b)), '[]'));
end $$;
grant execute on function public.lesson_keep_decks() to anon, authenticated;
