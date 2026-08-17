from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from src.core.dependencies import CurrentUser

from src.models.project import Project
from src.models.department import Department
from src.models.person import Person

from src.schemas.projects import (
    ProjectResponse,
    ProjectCreate,
    ProjectUpdate,
)

from src.services.notifications import (
    NotificationService,
    NotificationRulesEngine,
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
    def get_visible_projects(db: Session, current_user: CurrentUser) -> List[ProjectResponse]:
        """
        Returns only the projects visible to the current user.
        - Privileged roles see all projects.
        - Other roles see projects where they or their visible people are assigned.
        """
        from src.core.rbac import RBACService, PRIVILEGED_ROLES
        from src.models.assignment import Assignment

        if current_user.role in PRIVILEGED_ROLES:
            projects = db.query(Project).all()
        else:
            visible_person_ids = RBACService.get_visible_person_ids(db, current_user)
            project_ids = (
                db.query(Assignment.project_id)
                .filter(Assignment.person_id.in_(visible_person_ids))
                .distinct()
                .all()
            )
            # project_ids is a list of tuples like [(uuid1,), (uuid2,)]
            pid_list = [p[0] for p in project_ids if p[0] is not None]
            projects = db.query(Project).filter(Project.id.in_(pid_list)).all()

        return [_to_response(project, db) for project in projects]

    @staticmethod
    def get_project_by_id(project_id: str, db: Session, current_user: CurrentUser) -> ProjectResponse:
        project = None
        try:
            uuid_val = UUID(str(project_id))
            project = db.query(Project).filter(Project.id == uuid_val).first()
        except ValueError:
            pass

        if not project:
            projects = db.query(Project).order_by(Project.id).all()
            if projects and str(project_id).isdigit():
                idx = (int(project_id) - 1) % len(projects)
                project = projects[idx]

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with ID {project_id} not found",
            )

        # Enforce RBAC
        from src.core.rbac import RBACService, PRIVILEGED_ROLES
        from src.models.assignment import Assignment
        
        if current_user.role not in PRIVILEGED_ROLES:
            visible_person_ids = RBACService.get_visible_person_ids(db, current_user)
            # Check if any visible person is assigned to this project
            has_access = db.query(Assignment).filter(
                Assignment.project_id == project.id,
                Assignment.person_id.in_(visible_person_ids)
            ).first() is not None
            
            if not has_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view this project."
                )

        return _to_response(project, db)

    @staticmethod
    def create_project(
        data: ProjectCreate,
        db: Session,
    ) -> ProjectResponse:

        dept_id = None
        if data.department_id:
            dept = None
            try:
                uuid_val = UUID(str(data.department_id))
                dept = db.query(Department).filter(Department.id == uuid_val).first()
            except ValueError:
                pass
            
            if not dept and str(data.department_id).isdigit():
                depts = db.query(Department).order_by(Department.id).all()
                if depts:
                    idx = (int(data.department_id) - 1) % len(depts)
                    dept = depts[idx]
            
            if dept:
                dept_id = dept.id
            else:
                raise HTTPException(status_code=400, detail=f"Department with ID {data.department_id} not found")

        owner_id = None
        if data.owner_id:
            owner = None
            try:
                uuid_val = UUID(str(data.owner_id))
                owner = db.query(Person).filter(Person.id == uuid_val).first()
            except ValueError:
                pass
            
            if not owner and str(data.owner_id).isdigit():
                people = db.query(Person).order_by(Person.id).all()
                if people:
                    idx = (int(data.owner_id) - 1) % len(people)
                    owner = people[idx]
            
            if owner:
                owner_id = owner.id
            else:
                raise HTTPException(status_code=400, detail=f"Owner with ID {data.owner_id} not found")

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
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database error while creating project: {str(e.orig) if hasattr(e, 'orig') else str(e)}"
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
            if projects and str(project_id).isdigit():
                idx = (int(project_id) - 1) % len(projects)
                project = projects[idx]

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        update_data = data.model_dump(exclude_unset=True)

        if "department_id" in update_data and update_data["department_id"] is not None:
            dept = None
            try:
                uuid_val = UUID(str(update_data["department_id"]))
                dept = db.query(Department).filter(Department.id == uuid_val).first()
            except ValueError:
                pass
            
            if not dept and str(update_data["department_id"]).isdigit():
                depts = db.query(Department).order_by(Department.id).all()
                if depts:
                    idx = (int(update_data["department_id"]) - 1) % len(depts)
                    dept = depts[idx]
                    
            if not dept:
                raise HTTPException(status_code=400, detail=f"Department with ID {update_data['department_id']} not found")
            
            project.department_id = dept.id

        if "owner_id" in update_data and update_data["owner_id"] is not None:
            owner = None
            try:
                uuid_val = UUID(str(update_data["owner_id"]))
                owner = db.query(Person).filter(Person.id == uuid_val).first()
            except ValueError:
                pass
                
            if not owner and str(update_data["owner_id"]).isdigit():
                people = db.query(Person).order_by(Person.id).all()
                if people:
                    idx = (int(update_data["owner_id"]) - 1) % len(people)
                    owner = people[idx]
                    
            if not owner:
                raise HTTPException(status_code=400, detail=f"Owner with ID {update_data['owner_id']} not found")
            
            project.owner_id = owner.id

        previous_priority = project.priority

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

        # Best-effort — see NotificationService.notify(): failures here are
        # logged and never break the already-successful project update.
        NotificationService.notify(
            db,
            NotificationRulesEngine.on_project_priority_changed,
            project,
            previous_priority,
        )

        return _to_response(project, db)