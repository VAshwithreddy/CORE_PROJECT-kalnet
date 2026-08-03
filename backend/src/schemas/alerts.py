from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class AlertResponse(BaseModel):
    """
    Response model for an alert.
    """
    id: UUID = Field(..., description="Unique ID of the alert")
    type: str = Field(..., description="Type of the alert (e.g., stale_assignment)", example="stale_assignment")
    title: str = Field(..., description="Short title of the alert", example="Assignment Stale: Authentication Module")
    description: str = Field(..., description="Detailed description of the alert", example="No status update has been posted in the last 7 days.")
    assignment_id: Optional[UUID] = Field(None, description="Optional associated assignment ID")
    created_at: datetime = Field(..., description="Timestamp of when the alert was generated", example="2026-07-10T08:00:00Z")
    is_dismissed: bool = Field(..., description="Whether the alert has been dismissed by the user", example=False)

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    """
    Request model for updating an alert.
    """
    is_dismissed: bool = Field(..., description="Set to True to dismiss the alert", example=True)

