from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import get_current_user, CurrentUser
from src.schemas.people import PersonCreate, PersonResponse, PersonDetailResponse, PersonOrganizationUpdate
from src.services.people import PeopleService
from src.core.dependencies import require_roles

router = APIRouter()


@router.post("", response_model=PersonDetailResponse, status_code=201, tags=["People"])
def create_person(
    data: PersonCreate,
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(require_roles("system_admin")),
) -> PersonDetailResponse:
    """Create an employee record and make it available for login immediately."""
    return PeopleService.create_person(data, db, current_user)


@router.get("", response_model=List[PersonResponse], tags=["People"])
def get_all_people(
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user)
) -> List[PersonResponse]:
    """
    Retrieve a list of people/employees visible to the caller.
    Returns basic info: id, name, title, and department.
    """
    return PeopleService.get_visible_people(db, current_user)


@router.get("/{person_id}", response_model=PersonDetailResponse, tags=["People"])
def get_person_by_id(
    person_id: str, 
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user)
) -> PersonDetailResponse:
    """
    Retrieve detailed information for a specific person by their ID.
    Returns full profile including email, manager, role, and status.
    Raises 404 if the person is not found.
    Raises 403 if the caller does not have permission to view.
    """
    return PeopleService.get_person_by_id(person_id, db, current_user)


@router.patch("/{person_id}/organization", response_model=PersonDetailResponse, tags=["People"])
def update_person_organization(
    person_id: str,
    update_data: PersonOrganizationUpdate,
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(require_roles("system_admin")),
) -> PersonDetailResponse:
    """Appoint department heads and assign existing staff to their department/team."""
    return PeopleService.update_organization(person_id, update_data, db, current_user)
