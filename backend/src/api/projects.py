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
    dependencies=[Depends(require_roles(*PRIVILEGED_ROLES))]
)
def create_project(
    project_data: ProjectCreate, 
    db: Session = Depends(get_rls_db_for(get_current_user))
) -> ProjectResponse:
    """
    Create a new project.
    Only privileged roles can perform this action.
    """
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
