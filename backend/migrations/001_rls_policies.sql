-- ==============================================================================
-- 001_rls_policies.sql
-- 
-- Enable Row-Level Security (RLS) and define policies for access control.
-- These policies rely on two session variables set by the backend application:
--   - app.current_user_id
--   - app.current_user_role
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Security Definer Helper Functions (Avoid RLS Infinite Recursion)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_department_id(p_user_id text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT department_id FROM people WHERE id::text = p_user_id LIMIT 1;
$$;

-- ------------------------------------------------------------------------------
-- 1. Enable RLS on core tables
-- ------------------------------------------------------------------------------
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. People Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS people_privileged_policy ON people;
CREATE POLICY people_privileged_policy ON people
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('department_head', 'executive', 'work_admin', 'system_admin')
    );

DROP POLICY IF EXISTS people_employee_policy ON people;
CREATE POLICY people_employee_policy ON people
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'employee'
        AND id::text = current_setting('app.current_user_id', true)
    );

DROP POLICY IF EXISTS people_manager_policy ON people;
CREATE POLICY people_manager_policy ON people
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'manager'
        AND (
            id::text = current_setting('app.current_user_id', true)
            OR manager_id::text = current_setting('app.current_user_id', true)
        )
    );

-- Team leader can see themselves and their department members
DROP POLICY IF EXISTS people_team_leader_policy ON people;
CREATE POLICY people_team_leader_policy ON people
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'team_leader'
        AND (
            id::text = current_setting('app.current_user_id', true)
            OR department_id = get_user_department_id(current_setting('app.current_user_id', true))
        )
    );

-- ------------------------------------------------------------------------------
-- 3. Assignments Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS assignments_privileged_policy ON assignments;
CREATE POLICY assignments_privileged_policy ON assignments
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('department_head', 'executive', 'work_admin', 'system_admin')
    );

DROP POLICY IF EXISTS assignments_employee_policy ON assignments;
CREATE POLICY assignments_employee_policy ON assignments
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'employee'
        AND person_id::text = current_setting('app.current_user_id', true)
    );

DROP POLICY IF EXISTS assignments_manager_policy ON assignments;
CREATE POLICY assignments_manager_policy ON assignments
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'manager'
        AND person_id IN (
            SELECT id FROM people WHERE id::text = current_setting('app.current_user_id', true) OR manager_id::text = current_setting('app.current_user_id', true)
        )
    );

-- Team leader can see assignments for themselves and their department members
DROP POLICY IF EXISTS assignments_team_leader_policy ON assignments;
CREATE POLICY assignments_team_leader_policy ON assignments
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'team_leader'
        AND person_id IN (
            SELECT id FROM people WHERE id::text = current_setting('app.current_user_id', true) OR department_id = get_user_department_id(current_setting('app.current_user_id', true))
        )
    );

-- ------------------------------------------------------------------------------
-- 4. Status Updates Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS status_updates_select_policy ON status_updates;
CREATE POLICY status_updates_select_policy ON status_updates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM assignments WHERE assignments.id = status_updates.assignment_id
        )
    );

-- ------------------------------------------------------------------------------
-- 5. Projects Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS projects_privileged_policy ON projects;
CREATE POLICY projects_privileged_policy ON projects
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('department_head', 'executive', 'work_admin', 'system_admin')
    );

DROP POLICY IF EXISTS projects_assigned_policy ON projects;
CREATE POLICY projects_assigned_policy ON projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM assignments WHERE assignments.project_id = projects.id
        )
    );
