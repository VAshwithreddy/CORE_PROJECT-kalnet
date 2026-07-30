from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import get_current_user, CurrentUser
from src.schemas.people import PersonResponse, PersonDetailResponse
from src.services.people import PeopleService

router = APIRouter()


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
