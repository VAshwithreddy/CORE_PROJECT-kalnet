"""
services/notifications.py

Layer A — Deterministic Notification Engine + guaranteed-delivery
NotificationService. See docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md.

This module has ZERO dependency on any AI/LLM provider. Nothing in here
can fail because an AI call failed, timed out, or returned garbage —
there is no AI call. Layer B (AI enrichment) is a separate, later,
strictly additive module (`notification_enrichments`) that only ever
*attaches* optional advisory data to rows this module already committed.
It can never block, delay, or downgrade what this module guarantees.

Two classes:
  NotificationRulesEngine — pure decision functions. CORE row(s) in,
      NotificationDraft(s) out. Read-only DB access to resolve recipients
      / context. Never writes a Notification row itself.
  NotificationService — the only code path allowed to write to the
      `notifications` table. Owns dedup, persistence, and the read-side
      API (list / mark-read / acknowledge / sweep).

Employee identity in every message comes from Person.full_name, looked
up here — never hardcoded, never invented. The recipient's OWN name is
never included in their own notification; other people's names (e.g. an
employee's name in their manager's copy of a blocker alert) are.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Callable, Iterable, List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.assignment import Assignment
from src.models.department import Department
from src.models.enums import NotificationEntityType, NotificationSeverity, NotificationType, Role
from src.models.notification import Notification
from src.models.person import Person
from src.models.project import Project
from src.models.status_update import StatusUpdate

logger = logging.getLogger("core_api.notifications")


# ─────────────────────────────────────────────────────────────────────────
# NotificationDraft — the one shape the rules engine is allowed to
# produce. Nothing downstream accepts a bare dict, a string, or (later)
# raw AI output as a substitute — see architecture doc
# §"Structured output only" (the same discipline applies even before AI
# exists in this system).
#
# Fields mirror the real `notifications` table exactly: `message` is the
# single display string (the table has no `title` column) and
# `action_url` is a real, existing column — see NOTIFICATION_INTELLIGENCE
# _ARCHITECTURE.md, "Schema drift found after the fact".
# ─────────────────────────────────────────────────────────────────────────

@dataclass
class NotificationDraft:
    recipient_id: UUID
    type: NotificationType
    severity: NotificationSeverity
    message: str
    entity_type: NotificationEntityType
    entity_id: UUID
    action_url: Optional[str] = None
    requires_acknowledgement: bool = False
    dedup_key: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────
# Context helpers — pure read-side derivation from existing CORE tables.
# No shadow/mirror tables. In particular, blocker lifecycle is derived
# from StatusUpdate history rather than stored redundantly — see
# architecture doc §"Derived blocker lifecycle (no new Blocker table)".
# ─────────────────────────────────────────────────────────────────────────

@dataclass
class BlockerState:
    is_blocked: bool
    started_at: Optional[datetime] = None
    triggering_status_update_id: Optional[UUID] = None

    @property
    def age_hours(self) -> float:
        if not self.is_blocked or not self.started_at:
            return 0.0
        return _hours_since(self.started_at)


def _hours_since(moment: datetime) -> float:
    now = datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    return max((now - moment).total_seconds() / 3600.0, 0.0)


def get_current_blocker_state(db: Session, assignment_id: UUID) -> BlockerState:
    """Whether an assignment is *currently* blocked, and since when —
    derived purely from StatusUpdate history (there is no Blocker table).

    Walks the most recent status updates newest-first and finds the start
    of the current unbroken "blocked" streak. Not blocked if the latest
    status update is anything other than "blocked", or if there's no
    history yet. Bounded to the most recent 200 updates for an assignment —
    plenty for any realistic blocked streak, and keeps this O(1)-ish
    regardless of an assignment's total lifetime history.
    """
    updates = (
        db.query(StatusUpdate)
        .filter(StatusUpdate.assignment_id == assignment_id)
        .order_by(StatusUpdate.created_at.desc())
        .limit(200)
        .all()
    )
    if not updates or updates[0].status != "blocked":
        return BlockerState(is_blocked=False)

    streak_start = updates[0]
    for update in updates[1:]:
        if update.status == "blocked":
            streak_start = update
        else:
            break

    return BlockerState(
        is_blocked=True,
        started_at=streak_start.created_at,
        triggering_status_update_id=streak_start.id,
    )


def get_previous_status(db: Session, assignment_id: UUID, before_id: Optional[UUID]) -> Optional[str]:
    """The assignment's status update status immediately prior to
    `before_id` — used to detect a *transition* rather than re-firing on
    every StatusUpdate that merely repeats the current state."""
    query = db.query(StatusUpdate).filter(StatusUpdate.assignment_id == assignment_id)
    if before_id is not None:
        pivot = db.query(StatusUpdate.created_at).filter(StatusUpdate.id == before_id).scalar()
        if pivot is not None:
            query = query.filter(StatusUpdate.created_at < pivot)
    previous = query.order_by(StatusUpdate.created_at.desc()).first()
    return previous.status if previous else None


def is_overdue(assignment: Assignment) -> bool:
    if not assignment.end_date or assignment.status == "done":
        return False
    return assignment.end_date < date.today()


def hours_overdue(assignment: Assignment) -> float:
    if not is_overdue(assignment):
        return 0.0
    return (date.today() - assignment.end_date).total_seconds() / 3600.0


def is_deadline_approaching(assignment: Assignment, *, warning_hours: int) -> bool:
    if not assignment.end_date or assignment.status == "done":
        return False
    if assignment.end_date < date.today():
        return False  # already overdue — handled by WORK_OVERDUE, not "approaching"
    hours_until = (assignment.end_date - date.today()).days * 24.0
    return hours_until <= warning_hours


def escalation_threshold_hours(project: Optional[Project]) -> int:
    if project and project.priority in ("critical", "high"):
        return settings.notification_escalation_hours_high_priority
    return settings.notification_escalation_hours_default


def get_escalation_recipients(db: Session, assignment: Assignment) -> List[UUID]:
    """Manager, then department head, then any work_admin as a last-resort
    fallback. A CRITICAL/escalation-worthy event must never end up with
    zero recipients just because org data is incomplete — see architecture
    doc §"Escalation recipients"."""
    recipients: List[UUID] = []

    person = db.query(Person).filter(Person.id == assignment.person_id).first()
    if person and person.manager_id:
        recipients.append(person.manager_id)

    project = db.query(Project).filter(Project.id == assignment.project_id).first()
    if project and project.department_id:
        dept = db.query(Department).filter(Department.id == project.department_id).first()
        if dept and dept.head_person_id and dept.head_person_id not in recipients:
            recipients.append(dept.head_person_id)

    if not recipients:
        admins = db.query(Person.id).filter(Person.role == Role.work_admin).all()
        recipients.extend(r[0] for r in admins if r[0] not in recipients)

    return recipients


def get_person(db: Session, person_id: UUID) -> Optional[Person]:
    return db.query(Person).filter(Person.id == person_id).first()


def assignment_person_name(db: Session, assignment: Assignment) -> str:
    """Always sourced from Person.full_name — never hardcoded, never
    invented. Falls back to a generic phrase only if the person record is
    somehow missing (should not happen in practice), never to a
    fabricated name."""
    person = get_person(db, assignment.person_id)
    return person.full_name if person else "A team member"


def build_action_url(*, entity_type: NotificationEntityType, notification_type: NotificationType, for_assignee: bool) -> Optional[str]:
    """Points at a real, existing frontend route — this project's routes
    are role-scoped list pages, not per-entity detail pages (no `[id]`
    dynamic routes exist yet), so this links to the most relevant list
    rather than fabricating a detail-page URL that would 404. Revisit
    once/if per-entity detail pages exist (see architecture doc, Phase 13)."""
    if entity_type == NotificationEntityType.PROJECT:
        return "/employee/my-work"
    if entity_type == NotificationEntityType.ASSIGNMENT:
        if for_assignee:
            return "/employee/my-work"
        if notification_type == NotificationType.ESCALATION_REQUIRED:
            return "/work-admin/escalations"
        return "/department/blockers"
    return None


# ─────────────────────────────────────────────────────────────────────────
# NotificationRulesEngine — Layer A
# ─────────────────────────────────────────────────────────────────────────

class NotificationRulesEngine:
    """Every method is a pure decision function. No AI. No writes — only
    NotificationService persists rows, so dedup/persistence stays in one
    place. Every message is built from real CORE data resolved here
    (Project.name, Person.full_name, etc.) — never from data supplied by
    a caller, and never inventing identity."""

    # ---- Event-driven rules -------------------------------------------------

    @staticmethod
    def on_assignment_created(db: Session, assignment: Assignment) -> List[NotificationDraft]:
        project = db.query(Project).filter(Project.id == assignment.project_id).first()
        project_name = project.name if project else "a project"
        return [
            NotificationDraft(
                recipient_id=assignment.person_id,
                type=NotificationType.WORK_ASSIGNED,
                severity=NotificationSeverity.INFO,
                message=f"You were assigned to {project_name} as {assignment.role}.",
                entity_type=NotificationEntityType.ASSIGNMENT,
                entity_id=assignment.id,
                action_url=build_action_url(
                    entity_type=NotificationEntityType.ASSIGNMENT,
                    notification_type=NotificationType.WORK_ASSIGNED,
                    for_assignee=True,
                ),
                dedup_key=f"WORK_ASSIGNED:assignment:{assignment.id}",
            )
        ]

    @staticmethod
    def on_assignment_reassigned(
        db: Session, assignment: Assignment, previous_person_id: Optional[UUID]
    ) -> List[NotificationDraft]:
        if not previous_person_id or previous_person_id == assignment.person_id:
            return []
        project = db.query(Project).filter(Project.id == assignment.project_id).first()
        project_name = project.name if project else "a project"
        new_person = get_person(db, assignment.person_id)
        new_person_name = new_person.full_name if new_person else "another team member"
        updated_at = getattr(assignment, "updated_at", None)
        trigger_ref = updated_at.isoformat() if updated_at else str(assignment.id)
        return [
            NotificationDraft(
                recipient_id=assignment.person_id,
                type=NotificationType.WORK_REASSIGNED,
                severity=NotificationSeverity.INFO,
                message=f"You are now assigned to {project_name} as {assignment.role}.",
                entity_type=NotificationEntityType.ASSIGNMENT,
                entity_id=assignment.id,
                action_url=build_action_url(
                    entity_type=NotificationEntityType.ASSIGNMENT,
                    notification_type=NotificationType.WORK_REASSIGNED,
                    for_assignee=True,
                ),
                dedup_key=f"WORK_REASSIGNED_TO:assignment:{assignment.id}:{trigger_ref}",
            ),
            NotificationDraft(
                recipient_id=previous_person_id,
                type=NotificationType.WORK_REASSIGNED,
                severity=NotificationSeverity.INFO,
                message=f"{project_name} was reassigned to {new_person_name}.",
                entity_type=NotificationEntityType.ASSIGNMENT,
                entity_id=assignment.id,
                action_url=build_action_url(
                    entity_type=NotificationEntityType.ASSIGNMENT,
                    notification_type=NotificationType.WORK_REASSIGNED,
                    for_assignee=True,
                ),
                dedup_key=f"WORK_REASSIGNED_FROM:assignment:{assignment.id}:{trigger_ref}",
            ),
        ]

    @staticmethod
    def on_assignment_completed(db: Session, assignment: Assignment, *, trigger_ref: str) -> List[NotificationDraft]:
        project = db.query(Project).filter(Project.id == assignment.project_id).first()
        project_name = project.name if project else "a project"
        return [
            NotificationDraft(
                recipient_id=assignment.person_id,
                type=NotificationType.WORK_COMPLETED,
                severity=NotificationSeverity.INFO,
                message=f"Your assignment on {project_name} is now complete.",
                entity_type=NotificationEntityType.ASSIGNMENT,
                entity_id=assignment.id,
                action_url=build_action_url(
                    entity_type=NotificationEntityType.ASSIGNMENT,
                    notification_type=NotificationType.WORK_COMPLETED,
                    for_assignee=True,
                ),
                dedup_key=f"WORK_COMPLETED:assignment:{assignment.id}:{trigger_ref}",
            )
        ]

    @staticmethod
    def on_status_update_created(
        db: Session,
        assignment: Assignment,
        status_update: StatusUpdate,
        previous_status: Optional[str],
    ) -> List[NotificationDraft]:
        """The primary transition-detection rule. Fires BLOCKER_CREATED /
        CRITICAL_BLOCKER / BLOCKER_RESOLVED / WORK_COMPLETED based on the
        StatusUpdate.status transition — not on Assignment.status, which
        is a separate, independently-set field that `create_status_update`
        does not touch (see architecture doc §"Two status fields")."""
        drafts: List[NotificationDraft] = []
        project = db.query(Project).filter(Project.id == assignment.project_id).first()
        project_name = project.name if project else "a project"
        person_name = assignment_person_name(db, assignment)
        became_blocked = status_update.status == "blocked" and previous_status != "blocked"
        became_unblocked = previous_status == "blocked" and status_update.status != "blocked"

        if became_blocked:
            is_critical = bool(project and project.priority == "critical")
            reason = status_update.blockers or "no blocker description was provided"
            notif_type = NotificationType.CRITICAL_BLOCKER if is_critical else NotificationType.BLOCKER_CREATED
            severity = NotificationSeverity.CRITICAL if is_critical else NotificationSeverity.WARNING
            manager_action_url = build_action_url(
                entity_type=NotificationEntityType.ASSIGNMENT, notification_type=notif_type, for_assignee=False
            )

            drafts.append(
                NotificationDraft(
                    recipient_id=assignment.person_id,
                    type=notif_type,
                    severity=severity,
                    message=f"You reported a blocker on {project_name}: {reason}",
                    entity_type=NotificationEntityType.ASSIGNMENT,
                    entity_id=assignment.id,
                    action_url=build_action_url(
                        entity_type=NotificationEntityType.ASSIGNMENT, notification_type=notif_type, for_assignee=True
                    ),
                    requires_acknowledgement=is_critical,
                    dedup_key=f"{notif_type.value}:assignment:{assignment.id}:{status_update.id}",
                )
            )
            for recipient_id in get_escalation_recipients(db, assignment):
                drafts.append(
                    NotificationDraft(
                        recipient_id=recipient_id,
                        type=notif_type,
                        severity=severity,
                        message=f"{person_name} raised a{'n' if is_critical else ''} "
                        f"{'critical ' if is_critical else ''}blocker on {project_name}: {reason}",
                        entity_type=NotificationEntityType.ASSIGNMENT,
                        entity_id=assignment.id,
                        action_url=manager_action_url,
                        requires_acknowledgement=is_critical,
                        dedup_key=f"{notif_type.value}:assignment:{assignment.id}:{status_update.id}:{recipient_id}",
                    )
                )

        if became_unblocked:
            drafts.append(
                NotificationDraft(
                    recipient_id=assignment.person_id,
                    type=NotificationType.BLOCKER_RESOLVED,
                    severity=NotificationSeverity.INFO,
                    message=f"Your blocker on {project_name} has been cleared.",
                    entity_type=NotificationEntityType.ASSIGNMENT,
                    entity_id=assignment.id,
                    action_url=build_action_url(
                        entity_type=NotificationEntityType.ASSIGNMENT,
                        notification_type=NotificationType.BLOCKER_RESOLVED,
                        for_assignee=True,
                    ),
                    dedup_key=f"BLOCKER_RESOLVED:assignment:{assignment.id}:{status_update.id}",
                )
            )
            for recipient_id in get_escalation_recipients(db, assignment):
                drafts.append(
                    NotificationDraft(
                        recipient_id=recipient_id,
                        type=NotificationType.BLOCKER_RESOLVED,
                        severity=NotificationSeverity.INFO,
                        message=f"{person_name}'s blocker on {project_name} has been cleared.",
                        entity_type=NotificationEntityType.ASSIGNMENT,
                        entity_id=assignment.id,
                        action_url=build_action_url(
                            entity_type=NotificationEntityType.ASSIGNMENT,
                            notification_type=NotificationType.BLOCKER_RESOLVED,
                            for_assignee=False,
                        ),
                        dedup_key=f"BLOCKER_RESOLVED:assignment:{assignment.id}:{status_update.id}:{recipient_id}",
                    )
                )

        if status_update.status == "completed":
            drafts.extend(
                NotificationRulesEngine.on_assignment_completed(db, assignment, trigger_ref=str(status_update.id))
            )

        return drafts

    @staticmethod
    def on_project_priority_changed(
        db: Session, project: Project, previous_priority: str
    ) -> List[NotificationDraft]:
        if project.priority == previous_priority:
            return []
        assignments = (
            db.query(Assignment)
            .filter(Assignment.project_id == project.id, Assignment.status != "done")
            .all()
        )
        severity = (
            NotificationSeverity.WARNING
            if project.priority in ("critical", "high")
            else NotificationSeverity.INFO
        )
        action_url = build_action_url(
            entity_type=NotificationEntityType.PROJECT,
            notification_type=NotificationType.PRIORITY_CHANGED,
            for_assignee=True,
        )
        return [
            NotificationDraft(
                recipient_id=a.person_id,
                type=NotificationType.PRIORITY_CHANGED,
                severity=severity,
                message=f"{project.name} priority changed from {previous_priority} to {project.priority}.",
                entity_type=NotificationEntityType.PROJECT,
                entity_id=project.id,
                action_url=action_url,
                dedup_key=f"PRIORITY_CHANGED:project:{project.id}:{a.id}:{project.priority}",
            )
            for a in assignments
        ]

    # ---- Sweep-driven rules (time-based; no single triggering event) -------

    @staticmethod
    def sweep_deadlines_and_overdue(db: Session) -> List[NotificationDraft]:
        """Evaluate every open assignment for DEADLINE_APPROACHING /
        WORK_OVERDUE / ESCALATION_REQUIRED. Meant to be invoked periodically
        by an external scheduler via POST /api/v1/notifications/sweep — see
        architecture doc §"No job queue: the sweep-endpoint pattern"."""
        drafts: List[NotificationDraft] = []
        day_scope = date.today().isoformat()

        # Deliberately NOT filtered on end_date here — an assignment with no
        # deadline can still have a long-unresolved blocker that needs
        # escalating. is_overdue()/is_deadline_approaching() already handle
        # a missing end_date correctly (both return False), so only the
        # deadline-specific branch below is conditional on it being set.
        open_assignments = db.query(Assignment).filter(Assignment.status != "done").all()
        for assignment in open_assignments:
            project = db.query(Project).filter(Project.id == assignment.project_id).first()
            project_name = project.name if project else "a project"

            if is_overdue(assignment):
                drafts.append(
                    NotificationDraft(
                        recipient_id=assignment.person_id,
                        type=NotificationType.WORK_OVERDUE,
                        severity=NotificationSeverity.WARNING,
                        message=f"{project_name} passed its due date ({assignment.end_date.isoformat()}).",
                        entity_type=NotificationEntityType.ASSIGNMENT,
                        entity_id=assignment.id,
                        action_url=build_action_url(
                            entity_type=NotificationEntityType.ASSIGNMENT,
                            notification_type=NotificationType.WORK_OVERDUE,
                            for_assignee=True,
                        ),
                        dedup_key=f"WORK_OVERDUE:assignment:{assignment.id}:{day_scope}",
                    )
                )
            elif is_deadline_approaching(assignment, warning_hours=settings.notification_deadline_warning_hours):
                drafts.append(
                    NotificationDraft(
                        recipient_id=assignment.person_id,
                        type=NotificationType.DEADLINE_APPROACHING,
                        severity=NotificationSeverity.INFO,
                        message=f"{project_name} is due {assignment.end_date.isoformat()}.",
                        entity_type=NotificationEntityType.ASSIGNMENT,
                        entity_id=assignment.id,
                        action_url=build_action_url(
                            entity_type=NotificationEntityType.ASSIGNMENT,
                            notification_type=NotificationType.DEADLINE_APPROACHING,
                            for_assignee=True,
                        ),
                        dedup_key=f"DEADLINE_APPROACHING:assignment:{assignment.id}:{day_scope}",
                    )
                )

            blocker = get_current_blocker_state(db, assignment.id)
            if blocker.is_blocked and blocker.age_hours >= escalation_threshold_hours(project):
                person_name = assignment_person_name(db, assignment)
                escalation_action_url = build_action_url(
                    entity_type=NotificationEntityType.ASSIGNMENT,
                    notification_type=NotificationType.ESCALATION_REQUIRED,
                    for_assignee=False,
                )
                for recipient_id in get_escalation_recipients(db, assignment):
                    drafts.append(
                        NotificationDraft(
                            recipient_id=recipient_id,
                            type=NotificationType.ESCALATION_REQUIRED,
                            severity=NotificationSeverity.CRITICAL,
                            message=(
                                f"{person_name}'s work on {project_name} has been blocked for "
                                f"{int(blocker.age_hours)} hours without resolution."
                            ),
                            entity_type=NotificationEntityType.ASSIGNMENT,
                            entity_id=assignment.id,
                            action_url=escalation_action_url,
                            requires_acknowledgement=True,
                            dedup_key=f"ESCALATION_REQUIRED:assignment:{assignment.id}:{recipient_id}:{day_scope}",
                        )
                    )
        return drafts

    # ---- Staleness alert integration (reuses the existing StalenessAlert
    #      table/model — does not implement a competing detection engine;
    #      see StalenessAlertsService.report_stale_assignment) -------------

    @staticmethod
    def on_staleness_alert_created(db, alert) -> List[NotificationDraft]:
        assignment = db.query(Assignment).filter(Assignment.id == alert.assignment_id).first()
        if not assignment:
            return []
        project = db.query(Project).filter(Project.id == assignment.project_id).first()
        project_name = project.name if project else "a project"
        severity_map = {
            "low": NotificationSeverity.INFO,
            "medium": NotificationSeverity.WARNING,
            "high": NotificationSeverity.CRITICAL,
        }
        severity = severity_map.get(alert.severity, NotificationSeverity.WARNING)
        # STALE_ASSIGNMENT, not WORK_OVERDUE: staleness means "no progress
        # update in N days" and is independent of whether a deadline has
        # passed — an assignment with no due date, or one due next month,
        # can still be stale. Conflating the two would make WORK_OVERDUE
        # notifications lie about deadline state. See architecture doc,
        # "Staleness vs overdue are not the same thing".
        drafts = [
            NotificationDraft(
                recipient_id=assignment.person_id,
                type=NotificationType.STALE_ASSIGNMENT,
                severity=severity,
                message=f"No status update on {project_name} in {alert.days_since_update} days: {alert.reason}",
                entity_type=NotificationEntityType.ASSIGNMENT,
                entity_id=assignment.id,
                action_url=build_action_url(
                    entity_type=NotificationEntityType.ASSIGNMENT,
                    notification_type=NotificationType.STALE_ASSIGNMENT,
                    for_assignee=True,
                ),
                dedup_key=f"STALENESS_ALERT:assignment:{assignment.id}:{alert.id}",
            )
        ]
        person_name = assignment_person_name(db, assignment)
        for recipient_id in get_escalation_recipients(db, assignment):
            drafts.append(
                NotificationDraft(
                    recipient_id=recipient_id,
                    type=NotificationType.STALE_ASSIGNMENT,
                    severity=severity,
                    message=(
                        f"{person_name} has not posted a status update on {project_name} in "
                        f"{alert.days_since_update} days."
                    ),
                    entity_type=NotificationEntityType.ASSIGNMENT,
                    entity_id=assignment.id,
                    action_url=build_action_url(
                        entity_type=NotificationEntityType.ASSIGNMENT,
                        notification_type=NotificationType.STALE_ASSIGNMENT,
                        for_assignee=False,
                    ),
                    dedup_key=f"STALENESS_ALERT:assignment:{assignment.id}:{alert.id}:{recipient_id}",
                )
            )
        return drafts


def assignment_person_name_public(db: Session, assignment_id: UUID) -> str:
    """Small convenience wrapper for callers outside this module that only
    have an assignment_id (e.g. services/alerts.py)."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        return "A team member"
    return assignment_person_name(db, assignment)


