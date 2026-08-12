from typing import List
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.models.person import Person
from src.models.department import Department
from src.schemas.people import PersonResponse, PersonDetailResponse
from src.core.rbac import RBACService
from src.core.dependencies import CurrentUser


class PeopleService:
    """Service layer for the People module — backed by Supabase PostgreSQL."""

    @staticmethod
    def get_visible_people(db: Session, current_user: CurrentUser) -> List[PersonResponse]:
        """
        Returns a list of all people visible to the current user.
        Resolves department_name via a join.
        """
        visible_ids = RBACService.get_visible_person_ids(db, current_user)
        people = db.query(Person).filter(Person.id.in_(visible_ids)).all()
        result = []
        for person in people:
            dept_name = ""
            if person.department_id:
                dept = db.query(Department).filter(Department.id == person.department_id).first()
                dept_name = dept.name if dept else ""
            result.append(
                PersonResponse(
                    id=person.id,
                    full_name=person.full_name or "",
                    job_title=person.job_title or "",
                    department_name=dept_name,
                    department_id=person.department_id,
                    role=person.role.value if hasattr(person.role, 'value') else person.role,
                    availability=person.availability.value if hasattr(person.availability, 'value') else person.availability,
                )
            )
        return result

    @staticmethod
    def get_person_by_id(person_id: str, db: Session, current_user: CurrentUser) -> PersonDetailResponse:
        """
        Returns detailed information for a specific person by their ID.
        Raises 404 if not found.
        Raises 403 if the caller does not have permission to view this person.
        """
        person = None
        # Try UUID match first
        try:
            uuid_val = UUID(str(person_id))
            person = db.query(Person).filter(Person.id == uuid_val).first()
        except ValueError:
            pass

        if not person:
            people = db.query(Person).order_by(Person.id).all()
            if people and str(person_id).isdigit():
                idx = int(person_id) - 1
                if 0 <= idx < len(people):
                    person = people[idx]

        if not person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Person with ID {person_id} not found.",
            )

        RBACService.assert_person_access(db, current_user, person.id)

        dept_name = ""
        if person.department_id:
            dept = db.query(Department).filter(Department.id == person.department_id).first()
            dept_name = dept.name if dept else ""

        return PersonDetailResponse(
            id=person.id,
            full_name=person.full_name or "",
            job_title=person.job_title or "",
            department_name=dept_name,
            role=person.role.value if hasattr(person.role, 'value') else person.role,
            availability=person.availability.value if hasattr(person.availability, 'value') else person.availability,
            email=person.email,
            department_id=person.department_id,
            manager_id=person.manager_id,
            skills=person.skills,
            created_at=person.created_at,
        )

