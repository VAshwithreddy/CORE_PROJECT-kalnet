-- ==============================================================================
-- 002_add_new_roles.sql
--
-- Adds 'manager' and 'team_leader' to the existing PostgreSQL enum type
-- 'person_role'. PostgreSQL requires ALTER TYPE ... ADD VALUE for enums.
-- ==============================================================================

-- Add new values to the enum (safe to run — won't fail if already exists in PG 11+)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager' AND enumtypid = 'person_role'::regtype) THEN
        ALTER TYPE person_role ADD VALUE 'manager';
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'team_leader' AND enumtypid = 'person_role'::regtype) THEN
        ALTER TYPE person_role ADD VALUE 'team_leader';
    END IF;
END$$;
