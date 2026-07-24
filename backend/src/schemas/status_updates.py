from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from uuid import UUID


class UpdateStatus(str, Enum):
    """Valid progress statuses for a status update."""
    on_track = "on_track"
    at_risk = "at_risk"
    blocked = "blocked"
    completed = "completed"


class StatusUpdateResponse(BaseModel):
    """
    Response model for a status update entry on an assignment.
    """
    id: UUID = Field(..., description="Unique ID of the status update")
    assignment_id: UUID = Field(..., description="ID of the related assignment")
    author_id: UUID = Field(..., description="ID of the person who submitted the update")
    author_name: str = Field(..., description="Full name of the author", example="Alice Smith")
    status: UpdateStatus = Field(..., description="Current progress status", example="on_track")
    message: str = Field(..., description="Update message describing progress", example="Completed authentication module.")
    blockers: Optional[str] = Field(None, description="Description of any blockers", example="Waiting for API spec.")
    created_at: str = Field(..., description="Timestamp when the update was submitted", example="2026-07-01T09:30:00")


from typing import Optional, Any

class StatusUpdateCreate(BaseModel):
    """
    Request model for posting a new status update on an assignment.
    """
    author_id: Any = Field(..., description="ID of the person submitting the update")
    status: UpdateStatus = Field(..., description="Current progress status", example="on_track")
    message: str = Field(..., min_length=1, max_length=1000, description="Update message", example="Completed the authentication module. Starting on projects API next.")
    blockers: Optional[str] = Field(None, max_length=500, description="Description of any blockers (if status is 'blocked')", example="Waiting for the API spec from the product team.")

