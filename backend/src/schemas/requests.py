from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class WorkRequestCreate(BaseModel):
    type: str = Field(..., min_length=2, max_length=80)
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=3, max_length=4000)


class WorkRequestUpdate(BaseModel):
    status: Optional[str] = None
    department_id: Optional[UUID] = None
    assignee_id: Optional[UUID] = None


class WorkRequestResponse(BaseModel):
    id: UUID
    type: str
    title: str
    description: str
    status: str
    requester_id: UUID
    requester_name: str
    department_id: Optional[UUID] = None
    department_name: Optional[str] = None
    assignee_id: Optional[UUID] = None
    assignee_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
