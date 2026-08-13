import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.core.database import Base


class NotificationEnrichment(Base):
    """Maps to the `notification_enrichments` table in Supabase PostgreSQL.

    Layer B — AI Notification Intelligence. Optional 1:1 companion row for
    a Notification, written by the (not-yet-implemented) AI enrichment
    service in a later phase — see
    docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md §"Phased implementation
    plan", Phase 7+.

    A separate table rather than columns bolted onto `notifications` (per
    the architecture doc's DATABASE DESIGN guidance):
      - keeps the guaranteed Layer A write (Notification) free of any
        column that could tempt future code into gating it on AI output
      - a missing row IS the "AI unavailable / not yet analyzed" state —
        no sentinel values needed
      - this table is fully unpopulated until Phase 7+ builds the writer;
        no existing behavior depends on it

    All fields are advisory. Nothing here may be treated as ground truth,
    override `Notification.severity`, or drive escalation without passing
    through the deterministic guardrails described in the architecture doc.
    """

    __tablename__ = "notification_enrichments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    notification_id = Column(
        UUID(as_uuid=True),
        ForeignKey("notifications.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Structured AI output — validated, clamped, and enum-checked server-side
    # before being written here. Never raw/unvalidated model output. See
    # architecture doc §"Structured AI output only".
    importance_score = Column(Integer, nullable=True)     # 0-100, clamped
    risk_level = Column(String, nullable=True)             # RiskLevel value
    ai_summary = Column(Text, nullable=True)                # short, operational — not chatbot prose
    ai_reason = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    escalation_recommended = Column(Boolean, nullable=True)
    confidence = Column(Numeric(3, 2), nullable=True)      # 0.00-1.00

    # Explainability / auditability (architecture doc §23) — concise
    # business-facing fields only. No hidden chain-of-thought is ever stored.
    model_identifier = Column(String, nullable=True)
    context_fingerprint = Column(String, nullable=True)    # cache/dedup key for identical-state re-analysis
    analysis_timestamp = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    notification = relationship("Notification", back_populates="enrichment", lazy="select")
