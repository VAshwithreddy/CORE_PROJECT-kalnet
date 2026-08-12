from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class NotificationEnrichmentResponse(BaseModel):
    """AI advisory data, if any exists for this notification. Always
    optional and additive — a notification is fully valid, actionable,
    and displayable with this field absent. See architecture doc §7+."""

    importance_score: Optional[int] = Field(None, description="0-100 AI-assisted importance score")
    risk_level: Optional[str] = Field(None, description="AI-assessed risk level (advisory)")
    ai_summary: Optional[str] = Field(None, description="Concise, operational AI summary")
    ai_reason: Optional[str] = Field(None, description="Why this matters, in plain language")
    recommended_action: Optional[str] = Field(None, description="AI-suggested next step (advisory only)")
    escalation_recommended: Optional[bool] = Field(None, description="Whether AI recommends escalation")
    confidence: Optional[float] = Field(None, description="AI confidence, 0.0-1.0")
    model_identifier: Optional[str] = Field(None, description="Model/provider that produced this analysis")
    analysis_timestamp: Optional[datetime] = Field(None, description="When the analysis was generated")

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    """Response model for a notification. Field set matches the real
    `notifications` table exactly — there is no `title`; `message` is the
    single display string, and `action_url` is a real existing column
    used for frontend navigation.

    `severity` is deterministic and always present — set by
    NotificationRulesEngine, never by AI. `enrichment` is the optional AI
    advisory layer (absent when AI enrichment hasn't run or is
    unavailable); the UI must remain fully usable without it. Existing
    notification rows created before this feature will simply have NULL
    for every new field (severity defaults to "info" at the DB level,
    action_url/entity_type/entity_id/dedup_key are nullable) — the API
    and UI must render those the same as any other notification.
    """

    id: UUID
    type: str = Field(..., description="NotificationType value, e.g. WORK_ASSIGNED, BLOCKER_CREATED")
    severity: str = Field(..., description="Deterministic severity: info | warning | critical")
    message: str
    action_url: Optional[str] = Field(None, description="Frontend deep link, if any")

    entity_type: Optional[str] = Field(None, description="What entity_id refers to, e.g. 'assignment'")
    entity_id: Optional[UUID] = None

    is_read: bool
    read_at: Optional[datetime] = None

    requires_acknowledgement: bool
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_id: Optional[UUID] = None

    created_at: datetime

    enrichment: Optional[NotificationEnrichmentResponse] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Envelope for GET /api/v1/notifications — counts save the frontend
    a client-side pass over the full list for its summary metrics, and are
    computed independently of `limit`/`offset` so they always reflect the
    caller's full inbox, not just the current page."""

    items: list[NotificationResponse]
    unread_count: int
    action_required_count: int = Field(..., description="Count where requires_acknowledgement and not yet acknowledged")
    total_count: int = Field(..., description="Total matching notifications, independent of pagination")
    limit: int
    offset: int


class NotificationSweepResponse(BaseModel):
    message: str
    notifications_created: int
    swept_at: datetime
