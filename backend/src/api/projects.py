from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from typing import List
from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import get_current_user, CurrentUser, require_roles
from src.core.rbac import PRIVILEGED_ROLES, MANAGER_ROLES
from src.models.person import Person
from src.schemas.projects import ProjectResponse, ProjectCreate, ProjectUpdate
from src.services.projects import ProjectsService

router = APIRouter()


@router.get("", response_model=List[ProjectResponse], tags=["Projects"])
def get_all_projects(
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user)
) -> List[ProjectResponse]:
    """
    Retrieve a list of all projects visible to the user.
    """
    return ProjectsService.get_visible_projects(db, current_user)


@router.get("/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def get_project_by_id(
    project_id: str, 
    db: Session = Depends(get_rls_db_for(get_current_user)),
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
    tags=["Projects"],
)
def create_project(
    project_data: ProjectCreate, 
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
) -> ProjectResponse:
    """
    Create a new project.
    Department leaders can create projects for their own department.
    """
    if current_user.role not in {"system_admin", "work_admin", "department_head"}:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient privileges to create projects.")

    if current_user.role == "department_head":
        caller = db.query(Person).filter(Person.id == current_user.person_id).first()
        if not caller or not caller.department_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Your account is not assigned to a department.")
        # The backend, not the browser, determines the department for non-admins.
        project_data.department_id = caller.department_id

    return ProjectsService.create_project(project_data, db)


@router.patch("/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def update_project(
    project_id: str, 
    project_data: ProjectUpdate, 
    db: Session = Depends(get_rls_db_for(get_current_user)),
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
