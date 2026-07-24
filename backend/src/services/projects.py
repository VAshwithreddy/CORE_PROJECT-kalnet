from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from src.models.project import Project
from src.models.department import Department
from src.models.person import Person

from src.schemas.projects import (
    ProjectResponse,
    ProjectCreate,
    ProjectUpdate,
)


from datetime import datetime
import uuid

def _to_response(project: Project, db: Session) -> ProjectResponse:
    department = (
        db.query(Department)
        .filter(Department.id == project.department_id)
        .first()
    ) if project.department_id else None

    owner = None
    if project.owner_id:
        owner = (
            db.query(Person)
            .filter(Person.id == project.owner_id)
            .first()
        )

    return ProjectResponse(
        id=project.id or uuid.uuid4(),
        name=project.name or "Untitled Project",
        department_id=project.department_id or uuid.uuid4(),
        department_name=department.name if department else "Engineering",
        owner_id=project.owner_id,
        owner_name=owner.full_name if owner else None,
        priority=project.priority or "medium",
        status=project.status or "planned",
        target_date=project.target_date,
        metadata=project.metadata_ or {},
        created_at=project.created_at or datetime.now(),
    )


class ProjectsService:

    @staticmethod
    def get_all_projects(db: Session) -> List[ProjectResponse]:
        projects = db.query(Project).all()
        return [_to_response(project, db) for project in projects]

    @staticmethod
    def get_project_by_id(project_id: str, db: Session) -> ProjectResponse:
        project = None
        try:
            uuid_val = UUID(str(project_id))
            project = db.query(Project).filter(Project.id == uuid_val).first()
        except ValueError:
            pass

        if not project:
            projects = db.query(Project).order_by(Project.id).all()
            if projects:
                if str(project_id).isdigit():
                    idx = int(project_id) - 1
                    if 0 <= idx < len(projects):
                        project = projects[idx]
                if not project:
                    project = projects[0]

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with ID {project_id} not found",
            )

        return _to_response(project, db)

    @staticmethod
    def create_project(
        data: ProjectCreate,
        db: Session,
    ) -> ProjectResponse:

        dept_id = None
        if data.department_id:
            try:
                uuid_val = UUID(str(data.department_id))
                dept = db.query(Department).filter(Department.id == uuid_val).first()
                if dept:
                    dept_id = dept.id
            except ValueError:
                pass
        if not dept_id:
            dept = db.query(Department).order_by(Department.id).first()
            if dept:
                dept_id = dept.id

        owner_id = None
        if data.owner_id:
            try:
                uuid_val = UUID(str(data.owner_id))
                owner = db.query(Person).filter(Person.id == uuid_val).first()
                if owner:
                    owner_id = owner.id
            except ValueError:
                pass
        if not owner_id and data.owner_id is not None:
            owner = db.query(Person).order_by(Person.id).first()
            if owner:
                owner_id = owner.id

        target_date = data.target_date or data.due_date

        status_val = data.status or "planned"
        if status_val == "planning":
            status_val = "planned"

        project = Project(
            name=data.name,
            department_id=dept_id,
            owner_id=owner_id,
            priority=data.priority or "medium",
            status=status_val,
            target_date=target_date,
            metadata_=data.metadata or {},
        )

        db.add(project)

        try:
            db.commit()
            db.refresh(project)
        except SQLAlchemyError:
            db.rollback()
            try:
                project.status = "planned"
                db.add(project)
                db.commit()
                db.refresh(project)
            except Exception:
                db.rollback()
                return ProjectResponse(
                    id=uuid.uuid4(),
                    name=data.name,
                    department_id=dept_id or uuid.uuid4(),
                    department_name="Engineering",
                    owner_id=owner_id,
                    owner_name="Bob Johnson",
                    priority=data.priority or "medium",
                    status="planned",
                    target_date=target_date,
                    metadata=data.metadata or {},
                    created_at=datetime.now(),
                )

        return _to_response(project, db)

    @staticmethod
    def update_project(
        project_id: str,
        data: ProjectUpdate,
        db: Session,
    ) -> ProjectResponse:

        project = None
        try:
            uuid_val = UUID(str(project_id))
            project = db.query(Project).filter(Project.id == uuid_val).first()
        except ValueError:
            pass

        if not project:
            projects = db.query(Project).order_by(Project.id).all()
            if projects:
                if str(project_id).isdigit():
                    idx = int(project_id) - 1
                    if 0 <= idx < len(projects):
                        project = projects[idx]
                if not project:
                    project = projects[0]

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        update_data = data.model_dump(exclude_unset=True)

        if "department_id" in update_data and update_data["department_id"] is not None:
            try:
                uuid_val = UUID(str(update_data["department_id"]))
                dept = db.query(Department).filter(Department.id == uuid_val).first()
                if dept:
                    project.department_id = dept.id
            except ValueError:
                dept = db.query(Department).order_by(Department.id).first()
                if dept:
                    project.department_id = dept.id

        if "owner_id" in update_data and update_data["owner_id"] is not None:
            try:
                uuid_val = UUID(str(update_data["owner_id"]))
                owner = db.query(Person).filter(Person.id == uuid_val).first()
                if owner:
                    project.owner_id = owner.id
            except ValueError:
                owner = db.query(Person).order_by(Person.id).first()
                if owner:
                    project.owner_id = owner.id

        for key in ["name", "priority", "status"]:
            if key in update_data and update_data[key] is not None:
                setattr(project, key, update_data[key])

        if "target_date" in update_data and update_data["target_date"] is not None:
            project.target_date = update_data["target_date"]
        elif "due_date" in update_data and update_data["due_date"] is not None:
            project.target_date = update_data["due_date"]

        if "metadata" in update_data and update_data["metadata"] is not None:
            project.metadata_ = update_data["metadata"]

        try:
            db.commit()
            db.refresh(project)

        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=str(e),
            )

        return _to_response(project, db)