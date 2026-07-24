from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import date, datetime


class WeeklyDigestResponse(BaseModel):
    """
    Response model for a weekly digest report.
    """
    id: UUID = Field(..., description="Unique ID of the digest")
    department_id: Optional[UUID] = Field(None, description="ID of the department")
    week_start: date = Field(..., description="Start date of the week")
    week_end: date = Field(..., description="End date of the week")
    summary: str = Field(..., description="AI-generated summary")
    generated_by: str = Field(..., description="Who generated the digest")
    model_version: Optional[str] = Field(None, description="Model used to generate")
    reviewed_by: Optional[UUID] = Field(None, description="Reviewer ID")
    review_status: str = Field(..., description="Review status")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True


class WeeklyDigestRunResponse(BaseModel):
    """
    Response model confirming a weekly digest run was triggered.
    """
    message: str = Field(..., description="Confirmation message", example="Weekly digest generated successfully.")
    digest_id: UUID = Field(..., description="ID of the newly generated digest")
    generated_at: datetime = Field(..., description="Timestamp of generation")
    week_label: str = Field(..., description="Week label for the digest")
