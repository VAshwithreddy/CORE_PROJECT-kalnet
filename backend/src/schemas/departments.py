from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field


class DepartmentResponse(BaseModel):
    """
    Response model for listing departments.
    Matches the Supabase departments table.
    """

    id: UUID = Field(..., description="Department UUID")
    name: str = Field(..., description="Department name")
    member_count: int = Field(..., description="Number of people in this department")

    class Config:
        from_attributes = True


class DepartmentDetailResponse(BaseModel):
    """
    Response model for a single department.
    """

    id: UUID = Field(..., description="Department UUID")
    name: str = Field(..., description="Department name")
    description: Optional[str] = Field(
        default=None,
        description="Department description"
    )
    head_person_id: Optional[UUID] = Field(
        default=None,
        description="Department Head UUID"
    )
    head_name: Optional[str] = Field(
        default=None,
        description="Department Head Name"
    )
    member_count: int = Field(
        default=0,
        description="Number of department members"
    )

    class Config:
        from_attributes = True