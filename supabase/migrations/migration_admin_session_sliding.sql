-- Admin sessions no longer expire while in use (2026-10-23, per instruction: "admin accounts
-- log out every now and then — I don't want that").
-- Every token is still issued for 12 hours by auth_login / auth_issue_pin_session. For an
-- Admin-role session, each auth_session check now slides the expiry out to 30 days from now.
-- The admin portal checks on every load and every 30 minutes while open (admin.html keepalive),
-- so an admin stays signed in until they sign out, the account is disabled, or the browser
-- is left unused for 30 days. Counsellor / Instructor sessions are unchanged (12 hours).
create or replace function public.auth_session(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  s public.auth_sessions;
  u public.users;
begin
  if coalesce(p_token,'') = '' then
    return jsonb_build_object('status','error','reason','no_session');
  end if;

  select * into s from public.auth_sessions
   where token = p_token and not revoked and expires_at > now() limit 1;
  if not found then
    return jsonb_build_object('status','error','reason','no_session');
  end if;

  -- Sliding expiry for Admin sessions (see header).
  if s.role = 'Admin' and s.expires_at < now() + interval '29 days' then
    update public.auth_sessions set expires_at = now() + interval '30 days' where token = s.token;
  end if;

  -- A pin-issued session has no row in users; answer from the session itself.
  if s.user_id is null then
    return jsonb_build_object('status','ok','token', s.token, 'name', s.user_name,
      'role', s.role, 'centres', coalesce(s.centres,''), 'permissions', '{}'::jsonb,
      'issuedVia', s.issued_via);
  end if;

  select * into u from public.users where id = s.user_id limit 1;
  -- Disabling an account must take effect on sessions already open, not just new logins.
  if not found or not coalesce(u.is_active, false) then
    return jsonb_build_object('status','error','reason','no_session');
  end if;

  return public.auth_profile(u, s.token) || jsonb_build_object('issuedVia', s.issued_via);
end;
$function$;
