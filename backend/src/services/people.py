from typing import List
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.models.person import Person
from src.models.department import Department
from src.models.audit_log import AuditLog
from src.models.enums import Availability, Role
from src.schemas.people import PersonCreate, PersonResponse, PersonDetailResponse, PersonOrganizationUpdate
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

    @staticmethod
    def update_organization(
        person_id: str,
        data: PersonOrganizationUpdate,
        db: Session,
        actor: CurrentUser,
    ) -> PersonDetailResponse:
        """Place an existing person in a department and optionally appoint its head."""
        try:
            person = db.query(Person).filter(Person.id == UUID(str(person_id))).first()
        except ValueError:
            person = None
        if not person:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found.")

        department = db.query(Department).filter(Department.id == data.department_id).first()
        if not department:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department not found.")

        try:
            role = Role(data.role)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid organization role.") from exc

        manager = None
        if data.manager_id:
            manager = db.query(Person).filter(Person.id == data.manager_id).first()
            if not manager or manager.department_id != department.id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Manager must belong to the selected department.")
            if manager.id == person.id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A person cannot manage themselves.")

        person.department_id = department.id
        person.manager_id = manager.id if manager else None
        person.role = role

        if role == Role.department_head:
            department.head_person_id = person.id
        elif department.head_person_id == person.id:
            department.head_person_id = None

        db.add(AuditLog(
            actor_id=actor.person_id,
            action="PERSON_ORGANIZATION_UPDATED",
            entity="person",
            entity_id=person.id,
            after_state={
                "role": role.value,
                "department_id": str(department.id),
                "manager_id": str(manager.id) if manager else None,
            },
        ))
        db.commit()
        db.refresh(person)
        return PeopleService.get_person_by_id(str(person.id), db, actor)

    @staticmethod
    def create_person(
        data: PersonCreate,
        db: Session,
        actor: CurrentUser,
    ) -> PersonDetailResponse:
        """Create a directory record that can immediately use CORE sign-in."""
        email = data.email.strip().lower()
        if db.query(Person).filter(Person.email == email).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An employee with this email already exists.")

        department = db.query(Department).filter(Department.id == data.department_id).first()
        if not department:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department not found.")
        try:
            role = Role(data.role)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid organization role.") from exc

        manager = None
        if data.manager_id:
            manager = db.query(Person).filter(Person.id == data.manager_id).first()
            if not manager or manager.department_id != department.id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Manager must belong to the selected department.")

        person = Person(
            full_name=data.full_name.strip(),
            email=email,
            job_title=data.job_title.strip() if data.job_title else None,
            role=role,
            availability=Availability.available,
            department_id=department.id,
            manager_id=manager.id if manager else None,
        )
        db.add(person)
        db.flush()
        if role == Role.department_head:
            department.head_person_id = person.id
        db.add(AuditLog(
            actor_id=actor.person_id,
            action="PERSON_CREATED",
            entity="person",
            entity_id=person.id,
            after_state={"email": email, "role": role.value, "department_id": str(department.id)},
        ))
        db.commit()
        db.refresh(person)
        return PeopleService.get_person_by_id(str(person.id), db, actor)

