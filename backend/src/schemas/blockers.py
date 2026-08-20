from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class BlockerResponse(BaseModel):
    assignment_id: UUID
    project_id: UUID
    project_name: str
    owner_id: UUID
    owner_name: str
    department_id: UUID | None = None
    title: str
    reason: str
    blocked_at: datetime
    days_blocked: int
    severity: str


class BlockerResolveRequest(BaseModel):
    note: str = "Blocker resolved."
