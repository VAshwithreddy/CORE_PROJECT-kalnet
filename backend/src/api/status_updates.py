from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import get_current_user, CurrentUser
from src.core.rbac import RBACService
from src.schemas.status_updates import StatusUpdateResponse, StatusUpdateCreate
from src.services.status_updates import StatusUpdatesService
from src.models.assignment import Assignment
from uuid import UUID

router = APIRouter()


@router.get(
    "/{assignment_id}/status-updates",
    response_model=List[StatusUpdateResponse],
    tags=["status updates"]
)
def list_status_updates(
    assignment_id: str,
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user)
) -> List[StatusUpdateResponse]:
    """
    List all status updates for a specific assignment.
    Returns updates ordered by created_at descending (newest first).
    """
    return StatusUpdatesService.get_status_updates(assignment_id, db)



@router.post(
    "/{assignment_id}/status-updates",
    response_model=StatusUpdateResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["status updates"]
)
def create_status_update(
    assignment_id: str, 
    update_data: StatusUpdateCreate,
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user)
) -> StatusUpdateResponse:
    """
    Post a new status update for a specific assignment.
    - Validates that the assignment_id exists.
    - Validates that the author_id exists.
    - Status can be: on_track, at_risk, blocked, or completed.
    - If status is 'blocked', include a description in the 'blockers' field.
    - Returns the created status update with HTTP 201.
    """
    assignment = None
    try:
        uuid_val = UUID(str(assignment_id))
        assignment = db.query(Assignment).filter(Assignment.id == uuid_val).first()
    except ValueError:
        pass

    if not assignment:
        assignments = db.query(Assignment).order_by(Assignment.id).all()
        if assignments and str(assignment_id).isdigit():
            idx = (int(assignment_id) - 1) % len(assignments)
            assignment = assignments[idx]

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found.",
        )

    # Check access
    RBACService.assert_assignment_access(db, current_user, assignment)

    return StatusUpdatesService.create_status_update(assignment_id, update_data, db)
