-- ==============================================================================
-- 003_drop_old_scoped_policies.sql
--
-- PURPOSE:
--   Remove the OLD "_scoped" RLS policies that were created before the team
--   standardised on the session-variable-based approach
--   (app.current_user_id / app.current_user_role).
--
-- BACKGROUND:
--   PostgreSQL combines multiple SELECT policies on the same table with OR.
--   Having BOTH the old "_scoped" policies AND the new session-variable policies
--   active at the same time means the old (permissive) policy can grant access
--   that the new policy is meant to restrict — causing data leakage.
--
-- ACTION:
--   Drop every known old-style policy. All statements use IF EXISTS so this
--   migration is safe to re-run even if a policy was already removed.
--
-- POLICIES KEPT (session-variable-based, defined in 001_rls_policies.sql):
--   assignments : assignments_employee_policy
--                 assignments_manager_policy
--                 assignments_team_leader_policy
--                 assignments_privileged_policy
--   people      : people_employee_policy
--                 people_manager_policy
--                 people_team_leader_policy
--                 people_privileged_policy
--   projects    : projects_assigned_policy
--                 projects_privileged_policy
--   status_updates : status_updates_select_policy
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- assignments table — drop old scoped policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS assignments_select_scoped   ON assignments;
DROP POLICY IF EXISTS assignments_write_scoped     ON assignments;

-- Catch any other legacy naming variants that may have been used
DROP POLICY IF EXISTS assignments_select_policy    ON assignments;
DROP POLICY IF EXISTS assignments_insert_policy    ON assignments;
DROP POLICY IF EXISTS assignments_update_policy    ON assignments;
DROP POLICY IF EXISTS assignments_delete_policy    ON assignments;
DROP POLICY IF EXISTS assignments_all_policy       ON assignments;

-- ------------------------------------------------------------------------------
-- people table — drop old scoped policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS people_select_scoped         ON people;
DROP POLICY IF EXISTS people_write_scoped          ON people;
DROP POLICY IF EXISTS people_select_policy         ON people;
DROP POLICY IF EXISTS people_insert_policy         ON people;
DROP POLICY IF EXISTS people_update_policy         ON people;
DROP POLICY IF EXISTS people_delete_policy         ON people;
DROP POLICY IF EXISTS people_all_policy            ON people;

-- ------------------------------------------------------------------------------
-- projects table — drop old scoped policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS projects_select_scoped       ON projects;
DROP POLICY IF EXISTS projects_write_scoped        ON projects;
DROP POLICY IF EXISTS projects_select_policy       ON projects;
DROP POLICY IF EXISTS projects_insert_policy       ON projects;
DROP POLICY IF EXISTS projects_update_policy       ON projects;
DROP POLICY IF EXISTS projects_delete_policy       ON projects;
DROP POLICY IF EXISTS projects_all_policy          ON projects;

-- ------------------------------------------------------------------------------
-- status_updates table — drop old scoped policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS status_updates_write_scoped  ON status_updates;
DROP POLICY IF EXISTS status_updates_select_scoped ON status_updates;
DROP POLICY IF EXISTS status_updates_insert_policy ON status_updates;
DROP POLICY IF EXISTS status_updates_update_policy ON status_updates;
DROP POLICY IF EXISTS status_updates_delete_policy ON status_updates;
DROP POLICY IF EXISTS status_updates_all_policy    ON status_updates;

-- ------------------------------------------------------------------------------
-- Sanity check: confirm only the expected new policies remain
-- (informational — returns 0 rows if everything is clean)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    unexpected_count integer;
BEGIN
    SELECT COUNT(*) INTO unexpected_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('assignments', 'people', 'projects', 'status_updates')
      AND policyname LIKE '%scoped%';

    IF unexpected_count > 0 THEN
        RAISE WARNING 'Found % unexpected "_scoped" policies still on assignments/people/projects/status_updates. Review pg_policies manually.', unexpected_count;
    ELSE
        RAISE NOTICE 'Clean: no legacy "_scoped" policies remain on core tables.';
    END IF;
END$$;
