-- ============================================================
-- MIGRATION: Work Assignment Dashboard (Slack-style teams + tasks + live feed)
-- 2026-09-08, per instruction: "build slack like work assignment dashboard where
-- i can assign work to my counsellor or instructor by making a team and we can
-- get a realtime work done update".
--
-- Tables:  work_teams, work_team_members, work_tasks, work_task_events
-- Trigger: every INSERT/UPDATE on work_tasks writes a work_task_events row, so the
--          activity feed can never drift from the task state.
-- Realtime: both tables are added to the supabase_realtime publication; the
--          browser (assets/work.js) subscribes via supabase-js postgres_changes.
-- People are keyed by users.name (same convention as the rest of the portal and
-- push_subscriptions.user_key), not by users.id.
-- Run this in Supabase -> SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS work_teams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  centre      TEXT DEFAULT '',            -- '' = pan-India
  lead_name   TEXT NOT NULL,              -- users.name of the team lead (assigner)
  created_by  TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_team_members (
  team_id       UUID NOT NULL REFERENCES work_teams(id) ON DELETE CASCADE,
  user_name     TEXT NOT NULL,            -- users.name
  role_in_team  TEXT NOT NULL DEFAULT 'member',   -- 'lead' | 'member'
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_name)
);
CREATE INDEX IF NOT EXISTS idx_work_team_members_user ON work_team_members(user_name);

CREATE TABLE IF NOT EXISTS work_tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id       UUID NOT NULL REFERENCES work_teams(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  assigned_to   TEXT NOT NULL,            -- users.name
  assigned_by   TEXT NOT NULL,            -- users.name
  priority      TEXT NOT NULL DEFAULT 'normal',   -- 'low' | 'normal' | 'high' | 'urgent'
  category      TEXT DEFAULT 'general',   -- 'follow-up' | 'batch-prep' | 'admin' | 'fees' | 'academic' | 'general'
  status        TEXT NOT NULL DEFAULT 'todo',     -- 'todo' | 'in_progress' | 'blocked' | 'done'
  due_at        TIMESTAMPTZ,
  linked_ref    TEXT DEFAULT '',          -- optional student_id / batch_code for context
  last_actor    TEXT DEFAULT '',          -- who made the latest change (client sets this on every PATCH; trigger reads it)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_work_tasks_team     ON work_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_assignee ON work_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_tasks_status   ON work_tasks(status);

CREATE TABLE IF NOT EXISTS work_task_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     UUID NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
  team_id     UUID NOT NULL,              -- denormalised so Realtime can filter the feed by team
  actor       TEXT NOT NULL,
  type        TEXT NOT NULL,              -- 'created' | 'status_change' | 'comment' | 'reassigned' | 'due_changed' | 'edited'
  body        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_work_task_events_task ON work_task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_work_task_events_team ON work_task_events(team_id, created_at DESC);

-- ── Triggers: task changes write their own feed rows ─────────────────────────
-- Two triggers: the 'created' event must be AFTER INSERT (the FK to work_tasks.id
-- doesn't exist yet inside a BEFORE INSERT), while change-logging is BEFORE UPDATE
-- so it can also stamp updated_at / completed_at on the row itself.
-- (Applied to Supabase via MCP on 2026-09-08 as work_assignments_dashboard +
--  work_assignments_trigger_split; this file is the canonical reference copy.)
CREATE OR REPLACE FUNCTION work_tasks_after_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO work_task_events(task_id, team_id, actor, type, body)
  VALUES (NEW.id, NEW.team_id, NEW.assigned_by, 'created',
          'Assigned to ' || NEW.assigned_to || ' · ' || NEW.priority || ' priority');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION work_tasks_log_event() RETURNS TRIGGER AS $$
DECLARE
  who TEXT;
BEGIN
  who := COALESCE(NULLIF(NEW.last_actor, ''), NEW.assigned_to);
  NEW.updated_at := NOW();

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'done' THEN NEW.completed_at := NOW();
    ELSIF OLD.status = 'done' THEN NEW.completed_at := NULL;
    END IF;
    INSERT INTO work_task_events(task_id, team_id, actor, type, body)
    VALUES (NEW.id, NEW.team_id, who, 'status_change', OLD.status || ' → ' || NEW.status);
  END IF;

  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    INSERT INTO work_task_events(task_id, team_id, actor, type, body)
    VALUES (NEW.id, NEW.team_id, who, 'reassigned', OLD.assigned_to || ' → ' || NEW.assigned_to);
  END IF;

  IF NEW.due_at IS DISTINCT FROM OLD.due_at THEN
    INSERT INTO work_task_events(task_id, team_id, actor, type, body)
    VALUES (NEW.id, NEW.team_id, who, 'due_changed',
            'Due ' || COALESCE(to_char(NEW.due_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon HH24:MI'), 'cleared'));
  END IF;

  IF NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.priority IS DISTINCT FROM OLD.priority THEN
    INSERT INTO work_task_events(task_id, team_id, actor, type, body)
    VALUES (NEW.id, NEW.team_id, who, 'edited', 'Task details updated');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_work_tasks_log_event ON work_tasks;
DROP TRIGGER IF EXISTS trg_work_tasks_after_insert ON work_tasks;
DROP TRIGGER IF EXISTS trg_work_tasks_before_update ON work_tasks;
CREATE TRIGGER trg_work_tasks_after_insert
  AFTER INSERT ON work_tasks FOR EACH ROW EXECUTE FUNCTION work_tasks_after_insert();
CREATE TRIGGER trg_work_tasks_before_update
  BEFORE UPDATE ON work_tasks FOR EACH ROW EXECUTE FUNCTION work_tasks_log_event();

-- ── RLS + grants (same anon-key pattern as discount_requests etc.) ──────────
ALTER TABLE work_teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_task_events  ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='work_teams' AND policyname='anon_all_work_teams') THEN
    EXECUTE 'CREATE POLICY anon_all_work_teams ON work_teams FOR ALL TO anon USING (true) WITH CHECK (true)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='work_team_members' AND policyname='anon_all_work_team_members') THEN
    EXECUTE 'CREATE POLICY anon_all_work_team_members ON work_team_members FOR ALL TO anon USING (true) WITH CHECK (true)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='work_tasks' AND policyname='anon_all_work_tasks') THEN
    EXECUTE 'CREATE POLICY anon_all_work_tasks ON work_tasks FOR ALL TO anon USING (true) WITH CHECK (true)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='work_task_events' AND policyname='anon_all_work_task_events') THEN
    EXECUTE 'CREATE POLICY anon_all_work_task_events ON work_task_events FOR ALL TO anon USING (true) WITH CHECK (true)'; END IF;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_teams        TO anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_team_members TO anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_tasks        TO anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_task_events  TO anon, service_role;

-- ── Realtime ────────────────────────────────────────────────────────────────
-- Adds both tables to the default publication so supabase-js postgres_changes fires.
-- (If your project's publication is named differently, adjust here; Supabase default is supabase_realtime.)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='work_tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE work_tasks; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='work_task_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE work_task_events; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='work_team_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE work_team_members; END IF;
END $$;
-- Realtime needs full row images for UPDATE/DELETE payloads with filters
ALTER TABLE work_tasks REPLICA IDENTITY FULL;
ALTER TABLE work_task_events REPLICA IDENTITY FULL;
