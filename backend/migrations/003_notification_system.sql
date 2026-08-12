-- ==============================================================================
-- 003_notification_system.sql
--
-- AI-Powered Notification & Alert Intelligence System — Layer A schema.
-- See docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md for the full design.
--
-- 1. Extends the existing `notifications` table with the columns the
--    deterministic NotificationRulesEngine / NotificationService need.
--    Base.metadata.create_all() only creates tables that don't exist yet —
--    it never ALTERs an existing one — so these columns must be added
--    explicitly for this to apply cleanly against the current production
--    schema (it will no-op harmlessly on a brand-new dev DB where
--    create_all() already created the table with these columns).
-- 2. Creates `notification_enrichments` (idempotent — create_all() would
--    also create it; declared here so RLS can be applied in one script).
-- 3. Enables RLS on both tables and adds the recipient/privileged SELECT
--    policies, following the exact pattern in 001_rls_policies.sql.
-- 4. Adds a partial UNIQUE index that enforces the NotificationService
--    dedup guarantee at the database level (not just in application code).
--
-- Apply after 001_rls_policies.sql (and 002_add_new_roles.sql, wherever
-- that has been applied) — see backend/apply_migration.py.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Extend `notifications`
--
-- IMPORTANT: `action_url` already exists on the real production table —
-- this ADD COLUMN IF NOT EXISTS is a no-op there. It's included so any
-- environment whose `notifications` table was bootstrapped via
-- Base.metadata.create_all() from an earlier, out-of-sync version of
-- models/notification.py (one that didn't declare action_url) still ends
-- up matching production. This migration intentionally does NOT touch
-- `title` — the real table has no such column; `message` is the single
-- display string. See docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md.
-- ------------------------------------------------------------------------------
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS action_url TEXT,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'info',
    ADD COLUMN IF NOT EXISTS entity_type TEXT,
    ADD COLUMN IF NOT EXISTS entity_id UUID,
    ADD COLUMN IF NOT EXISTS requires_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS acknowledged_by_id UUID REFERENCES people(id),
    ADD COLUMN IF NOT EXISTS dedup_key TEXT;

CREATE INDEX IF NOT EXISTS ix_notifications_recipient_created
    ON notifications (recipient_id, created_at);

CREATE INDEX IF NOT EXISTS ix_notifications_entity
    ON notifications (entity_type, entity_id);

-- Database-level enforcement of the NotificationService dedup guarantee.
-- The application-level pre-check (services/notifications.py) is a fast
-- path; this index is what actually prevents duplicates from landing
-- under concurrent requests. NULLs are distinct in Postgres, so this only
-- constrains the notification types that opt into dedup by setting
-- dedup_key — see architecture doc for which ones, and why.
CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_dedup_key
    ON notifications (dedup_key)
    WHERE dedup_key IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 2. Create `notification_enrichments`
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_enrichments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id         UUID NOT NULL UNIQUE REFERENCES notifications(id),
    importance_score        INTEGER,
    risk_level               TEXT,
    ai_summary               TEXT,
    ai_reason                TEXT,
    recommended_action       TEXT,
    escalation_recommended   BOOLEAN,
    confidence                NUMERIC(3, 2),
    model_identifier          TEXT,
    context_fingerprint       TEXT,
    analysis_timestamp        TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. Row-Level Security
-- ------------------------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_enrichments ENABLE ROW LEVEL SECURITY;

-- A recipient always sees their own notifications.
CREATE POLICY notifications_recipient_policy ON notifications
    FOR SELECT
    USING (
        recipient_id::text = current_setting('app.current_user_id', true)
    );

-- Privileged roles can see every notification. Not yet exposed by an
-- endpoint (GET /notifications is intentionally caller-scoped-only for
-- now — see architecture doc Phase 12/13 for the planned aggregate
-- manager/executive views), but the policy is in place so that future
-- work doesn't need another migration just to add it.
CREATE POLICY notifications_privileged_policy ON notifications
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('department_head', 'executive', 'work_admin', 'system_admin')
    );

-- Enrichment visibility mirrors the parent notification.
CREATE POLICY notification_enrichments_recipient_policy ON notification_enrichments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM notifications
            WHERE notifications.id = notification_enrichments.notification_id
              AND notifications.recipient_id::text = current_setting('app.current_user_id', true)
        )
    );

CREATE POLICY notification_enrichments_privileged_policy ON notification_enrichments
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('department_head', 'executive', 'work_admin', 'system_admin')
    );
