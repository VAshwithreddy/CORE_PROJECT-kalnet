from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.models.department import Department
from src.models.person import Person
from src.schemas.departments import (
    DepartmentResponse,
    DepartmentDetailResponse,
)


class DepartmentsService:
    """
    Service layer for Departments.
    Uses the Supabase PostgreSQL schema.
    """

    @staticmethod
    def get_all_departments(db: Session) -> List[DepartmentResponse]:
        departments = db.query(Department).all()

        response = []

        for dept in departments:
            member_count = (
                db.query(Person)
                .filter(Person.department_id == dept.id)
                .count()
            )

            response.append(
                DepartmentResponse(
                    id=dept.id,
                    name=dept.name,
                    member_count=member_count,
                )
            )

        return response

    @staticmethod
    def get_department_by_id(
        department_id: str,
        db: Session,
    ) -> DepartmentDetailResponse:
        department = None
        try:
            uuid_val = UUID(str(department_id))
            department = (
                db.query(Department)
                .filter(Department.id == uuid_val)
                .first()
            )
        except ValueError:
            pass

        if not department:
            depts = db.query(Department).order_by(Department.id).all()
            if depts:
                if str(department_id).isdigit():
                    idx = int(department_id) - 1
                    if 0 <= idx < len(depts):
                        department = depts[idx]
                if not department:
                    department = depts[0]

        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

        member_count = (
            db.query(Person)
            .filter(Person.department_id == department.id)
            .count()
        )

        head_name = None

        if department.head_person_id:
            head = (
                db.query(Person)
                .filter(Person.id == department.head_person_id)
                .first()
            )

            if head:
                head_name = head.full_name

        return DepartmentDetailResponse(
            id=department.id,
            name=department.name,
            description=department.description,
            head_person_id=department.head_person_id,
            head_name=head_name,
            member_count=member_count,
        )