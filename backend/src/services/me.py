from typing import Dict, Any, Optional
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from src.core.database import get_db
from src.models.person import Person
from src.models.department import Department
from src.schemas.me import UserResponse, UserProfileResponse, UserProfileUpdate

# Placeholder current‑user UUID – replace with real JWT auth later.
from uuid import UUID
_CURRENT_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


class MeService:
    """
    Service layer for the Current User (/me) module.
    Reads the current user's data from the Supabase PostgreSQL database.
    """

    @staticmethod
    def _get_person(db: Session, person_id: UUID = _CURRENT_USER_ID) -> Person:
        """Fetch the Person row for the current user; raise 404 if missing."""
        person = db.query(Person).filter(Person.id == person_id).first()
        if not person:
            # Fallback: try to fetch any existing user (first record)
            person = db.query(Person).order_by(Person.id).first()
            if not person:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Current user (Person ID {person_id}) not found, and no users exist in database.",
                )
        return person

    @staticmethod
    def get_basic_info(db: Session) -> UserResponse:
        """Return minimal user info: id, username (email prefix), email, role."""
        person = MeService._get_person(db)
        username = person.email.split("@")[0] if person.email else f"user_{person.id}"
        return UserResponse(
            id=person.id,
            username=username,
            email=person.email,
            role=person.role,
        )

    @staticmethod
    def get_profile(db: Session) -> UserProfileResponse:
        """Return the detailed profile: name, title, department, bio."""
        person = MeService._get_person(db)

        dept_name = ""
        if person.department_id:
            dept = db.query(Department).filter(Department.id == person.department_id).first()
            dept_name = dept.name if dept else ""

        # Split full_name into first and last name if possible
        name_parts = (person.full_name or "").split()
        first_name = name_parts[0] if len(name_parts) > 0 else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        title = person.job_title or ""
        return UserProfileResponse(
            id=person.id,
            first_name=first_name,
            last_name=last_name,
            department=dept_name,
            title=title,
            bio=None,
        )

    @staticmethod
    def update_profile(update_data: Dict[str, Any], db: Session) -> UserProfileResponse:
        """Partially update the current user's editable profile fields."""
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields provided for update.",
            )

        person = MeService._get_person(db)

        if "first_name" in update_data or "last_name" in update_data:
            name_parts = (person.full_name or "").split()
            fn = update_data.get("first_name", name_parts[0] if len(name_parts) > 0 else "")
            ln = update_data.get("last_name", " ".join(name_parts[1:]) if len(name_parts) > 1 else "")
            person.full_name = f"{fn} {ln}".strip()

        if "full_name" in update_data and update_data["full_name"]:
            person.full_name = update_data["full_name"]

        if "job_title" in update_data and update_data["job_title"]:
            person.job_title = update_data["job_title"]
        elif "title" in update_data and update_data["title"]:
            person.job_title = update_data["title"]

        try:
            db.commit()
            db.refresh(person)
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update profile: {str(exc.orig) if hasattr(exc, 'orig') else str(exc)}",
            )

        dept_name = ""
        if person.department_id:
            dept = db.query(Department).filter(Department.id == person.department_id).first()
            dept_name = dept.name if dept else ""

        # Split full_name into first and last name for the response
        name_parts = (person.full_name or "").split()
        first_name = name_parts[0] if len(name_parts) > 0 else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        title = person.job_title or ""
        return UserProfileResponse(
            id=person.id,
            first_name=first_name,
            last_name=last_name,
            department=dept_name,
            title=title,
            bio=None,
        )
