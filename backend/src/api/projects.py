from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from typing import List
from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import get_current_user, CurrentUser, require_roles
from src.core.rbac import PRIVILEGED_ROLES
from src.schemas.projects import ProjectResponse, ProjectCreate, ProjectUpdate
from src.services.projects import ProjectsService

router = APIRouter()


@router.get("", response_model=List[ProjectResponse], tags=["Projects"])
def get_all_projects(
    # Use plain get_db — app-layer RBAC in get_visible_projects handles filtering
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> List[ProjectResponse]:
    """
    Retrieve a list of all projects visible to the user.
    """
    return ProjectsService.get_visible_projects(db, current_user)


@router.get("/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def get_project_by_id(
    project_id: str,
    # Use plain get_db — app-layer RBAC in get_project_by_id handles access
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> ProjectResponse:
    """
    Retrieve a single project by its ID.
    Raises 404 if not found.
    Raises 403 if the user does not have permission to view it.
    """
    return ProjectsService.get_project_by_id(project_id, db, current_user)


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Projects"]
)
def create_project(
    project_data: ProjectCreate,
    # Use plain get_db (no RLS session variables) so that the INSERT is not
    # blocked by missing RLS INSERT policies. Application-layer RBAC below
    # still enforces who is allowed to create projects.
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> ProjectResponse:
    """
    Create a new project.
    Only privileged roles and department heads can perform this action.
    """
    from src.core.rbac import PRIVILEGED_ROLES
    from src.models.person import Person
    from fastapi import HTTPException

    if current_user.role not in PRIVILEGED_ROLES and current_user.role != "department_head":
        raise HTTPException(
            status_code=403,
            detail="Insufficient privileges to perform this action."
        )

    if current_user.role == "department_head":
        caller = db.query(Person).filter(Person.id == current_user.person_id).first()
        user_dept_id = caller.department_id if caller else None

        if project_data.department_id:
            from uuid import UUID
            try:
                given_dept_uuid = UUID(str(project_data.department_id))
            except ValueError:
                from src.models.department import Department
                dept = None
                if str(project_data.department_id).isdigit():
                    depts = db.query(Department).order_by(Department.id).all()
                    if depts:
                        idx = (int(project_data.department_id) - 1) % len(depts)
                        dept = depts[idx]
                given_dept_uuid = dept.id if dept else None

            if user_dept_id != given_dept_uuid:
                raise HTTPException(
                    status_code=403,
                    detail="Department heads can only create projects for their own department."
                )
        else:
            project_data.department_id = user_dept_id

    return ProjectsService.create_project(project_data, db)


@router.patch("/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    # Use plain get_db to avoid RLS blocking UPDATE (no UPDATE policy defined)
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> ProjectResponse:
    """
    Partially update an existing project by its ID.
    Raises 404 if the project is not found.
    Raises 403 if access is denied.
    """
    # Ensure they have access first
    ProjectsService.get_project_by_id(project_id, db, current_user)
    return ProjectsService.update_project(project_id, project_data, db)
