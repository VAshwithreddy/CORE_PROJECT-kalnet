"""
Notifications API router — /api/v1/notifications
"""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.core.dependencies import get_current_user, CurrentUser
from src.schemas.notifications import NotificationResponse, NotificationMarkRead
from src.services.notifications import NotificationsService

router = APIRouter()


@router.get(
    "",
    response_model=List[NotificationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get notifications for the current user",
    tags=["Notifications"],
)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> List[NotificationResponse]:
    """
    Return all notifications addressed to the authenticated user,
    ordered newest-first.

    Falls back to synthetic notifications derived from the user's
    assignments when the notifications table is empty (demo environments).
    """
    return NotificationsService.get_for_user(current_user.person_id, db)


@router.patch(
    "/mark-read",
    status_code=status.HTTP_200_OK,
    summary="Mark notifications as read",
    tags=["Notifications"],
)
def mark_notifications_read(
    body: NotificationMarkRead,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Mark one or more notifications as read.
    Only updates notifications that belong to the authenticated user.
    Returns the count of updated records.
    """
    updated = NotificationsService.mark_read(current_user.person_id, body.ids, db)
    return {"updated": updated}
