-- ============================================================
-- SQL Script to enable policies and permissions on all tables
-- Run this block in the Supabase SQL Editor (https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql)
-- ============================================================

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.table_name);
        
        -- Drop existing anon_all policy if exists
        EXECUTE format('DROP POLICY IF EXISTS "anon_all_%s" ON public.%I', tbl.table_name, tbl.table_name);
        
        -- Create policy allowing all actions to anon
        EXECUTE format(
            'CREATE POLICY "anon_all_%s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', 
            tbl.table_name, tbl.table_name
        );
        
        -- Grant all permissions to anon
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', tbl.table_name);
    END LOOP;
END $$;

-- Verify policies are applied
SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname = 'public';
