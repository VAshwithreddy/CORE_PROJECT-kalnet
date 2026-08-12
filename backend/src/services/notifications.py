"""
Notifications service.

Fetches notifications for the authenticated user from the `notifications` table.
If the table is empty (e.g. fresh demo environment), falls back to generating
synthetic notifications derived from the user's assignments so the page always
shows useful content.
"""
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from src.models.notification import Notification
from src.models.assignment import Assignment
from src.schemas.notifications import NotificationResponse

# Map DB `type` values (free text) to the four values the frontend expects
_TYPE_MAP = {
    "assignment_created": "info",
    "assignment_updated": "info",
    "status_blocked":     "alert",
    "status_stale":       "warning",
    "approval_required":  "alert",
    "approved":           "success",
    "rejected":           "alert",
    "digest":             "info",
}


def _map_type(raw: str) -> str:
    return _TYPE_MAP.get(raw.lower(), "info")


class NotificationsService:

    @staticmethod
    def get_for_user(person_id: UUID, db: Session) -> List[NotificationResponse]:
        """
        Return all notifications addressed to *person_id*, newest first.

        Falls back to synthetic notifications when:
        - The notifications table is empty for this user, OR
        - The schema is stale (missing columns) and raises a DB error.
          Run migration 005_patch_notifications_columns.sql to fix permanently.
        """
        try:
            rows: List[Notification] = (
                db.query(Notification)
                .filter(Notification.recipient_id == person_id)
                .order_by(Notification.created_at.desc())
                .all()
            )
            if rows:
                return [NotificationsService._to_response(n) for n in rows]
        except Exception:
            # Schema is stale (e.g. title column missing before migration 005).
            # Roll back the failed transaction so the session stays usable.
            db.rollback()

        # ── Synthetic fallback ────────────────────────────────────────────────
        return NotificationsService._synthetic(person_id, db)

    @staticmethod
    def mark_read(person_id: UUID, ids: List[UUID], db: Session) -> int:
        """
        Mark the given notification IDs as read for *person_id*.
        Returns the number of rows updated.
        """
        updated = (
            db.query(Notification)
            .filter(
                Notification.recipient_id == person_id,
                Notification.id.in_(ids),
            )
            .update({"is_read": True}, synchronize_session="fetch")
        )
        db.commit()
        return updated

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _to_response(n: Notification) -> NotificationResponse:
        ts = n.created_at
        if ts is None:
            ts = datetime.now(timezone.utc)
        timestamp = ts.isoformat() if isinstance(ts, datetime) else str(ts)

        action_url = getattr(n, "action_url", None)
        return NotificationResponse(
            id=n.id,
            type=_map_type(n.type),
            title=n.title,
            message=n.message or "",
            isRead=n.is_read,
            timestamp=timestamp,
            actionUrl=action_url,
            actionRequired=n.type in ("approval_required", "status_blocked"),
        )

    @staticmethod
    def _synthetic(person_id: UUID, db: Session) -> List[NotificationResponse]:
        """
        Generate demo notifications from the user's assignments so the
        Notifications page always renders meaningfully in a fresh environment.
        """
        assignments: List[Assignment] = (
            db.query(Assignment)
            .filter(Assignment.person_id == person_id)
            .limit(8)
            .all()
        )

        items: List[NotificationResponse] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for i, a in enumerate(assignments):
            status = a.status.value if hasattr(a.status, "value") else str(a.status)
            title_str = getattr(a, "title", None) or f"Assignment #{str(a.id)[:8]}"

            if status == "blocked":
                notif_type = "alert"
                title = f"Blocker raised on: {title_str}"
                message = "This assignment has been marked as blocked and needs your attention."
                action_required = True
            elif status == "in_progress":
                notif_type = "info"
                title = f"Update due: {title_str}"
                message = "Please post a status update — your last one was over 7 days ago."
                action_required = False
            elif status == "done":
                notif_type = "success"
                title = f"Assignment completed: {title_str}"
                message = "Great work! This assignment has been marked as complete."
                action_required = False
            else:
                notif_type = "info"
                title = f"Assignment created: {title_str}"
                message = "You have been assigned to a new task. Review the details and begin when ready."
                action_required = False

            items.append(
                NotificationResponse(
                    id=a.id,          # reuse assignment UUID for stable demo IDs
                    type=notif_type,
                    title=title,
                    message=message,
                    isRead=(i % 3 != 0),   # mix of read / unread
                    timestamp=now_iso,
                    actionRequired=action_required,
                )
            )

        if not items:
            # Absolute fallback — one generic welcome notification
            import uuid
            items.append(
                NotificationResponse(
                    id=uuid.uuid4(),
                    type="info",
                    title="Welcome to CORE",
                    message="Your workspace is set up and ready. Check your assignments to get started.",
                    isRead=False,
                    timestamp=now_iso,
                    actionRequired=False,
                )
            )

        return items
