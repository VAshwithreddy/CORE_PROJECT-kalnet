from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class NotificationResponse(BaseModel):
    """
    Response model for a single notification.
    Matches the shape expected by the frontend NotificationItem type.
    """
    id: UUID = Field(..., description="Unique ID of the notification")
    type: str = Field(..., description="Notification type, e.g. 'info', 'alert', 'warning', 'success'")
    title: str = Field(..., description="Short heading for the notification")
    message: Optional[str] = Field(None, description="Full body text of the notification")
    isRead: bool = Field(..., description="Whether the notification has been read")
    timestamp: str = Field(..., description="ISO-8601 creation timestamp")
    actionUrl: Optional[str] = Field(None, description="Optional deep-link URL")
    actionLabel: Optional[str] = Field(None, description="Label for the action link")
    actionRequired: bool = Field(False, description="Whether this notification requires user action")

    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    """Request body to mark one or more notifications as read."""
    ids: list[UUID] = Field(..., description="List of notification IDs to mark as read")