# ─────────────────────────────────────────────────────────────────────────
# NotificationService — guaranteed delivery layer
# ─────────────────────────────────────────────────────────────────────────

class NotificationService:
    """The only code path allowed to write to the `notifications` table.
    Owns dedup and is the boundary a future AI enrichment step attaches
    to — never the reverse."""

    # ---- Write side -----------------------------------------------------------

    @staticmethod
    def _exists_with_dedup_key(db: Session, dedup_key: str) -> bool:
        return db.query(Notification.id).filter(Notification.dedup_key == dedup_key).first() is not None

    @staticmethod
    def deliver(
        db: Session,
        drafts: Iterable[NotificationDraft],
    ) -> List[Notification]:
        """Persist notification drafts safely.

        Each notification is committed independently so that a failure
        with one notification does not prevent other notifications from
        being created.
        """

        created: List[Notification] = []

        if drafts is None:
            return created

        for draft in drafts:
            if draft is None:
                continue

            dedup_key = draft.dedup_key

            # Check for an existing notification with the same dedup key.
            try:
                if dedup_key and NotificationService._exists_with_dedup_key(
                    db,
                    dedup_key,
                ):
                    continue
            except Exception as exc:
                logger.exception(
                    "notification_dedup_check_failed "
                    "dedup_key=%r error=%r",
                    dedup_key,
                    exc,
                )
                try:
                    db.rollback()
                except Exception:
                    pass
                continue

            # Build notification row.
            try:
                row = Notification(
                    recipient_id=draft.recipient_id,

                    # IMPORTANT:
                    # Persist enum VALUE, not enum NAME.
                    type=draft.type.value,

                    message=(draft.message or "")[:2000],
                    action_url=draft.action_url,
                    severity=draft.severity.value,
                    entity_type=(
                        draft.entity_type.value
                        if draft.entity_type
                        else None
                    ),
                    entity_id=draft.entity_id,
                    requires_acknowledgement=draft.requires_acknowledgement,
                    dedup_key=dedup_key,
                )
            except Exception as exc:
                logger.exception(
                    "notification_row_build_failed "
                    "type=%r recipient_id=%r entity_id=%r error=%r",
                    getattr(draft.type, "value", draft.type),
                    draft.recipient_id,
                    draft.entity_id,
                    exc,
                )
                continue

            db.add(row)

            # Commit this notification independently.
            try:
                db.commit()

            except IntegrityError as exc:
                db.rollback()

                # Usually this means another request inserted the same
                # notification concurrently.
                duplicate_exists = False

                if dedup_key:
                    try:
                        duplicate_exists = (
                            NotificationService._exists_with_dedup_key(
                                db,
                                dedup_key,
                            )
                        )
                    except Exception:
                        duplicate_exists = False

                if duplicate_exists:
                    logger.debug(
                        "notification_duplicate_skipped "
                        "dedup_key=%r",
                        dedup_key,
                    )
                else:
                    logger.exception(
                        "notification_integrity_error "
                        "dedup_key=%r recipient_id=%r "
                        "entity_id=%r error=%r",
                        dedup_key,
                        row.recipient_id,
                        row.entity_id,
                        exc,
                    )

                continue

            except Exception as exc:
                db.rollback()

                logger.exception(
                    "notification_persistence_failed "
                    "dedup_key=%r recipient_id=%r "
                    "entity_id=%r error=%r",
                    dedup_key,
                    row.recipient_id,
                    row.entity_id,
                    exc,
                )

                continue

            # Refresh only after successful commit.
            try:
                db.refresh(row)
            except Exception as exc:
                logger.warning(
                    "notification_refresh_failed "
                    "notification_id=%r error=%r",
                    getattr(row, "id", None),
                    exc,
                )

            created.append(row)

        return created
    @staticmethod
    def notify(
        db: Session,
        drafts_factory: Callable[..., List[NotificationDraft]],
        *args,
        **kwargs,
    ) -> List[Notification]:
        """Safely generate and persist notifications without breaking CORE."""

        event = getattr(drafts_factory, "__name__", str(drafts_factory))

        try:
            entity_ids = [
                getattr(arg, "id", arg)
                for arg in args
                if hasattr(arg, "id") or isinstance(arg, (str, UUID))
            ]
        except Exception:
            entity_ids = []

        try:
            drafts = drafts_factory(db, *args, **kwargs)

            print(f"\nNOTIFICATION DEBUG: event={event}")
            print(f"NOTIFICATION DEBUG: drafts={len(drafts)}")

            for draft in drafts:
                print(
                    "NOTIFICATION DEBUG:",
                    "recipient=", draft.recipient_id,
                    "type=", draft.type,
                    "type_value=", draft.type.value,
                    "dedup_key=", draft.dedup_key,
                )

            created = NotificationService.deliver(db, drafts)

            print(f"NOTIFICATION DEBUG: created={len(created)}")

            for notification in created:
                print(
                    "NOTIFICATION DEBUG: saved",
                    notification.id,
                    notification.recipient_id,
                    notification.type,
                )

            return created

        except Exception as exc:
            print(
                f"\nNOTIFICATION ERROR: "
                f"event={event} "
                f"entity_ids={entity_ids} "
                f"{type(exc).__name__}: {exc}\n"
            )

            logger.exception(
                "notification_generation_failed event=%s entity_ids=%s error=%s "
                "— the triggering CORE operation is unaffected.",
                event,
                entity_ids,
                repr(exc),
            )

            try:
                db.rollback()
            except Exception:
                pass

            return []

        # ---- Read side -----------------------------------------------------------

    @staticmethod
    def list_for_recipient(
        db: Session, recipient_id: UUID, *, unread_only: bool = False, limit: int = 50, offset: int = 0
    ) -> List[Notification]:
        query = db.query(Notification).filter(Notification.recipient_id == recipient_id)
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))
        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def count_for_recipient(db: Session, recipient_id: UUID, *, unread_only: bool = False) -> int:
        query = db.query(Notification.id).filter(Notification.recipient_id == recipient_id)
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))
        return query.count()

    @staticmethod
    def count_action_required(db: Session, recipient_id: UUID) -> int:
        return (
            db.query(Notification.id)
            .filter(
                Notification.recipient_id == recipient_id,
                Notification.requires_acknowledgement.is_(True),
                Notification.acknowledged_at.is_(None),
            )
            .count()
        )

    @staticmethod
    def mark_read(db: Session, notification_id: UUID, *, actor_person_id: UUID) -> Notification:
        row = db.query(Notification).filter(Notification.id == notification_id).first()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
        if row.recipient_id != actor_person_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only mark your own notifications as read.",
            )
        if not row.is_read:
            row.is_read = True
            row.read_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(row)
        return row

    @staticmethod
    def mark_all_read(db: Session, actor_person_id: UUID) -> int:
        rows = (
            db.query(Notification)
            .filter(Notification.recipient_id == actor_person_id, Notification.is_read.is_(False))
            .all()
        )
        now = datetime.now(timezone.utc)
        for row in rows:
            row.is_read = True
            row.read_at = now
        if rows:
            db.commit()
        return len(rows)

    @staticmethod
    def acknowledge(db: Session, notification_id: UUID, *, actor_person_id: UUID) -> Notification:
        row = db.query(Notification).filter(Notification.id == notification_id).first()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
        if row.recipient_id != actor_person_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only acknowledge your own notifications.",
            )
        if not row.requires_acknowledgement:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This notification does not require acknowledgement.",
            )
        if not row.acknowledged_at:
            row.acknowledged_at = datetime.now(timezone.utc)
            row.acknowledged_by_id = actor_person_id
            if not row.is_read:
                row.is_read = True
                row.read_at = row.acknowledged_at
            db.commit()
            db.refresh(row)
        return row

    # ---- Sweep entrypoint ------------------------------------------------------

    @staticmethod
    def run_sweep(db: Session) -> int:
        """Deadline/overdue/escalation sweep. Intended to be invoked
        periodically by an external scheduler — CORE has no in-process job
        queue (see architecture doc §"No job queue")."""
        created = NotificationService.notify(db, NotificationRulesEngine.sweep_deadlines_and_overdue)
        return len(created)

