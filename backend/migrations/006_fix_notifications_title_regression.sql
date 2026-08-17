-- ==============================================================================
-- 006_fix_notifications_title_regression.sql
--
-- BUG: 005_patch_notifications_columns.sql re-added a `title` column as
-- `TEXT NOT NULL` with no default, directly contradicting
-- 003_notification_system.sql's explicit design ("This migration
-- intentionally does NOT touch `title` — the real table has no such
-- column; `message` is the single display string") and the
-- SQLAlchemy model (src/models/notification.py), which never sets
-- `title`. Nothing in the application ever supplies a value for it —
-- `grep -rn "\.title" src/` matches zero notification code paths — so
-- every single INSERT into `notifications` has been failing with:
--   psycopg2.errors.NotNullViolation: null value in column "title"
--   of relation "notifications" violates not-null constraint
-- This is not a hypothetical: it reproduces on a clean schema built
-- from this repo's own models + migrations in sequence, and breaks
-- NotificationService.deliver() — i.e. the entire notification
-- pipeline (assignment/status-update/staleness notifications, the
-- scheduled sweep, and every notifications_service/api/integration
-- test) — for exactly this reason.
--
-- FIX: drop the NOT NULL constraint so inserts succeed again. The
-- column itself is left in place (non-destructive, in case any row
-- already has a value) rather than dropped outright, since dropping a
-- column is irreversible and this migration doesn't have visibility
-- into whether production ever accumulated rows depending on it.
-- ==============================================================================

ALTER TABLE notifications
    ALTER COLUMN title DROP NOT NULL;
