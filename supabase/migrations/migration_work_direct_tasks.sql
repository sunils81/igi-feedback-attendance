-- Work: direct one-to-one tasks (2026-10-23, per Sunil).
-- Tasks always belong to a team (team_id NOT NULL, events carry it too), and people only load
-- the tasks of teams they belong to. For "assign this to one counsellor / instructor" a single
-- built-in team holds the direct tasks. It is NOT membership-based: work.js loads its tasks
-- only where you are the assignee or the assigner (the HOD's admin portal sees all of them),
-- so nobody sees anyone else's direct tasks.
alter table public.work_teams add column if not exists is_direct boolean not null default false;
insert into public.work_teams (name, centre, lead_name, created_by, is_direct)
select 'Direct tasks (one-to-one)', null, 'Admin', 'Admin', true
 where not exists (select 1 from public.work_teams where is_direct and is_active);
