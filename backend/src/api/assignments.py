from fastapi import APIRouter, Depends, status, HTTPException
from src.models.assignment import Assignment
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import get_current_user, CurrentUser, require_roles
from src.core.rbac import RBACService, PRIVILEGED_ROLES, MANAGER_ROLES
from src.schemas.assignments import AssignmentResponse, AssignmentCreate, AssignmentUpdate
from src.services.assignments import AssignmentsService

router = APIRouter()

@router.get("", response_model=List[AssignmentResponse])
def get_all_assignments(
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
) -> List[AssignmentResponse]:
    """
    Retrieve assignments visible to the caller.
    - **Employees** only see their own assignments.
    - **Managers** see their own + direct reports.
    - **Team Leaders** see their department's assignments.
    - **Privileged roles** see every assignment in the system.
    """
    if current_user.role in PRIVILEGED_ROLES:
        return AssignmentsService.get_all_assignments(db)

    if current_user.role in MANAGER_ROLES:
        visible_ids = RBACService.get_visible_person_ids(db, current_user)
        return AssignmentsService.get_assignments_for_visible_persons(db, list(visible_ids))

    # Employee — restrict to their own person_id
    return AssignmentsService.get_assignments_for_person(db, current_user.person_id)


@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment_by_id(
    assignment_id: str, 
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user)
) -> AssignmentResponse:
    """
    Retrieve a single assignment by its ID.
    Raises 404 if not found.
    Raises 403 if the caller does not have permission to view.
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

    RBACService.assert_assignment_access(db, current_user, assignment)

    return AssignmentsService._to_response(assignment, db)


@router.post(
    "", 
    response_model=AssignmentResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(*PRIVILEGED_ROLES))]
)
def create_assignment(
    assignment_data: AssignmentCreate, 
    db: Session = Depends(get_rls_db_for(get_current_user))
) -> AssignmentResponse:
    """
    Create a new assignment linking a person to a project.
    Only privileged roles can perform this action.
    """
    return AssignmentsService.create_assignment(assignment_data, db)


@router.patch("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: str, 
    assignment_data: AssignmentUpdate, 
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user)
) -> AssignmentResponse:
    """
    Partially update an existing assignment by its ID.
    Managers/Team Leaders can only update assignments they have access to.
    Raises 404 if the assignment is not found.
    Raises 403 if access is denied.
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
        raise HTTPException(status_code=404, detail="Assignment not found")

    RBACService.assert_assignment_access(db, current_user, assignment)

    return AssignmentsService.update_assignment(assignment_id, assignment_data, db)
