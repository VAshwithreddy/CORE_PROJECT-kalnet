from sqlalchemy import inspect

from src.models.notification import Notification
from src.models.notification_enrichment import NotificationEnrichment


def test_notification_model_has_layer_a_columns():
    columns = {c.name for c in inspect(Notification).columns}
    assert {
        "id",
        "recipient_id",
        "type",
        "message",
        "action_url",
        "is_read",
        "read_at",
        "created_at",
        "severity",
        "entity_type",
        "entity_id",
        "requires_acknowledgement",
        "acknowledged_at",
        "acknowledged_by_id",
        "dedup_key",
    }.issubset(columns)


def test_notification_enrichment_model_has_layer_b_columns():
    """Schema exists now (Phase 3); nothing writes to this table until the
    AI enrichment service is built in a later phase — see
    docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md."""
    columns = {c.name for c in inspect(NotificationEnrichment).columns}
    assert {
        "id",
        "notification_id",
        "importance_score",
        "risk_level",
        "ai_summary",
        "ai_reason",
        "recommended_action",
        "escalation_recommended",
        "confidence",
        "model_identifier",
        "context_fingerprint",
        "analysis_timestamp",
        "created_at",
    }.issubset(columns)


def test_notification_enrichment_is_one_to_one_via_unique_notification_id():
    column = inspect(NotificationEnrichment).columns["notification_id"]
    assert column.unique is True
    assert column.nullable is False
