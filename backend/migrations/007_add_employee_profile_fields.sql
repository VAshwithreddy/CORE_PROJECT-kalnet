-- Employee-owned profile details. Each column is nullable to preserve
-- existing people records and to allow employees to fill details over time.
ALTER TABLE people ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS mobile_phone TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS personal_email TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS time_zone TEXT;
