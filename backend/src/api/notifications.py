from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import CurrentUser, get_current_user, require_roles
from src.models.notification import Notification
from src.schemas.notifications import (
    NotificationListResponse,
    NotificationResponse,
    NotificationSweepResponse,
)
from src.services.notifications import NotificationService
from src.services.notification_intelligence import NotificationIntelligenceService

router = APIRouter()


def _list_response(
    db: Session, current_user: CurrentUser, *, unread_only: bool, limit: int, offset: int
) -> NotificationListResponse:
    """Shared by GET /notifications and GET /notifications/unread so the
    two endpoints can never drift out of sync with each other."""
    items = NotificationService.list_for_recipient(
        db, current_user.person_id, unread_only=unread_only, limit=limit, offset=offset
    )
    total_count = NotificationService.count_for_recipient(db, current_user.person_id, unread_only=unread_only)
    unread_count = NotificationService.count_for_recipient(db, current_user.person_id, unread_only=True)
    action_required_count = NotificationService.count_action_required(db, current_user.person_id)

    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items],
        unread_count=unread_count,
        action_required_count=action_required_count,
        total_count=total_count,
        limit=limit,
        offset=offset,
    )


@router.get(
    "",
    response_model=NotificationListResponse,
    status_code=status.HTTP_200_OK,
    tags=["notifications"],
)
def get_my_notifications(
    unread_only: bool = Query(False, description="Return only unread notifications"),
    limit: int = Query(50, ge=1, le=200, description="Max notifications to return"),
    offset: int = Query(0, ge=0, description="Number of notifications to skip"),
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
) -> NotificationListResponse:
    """
    Retrieve notifications for the current user (own inbox only), paginated.

    Every recipient sees only their own notifications — there is no
    "view someone else's inbox" mode in this endpoint, and no
    recipient/person_id parameter is accepted; the recipient is always
    the authenticated caller (`current_user.person_id` from the verified
    JWT), never a client-supplied value. Manager/executive aggregate
    views are a separate, not-yet-built capability (see
    docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md, Phase 12/13).

    `unread_count` and `action_required_count` reflect the caller's
    *entire* inbox, independent of `limit`/`offset` — they are computed
    with their own count queries, not derived from the current page.
    """
    return _list_response(db, current_user, unread_only=unread_only, limit=limit, offset=offset)


@router.get(
    "/unread",
    response_model=NotificationListResponse,
    status_code=status.HTTP_200_OK,
    tags=["notifications"],
)
def get_my_unread_notifications(
    limit: int = Query(50, ge=1, le=200, description="Max notifications to return"),
    offset: int = Query(0, ge=0, description="Number of notifications to skip"),
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
) -> NotificationListResponse:
    """Convenience alias for `GET /notifications?unread_only=true` — same
    caller-scoping and count semantics, just a dedicated path."""
    return _list_response(db, current_user, unread_only=True, limit=limit, offset=offset)


@router.post(
    "/read-all",
    status_code=status.HTTP_200_OK,
    tags=["notifications"],
)
def mark_all_notifications_read(
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    """Mark every unread notification belonging to the current user as read."""
    updated = NotificationService.mark_all_read(db, current_user.person_id)
    return {"message": f"{updated} notification(s) marked as read.", "updated_count": updated}


@router.post(
    "/sweep",
    response_model=NotificationSweepResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["notifications"],
    dependencies=[Depends(require_roles("work_admin", "system_admin"))],
)
def run_notification_sweep(db: Session = Depends(get_db)) -> NotificationSweepResponse:
    """
    Evaluate every open assignment for DEADLINE_APPROACHING, WORK_OVERDUE,
    and ESCALATION_REQUIRED, and create any guaranteed notifications that
    are due. Idempotent within the same calendar day — see
    NotificationRulesEngine.sweep_deadlines_and_overdue's day-scoped
    dedup_key; running this twice in a row creates zero additional rows
    the second time.

    CORE has no in-process scheduler — this endpoint is the integration
    point for an external scheduler (e.g. a periodic cron job or CI
    schedule) to call. Restricted to work_admin / system_admin.
    """
    created = NotificationService.run_sweep(db)
    return NotificationSweepResponse(
        message=f"Sweep complete. {created} notification(s) created.",
        notifications_created=created,
        swept_at=datetime.now(timezone.utc),
    )


@router.post(
    "/{notification_id}/enrich",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
    tags=["notifications"],
)
def enrich_notification(
    notification_id: UUID,
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
) -> NotificationResponse:
    """
    Best-effort AI enrichment for one of the caller's own notifications.
    Always returns 200 with the notification whether or not enrichment
    was actually produced (AI disabled / unavailable / low-value output
    all just mean `enrichment` stays null).
    """
    row = db.query(Notification).filter(Notification.id == notification_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    if row.recipient_id != current_user.person_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only enrich your own notifications.")

    NotificationIntelligenceService.analyze_notification(db, row)
    db.refresh(row)
    return NotificationResponse.model_validate(row)


@router.post(
    "/enrich-pending",
    status_code=status.HTTP_200_OK,
    tags=["notifications"],
    dependencies=[Depends(require_roles("work_admin", "system_admin"))],
)
def enrich_pending_notifications(db: Session = Depends(get_db)) -> dict:
    """
    Batch AI enrichment for notifications that don't have one yet.
    Restricted to work_admin / system_admin.
    """
    enriched = NotificationIntelligenceService.enrich_pending(db)
    return {"message": f"Enriched {enriched} notification(s).", "enriched_count": enriched}


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
    tags=["notifications"],
)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
) -> NotificationResponse:
    """Mark a single notification as read. A user may only mark their own."""
    row = NotificationService.mark_read(db, notification_id, actor_person_id=current_user.person_id)
    return NotificationResponse.model_validate(row)


@router.post(
    "/{notification_id}/acknowledge",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
    tags=["notifications"],
)
def acknowledge_notification(
    notification_id: UUID,
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
) -> NotificationResponse:
    """
    Acknowledge a notification that requires it (e.g. a CRITICAL_BLOCKER
    or ESCALATION_REQUIRED alert). Raises 400 if the notification doesn't
    require acknowledgement, 403 if it isn't the caller's own, 404 if it
    doesn't exist.
    """
    row = NotificationService.acknowledge(db, notification_id, actor_person_id=current_user.person_id)
    return NotificationResponse.model_validate(row)
