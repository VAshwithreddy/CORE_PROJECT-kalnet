from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.schemas.departments import DepartmentResponse, DepartmentDetailResponse
from src.services.departments import DepartmentsService

router = APIRouter()


@router.get("", response_model=List[DepartmentResponse], tags=["Departments"])
def get_all_departments(db: Session = Depends(get_db)) -> List[DepartmentResponse]:
    """
    Retrieve a list of all departments in the organization.
    Returns basic info: id, name, member count, and status.
    """
    return DepartmentsService.get_all_departments(db)


@router.get("/{department_id}", response_model=DepartmentDetailResponse, tags=["Departments"])
def get_department_by_id(
    department_id: str, db: Session = Depends(get_db)
) -> DepartmentDetailResponse:
    """
    Retrieve detailed information for a specific department by its ID.
    Returns full details including description and department head info.
    Raises 404 if the department is not found.
    """
    return DepartmentsService.get_department_by_id(department_id, db)
