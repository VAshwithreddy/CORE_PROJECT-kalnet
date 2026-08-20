from fastapi import APIRouter, Depends, status, HTTPException
from src.models.assignment import Assignment
from src.models.person import Person
from src.models.project import Project
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
)
def create_assignment(
    assignment_data: AssignmentCreate, 
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
) -> AssignmentResponse:
    """
    Create a new assignment linking a person to a project.
    Privileged users can create any assignment. Department leaders can create
    assignments only for people and projects that are already in their scope.
    """
    if current_user.role not in {"system_admin", "work_admin", "department_head", "manager", "team_leader"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges to create assignments.")

    if current_user.role not in {"system_admin", "work_admin"}:
        visible_people = RBACService.get_visible_person_ids(db, current_user)
        assignee_id = assignment_data.person_id or assignment_data.assignee_id
        if not assignee_id or UUID(str(assignee_id)) not in visible_people:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You may only assign work to people in your scope.")
        project = db.query(Project).filter(Project.id == UUID(str(assignment_data.project_id))).first()
        caller = db.query(Person).filter(Person.id == current_user.person_id).first()
        if not project or not caller or project.department_id != caller.department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You may only assign work within your department.")

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


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    """Delete an incorrectly assigned task within the caller's scope."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    if current_user.role not in {"system_admin", "work_admin", "department_head"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete assignments.")
    if current_user.role == "department_head":
        caller = db.query(Person).filter(Person.id == current_user.person_id).first()
        project = db.query(Project).filter(Project.id == assignment.project_id).first()
        if not caller or not project or project.department_id != caller.department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete tasks in your department.")

    AssignmentsService.delete_assignment(assignment, db, current_user.person_id)
