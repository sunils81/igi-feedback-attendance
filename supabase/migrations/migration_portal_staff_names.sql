-- Names for the portal login dropdowns (2026-11-03): a user created in Admin -> Settings
-- appears in the Instructor / Counsellor login list automatically. Applied via Supabase MCP.
create or replace function public.portal_staff_names(p_role text)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(u.name order by u.name), '[]'::jsonb)
    from public.users u
   where u.is_active
     and (u.role = p_role or coalesce(u.roles, '[]'::jsonb) ? p_role)
     and u.name not in ('Admin', 'AcademicHead', 'Instructor', 'Counselor', 'HR')
     and p_role in ('Instructor', 'Counselor')
$$;
revoke all on function public.portal_staff_names(text) from public;
grant execute on function public.portal_staff_names(text) to anon, authenticated;
