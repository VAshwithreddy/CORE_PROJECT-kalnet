-- Migration 005: Patch notifications table to match the ORM model
-- Adds columns that may be missing from an earlier schema version.
-- All statements use IF NOT EXISTS / DO NOTHING so they are safe to re-run.

-- 1. Add `title` column (was absent in the original schema)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';

-- 2. Add `message` column (may already exist as body/content in older schemas)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS message TEXT;

-- 3. Ensure `is_read` exists with the right default
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Ensure `created_at` has a timezone-aware default
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 5. Drop the DEFAULT constraint on title after adding the column
--    (keeps existing rows intact, new rows must supply a title)
ALTER TABLE notifications
  ALTER COLUMN title DROP DEFAULT;
