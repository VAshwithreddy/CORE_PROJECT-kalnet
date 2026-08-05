from uuid import UUID
from datetime import date, datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field


class ProjectResponse(BaseModel):
    id: UUID
    name: str

    department_id: UUID
    department_name: Optional[str] = None

    owner_id: Optional[UUID] = None
    owner_name: Optional[str] = None

    priority: str
    status: str

    target_date: Optional[date] = None

    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_")

    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

    department_id: Optional[Any] = None

    owner_id: Optional[Any] = None

    priority: Optional[str] = "medium"

    status: Optional[str] = "planning"

    start_date: Optional[date] = None
    due_date: Optional[date] = None
    target_date: Optional[date] = None

    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

    class Config:
        populate_by_name = True


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

    department_id: Optional[Any] = None

    owner_id: Optional[Any] = None

    priority: Optional[str] = None

    status: Optional[str] = None

    start_date: Optional[date] = None
    due_date: Optional[date] = None
    target_date: Optional[date] = None

    metadata: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True
