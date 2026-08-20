from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.core.dependencies import CurrentUser
from src.core.rbac import RBACService
from src.models.assignment import Assignment
from src.models.audit_log import AuditLog
from src.models.person import Person
from src.models.project import Project
from src.models.status_update import StatusUpdate
from src.schemas.blockers import BlockerResponse
from src.services.notifications import NotificationRulesEngine, NotificationService


class BlockersService:
    @staticmethod
    def list_visible(db: Session, current_user: CurrentUser) -> List[BlockerResponse]:
        visible_ids = RBACService.get_visible_person_ids(db, current_user)
        assignments = db.query(Assignment).filter(Assignment.person_id.in_(visible_ids)).all()
        blockers: List[BlockerResponse] = []
        now = datetime.now(timezone.utc)
        for assignment in assignments:
            latest = db.query(StatusUpdate).filter(StatusUpdate.assignment_id == assignment.id).order_by(StatusUpdate.created_at.desc()).first()
            if not latest or str(latest.status) != "blocked":
                continue
            person = db.query(Person).filter(Person.id == assignment.person_id).first()
            project = db.query(Project).filter(Project.id == assignment.project_id).first()
            blocked_at = latest.created_at or now
            if blocked_at.tzinfo is None:
                blocked_at = blocked_at.replace(tzinfo=timezone.utc)
            days = max((now - blocked_at).days, 0)
            priority = str(getattr(project, "priority", "medium")).lower()
            severity = "High" if priority in {"high", "critical"} or days >= 3 else "Medium" if days else "Low"
            blockers.append(BlockerResponse(
                assignment_id=assignment.id, project_id=assignment.project_id,
                project_name=project.name if project else "Unknown project", owner_id=assignment.person_id,
                owner_name=person.full_name if person else "Unknown owner", department_id=person.department_id if person else None,
                title=assignment.role or "Assignment", reason=latest.blockers or latest.progress_note or "No reason provided.",
                blocked_at=blocked_at, days_blocked=days, severity=severity,
            ))
        return sorted(blockers, key=lambda item: item.blocked_at)

    @staticmethod
    def resolve(db: Session, current_user: CurrentUser, assignment_id: UUID, note: str) -> BlockerResponse | None:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found.")
        RBACService.assert_assignment_access(db, current_user, assignment)
        previous = db.query(StatusUpdate).filter(StatusUpdate.assignment_id == assignment.id).order_by(StatusUpdate.created_at.desc()).first()
        if not previous or str(previous.status) != "blocked":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This assignment does not have an active blocker.")
        update = StatusUpdate(assignment_id=assignment.id, author_id=current_user.person_id, status="on_track", progress_note=note.strip() or "Blocker resolved.")
        assignment.status = "on_track"
        db.add(update)
        db.add(AuditLog(actor_id=current_user.person_id, action="BLOCKER_RESOLVED", entity="assignment", entity_id=assignment.id, reason=update.progress_note))
        db.commit()
        db.refresh(update)
        NotificationService.notify(db, NotificationRulesEngine.on_status_update_created, assignment, update, "blocked")
        return None
