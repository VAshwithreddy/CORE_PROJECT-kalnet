from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.schemas.status_updates import StatusUpdateResponse, StatusUpdateCreate
from src.services.status_updates import StatusUpdatesService
from uuid import UUID

router = APIRouter()


@router.post(
    "/{assignment_id}/status-updates",
    response_model=StatusUpdateResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["status updates"]
)
def create_status_update(
    assignment_id: str, 
    update_data: StatusUpdateCreate,
    db: Session = Depends(get_db)
) -> StatusUpdateResponse:
    """
    Post a new status update for a specific assignment.
    - Validates that the assignment_id exists.
    - Validates that the author_id exists.
    - Status can be: on_track, at_risk, blocked, or completed.
    - If status is 'blocked', include a description in the 'blockers' field.
    - Returns the created status update with HTTP 201.
    """
    return StatusUpdatesService.create_status_update(assignment_id, update_data, db)
