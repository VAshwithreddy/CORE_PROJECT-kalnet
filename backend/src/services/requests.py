from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.core.dependencies import CurrentUser
from src.core.rbac import PRIVILEGED_ROLES, RBACService
from src.models.audit_log import AuditLog
from src.models.department import Department
from src.models.person import Person
from src.models.work_request import WorkRequest
from src.schemas.requests import WorkRequestCreate, WorkRequestResponse, WorkRequestUpdate


class RequestsService:
    @staticmethod
    def _to_response(row: WorkRequest, db: Session) -> WorkRequestResponse:
        requester = db.query(Person).filter(Person.id == row.requester_id).first()
        department = db.query(Department).filter(Department.id == row.department_id).first() if row.department_id else None
        assignee = db.query(Person).filter(Person.id == row.assignee_id).first() if row.assignee_id else None
        return WorkRequestResponse(
            id=row.id, type=row.type, title=row.title, description=row.description, status=row.status,
            requester_id=row.requester_id, requester_name=requester.full_name if requester else "Unknown requester",
            department_id=row.department_id, department_name=department.name if department else None,
            assignee_id=row.assignee_id, assignee_name=assignee.full_name if assignee else None,
            created_at=row.created_at, updated_at=row.updated_at,
        )

    @staticmethod
    def _route_department(db: Session, requester: Person, request_type: str) -> UUID | None:
        keywords = ("it", "technology") if request_type in {"IT Support", "Access"} else ("hr", "people") if request_type in {"HR", "Time Off"} else ()
        for keyword in keywords:
            department = db.query(Department).filter(Department.name.ilike(f"%{keyword}%")).first()
            if department:
                return department.id
        return requester.department_id

    @staticmethod
    def list_visible(db: Session, current_user: CurrentUser) -> List[WorkRequestResponse]:
        query = db.query(WorkRequest)
        if current_user.role not in PRIVILEGED_ROLES:
            requester = db.query(Person).filter(Person.id == current_user.person_id).first()
            if current_user.role in {"department_head", "team_leader"} and requester and requester.department_id:
                query = query.filter(WorkRequest.department_id == requester.department_id)
            elif current_user.role == "manager":
                visible_ids = RBACService.get_visible_person_ids(db, current_user)
                query = query.filter(WorkRequest.requester_id.in_(visible_ids))
            else:
                query = query.filter(WorkRequest.requester_id == current_user.person_id)
        rows = query.order_by(WorkRequest.created_at.desc()).all()
        return [RequestsService._to_response(row, db) for row in rows]

    @staticmethod
    def create(db: Session, current_user: CurrentUser, data: WorkRequestCreate) -> WorkRequestResponse:
        requester = db.query(Person).filter(Person.id == current_user.person_id).first()
        if not requester:
            raise HTTPException(status_code=404, detail="Requester profile not found.")
        row = WorkRequest(
            requester_id=requester.id,
            department_id=RequestsService._route_department(db, requester, data.type),
            type=data.type,
            title=data.title.strip(),
            description=data.description.strip(),
            status="pending",
        )
        db.add(row)
        db.flush()
        db.add(AuditLog(actor_id=current_user.person_id, action="REQUEST_CREATED", entity="work_request", entity_id=row.id, after_state={"status": row.status, "type": row.type}, reason=row.title))
        db.commit()
        db.refresh(row)
        return RequestsService._to_response(row, db)

    @staticmethod
    def update(db: Session, current_user: CurrentUser, request_id: UUID, data: WorkRequestUpdate) -> WorkRequestResponse:
        row = db.query(WorkRequest).filter(WorkRequest.id == request_id).first()
        if not row:
            raise HTTPException(status_code=404, detail="Request not found.")
        if current_user.role not in PRIVILEGED_ROLES:
            actor = db.query(Person).filter(Person.id == current_user.person_id).first()
            if current_user.role not in {"department_head", "team_leader"} or not actor or row.department_id != actor.department_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot update this request.")
        before = {"status": row.status, "department_id": str(row.department_id) if row.department_id else None, "assignee_id": str(row.assignee_id) if row.assignee_id else None}
        if data.status is not None:
            allowed = {"pending", "in_review", "approved", "rejected", "resolved"}
            if data.status not in allowed:
                raise HTTPException(status_code=400, detail="Invalid request status.")
            row.status = data.status
        if data.department_id is not None:
            row.department_id = data.department_id
        if data.assignee_id is not None:
            row.assignee_id = data.assignee_id
        db.add(AuditLog(actor_id=current_user.person_id, action="REQUEST_UPDATED", entity="work_request", entity_id=row.id, before_state=before, after_state={"status": row.status}, reason=row.title))
        db.commit()
        db.refresh(row)
        return RequestsService._to_response(row, db)

    @staticmethod
    def withdraw(db: Session, current_user: CurrentUser, request_id: UUID) -> None:
        """Remove an accidentally submitted request before it is processed."""
        row = db.query(WorkRequest).filter(WorkRequest.id == request_id).first()
        if not row:
            raise HTTPException(status_code=404, detail="Request not found.")
        if row.requester_id != current_user.person_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only withdraw your own requests.")
        if row.status not in {"pending", "in_review"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending or in-review requests can be withdrawn.")

        db.add(AuditLog(
            actor_id=current_user.person_id,
            action="REQUEST_WITHDRAWN",
            entity="work_request",
            entity_id=row.id,
            before_state={"status": row.status, "type": row.type, "title": row.title},
            reason="Withdrawn by requester",
        ))
        db.delete(row)
        db.commit()
