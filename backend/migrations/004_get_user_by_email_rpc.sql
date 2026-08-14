-- ==============================================================================
-- 004_get_user_by_email_rpc.sql
-- 
-- Creates a SECURITY DEFINER function to securely look up user details by email
-- during the login process, allowing the frontend to bypass RLS strictly for this.
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_user_by_email(lookup_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_user json;
BEGIN
    SELECT row_to_json(p) INTO found_user
    FROM (
        SELECT 
            p.id, 
            p.full_name, 
            p.email, 
            p.role, 
            p.job_title, 
            p.department_id,
            d.name as department_name
        FROM people p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.email = lookup_email
        LIMIT 1
    ) p;

    RETURN found_user;
END;
$$;
