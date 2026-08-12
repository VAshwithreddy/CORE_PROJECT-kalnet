from uuid import UUID
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class AssignmentResponse(BaseModel):
    id: UUID

    person_id: UUID
    person_name: Optional[str] = None

    project_id: UUID
    project_name: Optional[str] = None

    role: str
    status: str

    start_date: date
    end_date: Optional[date] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


from typing import Optional, Any, Annotated
from pydantic import BaseModel, Field

class AssignmentCreate(BaseModel):
    project_id: Any
    person_id: Optional[Any] = None
    assignee_id: Optional[Any] = None
    assigned_by_id: Optional[Any] = None

    role: Optional[str] = "developer"
    status: Optional[str] = "active"
    allocation_percent: Optional[int] = 100

    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class AssignmentUpdate(BaseModel):
    person_id: Optional[Any] = None
    role: Optional[str] = None
    status: Optional[str] = None
    allocation_percent: Optional[int] = None

    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

    class Config:
        populate_by_name = True
