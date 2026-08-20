-- Repair older notification tables without modifying existing notification data.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS requires_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS acknowledged_by_id UUID REFERENCES people(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dedup_key TEXT;
CREATE INDEX IF NOT EXISTS ix_notifications_recipient_created ON notifications (recipient_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_dedup_key ON notifications (dedup_key) WHERE dedup_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS notification_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL UNIQUE REFERENCES notifications(id),
  importance_score INTEGER,
  risk_level TEXT,
  ai_summary TEXT,
  ai_reason TEXT,
  recommended_action TEXT,
  escalation_recommended BOOLEAN,
  confidence NUMERIC(3, 2),
  model_identifier TEXT,
  context_fingerprint TEXT,
  analysis_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
