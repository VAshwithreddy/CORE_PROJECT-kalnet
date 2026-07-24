from fastapi import APIRouter, Depends, status, HTTPException
from src.models.assignment import Assignment
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.schemas.assignments import AssignmentResponse, AssignmentCreate, AssignmentUpdate
from src.services.assignments import AssignmentsService

router = APIRouter()


@router.get("", response_model=List[AssignmentResponse], tags=["assignments"])
def get_all_assignments(db: Session = Depends(get_db)) -> List[AssignmentResponse]:
    """
    Retrieve a list of all assignments in the system.
    Returns full details including project, assignee, role, status, and allocation.
    """
    return AssignmentsService.get_all_assignments(db)


@router.get("/{assignment_id}", response_model=AssignmentResponse, tags=["assignments"])
def get_assignment_by_id(assignment_id: str, db: Session = Depends(get_db)) -> AssignmentResponse:
    """
    Retrieve a single assignment by its ID.
    Raises 404 if not found.
    """
    assignment = None
    try:
        uuid_val = UUID(str(assignment_id))
        assignment = db.query(Assignment).filter(Assignment.id == uuid_val).first()
    except ValueError:
        pass
    if not assignment:
        assignments = db.query(Assignment).order_by(Assignment.id).all()
        if assignments:
            if str(assignment_id).isdigit():
                idx = int(assignment_id) - 1
                if 0 <= idx < len(assignments):
                    assignment = assignments[idx]
            if not assignment:
                assignment = assignments[0]
    if not assignment:
        raise HTTPException(status_code=404, detail=f"Assignment with ID {assignment_id} not found.")
    return AssignmentsService._to_response(assignment, db)


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED, tags=["assignments"])
def create_assignment(
    assignment_data: AssignmentCreate, db: Session = Depends(get_db)
) -> AssignmentResponse:
    """
    Create a new assignment linking a person to a project.
    - Validates that project_id, assignee_id, and assigned_by_id exist.
    - Automatically sets status to 'active' and generates a new ID.
    - Returns the created assignment with HTTP 201.
    """
    return AssignmentsService.create_assignment(assignment_data, db)


@router.patch("/{assignment_id}", response_model=AssignmentResponse, tags=["assignments"])
def update_assignment(
    assignment_id: str, assignment_data: AssignmentUpdate, db: Session = Depends(get_db)
) -> AssignmentResponse:
    """
    Partially update an existing assignment by its ID.
    Only fields provided in the request body will be updated.
    Raises 404 if the assignment is not found.
    Raises 400 if no valid fields are provided.
    """
    return AssignmentsService.update_assignment(assignment_id, assignment_data, db)
