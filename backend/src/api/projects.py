from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from typing import List
from src.core.database import get_db
from src.schemas.projects import ProjectResponse, ProjectCreate, ProjectUpdate
from src.services.projects import ProjectsService

router = APIRouter()


@router.get("", response_model=List[ProjectResponse], tags=["Projects"])
def get_all_projects(db: Session = Depends(get_db)) -> List[ProjectResponse]:
    """
    Retrieve a list of all projects in the system.
    Returns full project details including status, priority, owner, and dates.
    """
    return ProjectsService.get_all_projects(db)


@router.get("/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def get_project_by_id(
    project_id: str, db: Session = Depends(get_db)
) -> ProjectResponse:
    """
    Retrieve a single project by its ID.
    Raises 404 if not found.
    """
    return ProjectsService.get_project_by_id(project_id, db)



@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Projects"],
)
def create_project(
    project_data: ProjectCreate, db: Session = Depends(get_db)
) -> ProjectResponse:
    """
    Create a new project.
    - Validates that the department_id and owner_id exist.
    - Automatically sets status to 'planning'.
    - Returns the created project with HTTP 201.
    """
    return ProjectsService.create_project(project_data, db)


@router.patch("/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def update_project(
    project_id: str, project_data: ProjectUpdate, db: Session = Depends(get_db)
) -> ProjectResponse:
    """
    Partially update an existing project by its ID.
    Only fields provided in the request body will be updated.
    Raises 404 if the project is not found.
    Raises 400 if no valid fields are provided.
    """
    return ProjectsService.update_project(project_id, project_data, db)
