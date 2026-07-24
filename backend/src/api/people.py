from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.schemas.people import PersonResponse, PersonDetailResponse
from src.services.people import PeopleService

router = APIRouter()


@router.get("", response_model=List[PersonResponse], tags=["People"])
def get_all_people(db: Session = Depends(get_db)) -> List[PersonResponse]:
    """
    Retrieve a list of all people/employees in the system.
    Returns basic info: id, name, title, and department.
    """
    return PeopleService.get_all_people(db)


@router.get("/{person_id}", response_model=PersonDetailResponse, tags=["People"])
def get_person_by_id(
    person_id: str, db: Session = Depends(get_db)
) -> PersonDetailResponse:
    """
    Retrieve detailed information for a specific person by their ID.
    Returns full profile including email, manager, role, and status.
    Raises 404 if the person is not found.
    """
    return PeopleService.get_person_by_id(person_id, db)
