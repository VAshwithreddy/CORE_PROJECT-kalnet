-- ==============================================================================
-- 001_rls_policies.sql
-- 
-- Enable Row-Level Security (RLS) and define policies for access control.
-- These policies rely on two session variables set by the backend application:
--   - app.current_user_id
--   - app.current_user_role
-- ==============================================================================

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
-- Privileged roles can see all people
CREATE POLICY people_privileged_policy ON people
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('department_head', 'executive', 'work_admin', 'system_admin')
    );

-- Employee can see themselves
CREATE POLICY people_employee_policy ON people
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'employee'
        AND id::text = current_setting('app.current_user_id', true)
    );

-- Manager can see themselves and direct reports
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
CREATE POLICY people_team_leader_policy ON people
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'team_leader'
        AND (
            id::text = current_setting('app.current_user_id', true)
            OR department_id = (
                SELECT department_id FROM people WHERE id::text = current_setting('app.current_user_id', true) LIMIT 1
            )
        )
    );

-- ------------------------------------------------------------------------------
-- 3. Assignments Table Policies
-- ------------------------------------------------------------------------------
-- Privileged roles can see all assignments
CREATE POLICY assignments_privileged_policy ON assignments
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('department_head', 'executive', 'work_admin', 'system_admin')
    );

-- Employee can see their own assignments
CREATE POLICY assignments_employee_policy ON assignments
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'employee'
        AND person_id::text = current_setting('app.current_user_id', true)
    );

-- Manager can see assignments for themselves and direct reports
CREATE POLICY assignments_manager_policy ON assignments
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'manager'
        AND person_id IN (
            SELECT id FROM people WHERE id::text = current_setting('app.current_user_id', true) OR manager_id::text = current_setting('app.current_user_id', true)
        )
    );

-- Team leader can see assignments for themselves and their department members
CREATE POLICY assignments_team_leader_policy ON assignments
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'team_leader'
        AND person_id IN (
            SELECT id FROM people WHERE id::text = current_setting('app.current_user_id', true) OR department_id = (
                SELECT department_id FROM people WHERE id::text = current_setting('app.current_user_id', true) LIMIT 1
            )
        )
    );

-- ------------------------------------------------------------------------------
-- 4. Status Updates Table Policies
-- ------------------------------------------------------------------------------
-- Can see a status update if they can see the assignment
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
-- Privileged roles can see all projects
CREATE POLICY projects_privileged_policy ON projects
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('department_head', 'executive', 'work_admin', 'system_admin')
    );

-- Users can see projects they are assigned to
CREATE POLICY projects_assigned_policy ON projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM assignments WHERE assignments.project_id = projects.id
        )
    );
