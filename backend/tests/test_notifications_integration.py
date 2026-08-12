"""
Integration tests: real CORE service methods (AssignmentsService,
StatusUpdatesService, ProjectsService) wired to the notification engine —
not just the rules engine in isolation. Confirms the actual hook points
added to those services behave correctly, and that a failure inside
notification generation can never break the CORE write it's attached to.
"""
from datetime import datetime, timedelta, timezone

from src.core.config import settings
from src.models.notification import Notification
from src.schemas.assignments import AssignmentUpdate
from src.schemas.projects import ProjectUpdate
from src.schemas.status_updates import StatusUpdateCreate
from src.services.assignments import AssignmentsService
from src.services.projects import ProjectsService
from src.services.status_updates import StatusUpdatesService
from src.services.notifications import NotificationRulesEngine, NotificationService


def _notifications_for(db, person_id):
    return db.query(Notification).filter(Notification.recipient_id == person_id).all()


def test_create_assignment_wiring_notifies_the_assignee(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id, name="New Portal")

    from src.schemas.assignments import AssignmentCreate

    AssignmentsService.create_assignment(
        AssignmentCreate(project_id=str(project.id), person_id=str(person.id), role="developer"), db
    )

    notifications = _notifications_for(db, person.id)
    assert any(n.type == "WORK_ASSIGNED" for n in notifications)


def test_update_assignment_person_wiring_notifies_both_parties(db, factory):
    dept = factory.department()
    old_person = factory.person()
    new_person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=old_person.id, project_id=project.id)

    AssignmentsService.update_assignment(str(assignment.id), AssignmentUpdate(person_id=str(new_person.id)), db)

    assert any(n.type == "WORK_REASSIGNED" for n in _notifications_for(db, old_person.id))
    assert any(n.type == "WORK_REASSIGNED" for n in _notifications_for(db, new_person.id))


def test_update_assignment_to_done_wiring_notifies_completion(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    AssignmentsService.update_assignment(str(assignment.id), AssignmentUpdate(status="done"), db)

    assert any(n.type == "WORK_COMPLETED" for n in _notifications_for(db, person.id))


def test_status_update_wiring_blocked_then_resolved(db, factory):
    dept = factory.department()
    manager = factory.person(role="manager")
    person = factory.person(manager_id=manager.id)
    project = factory.project(department_id=dept.id, priority="medium")
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    StatusUpdatesService.create_status_update(
        str(assignment.id),
        StatusUpdateCreate(author_id=str(person.id), status="blocked", message="stuck", blockers="waiting on infra"),
        db,
    )
    assert any(n.type == "BLOCKER_CREATED" for n in _notifications_for(db, person.id))
    assert any(n.type == "BLOCKER_CREATED" for n in _notifications_for(db, manager.id))

    StatusUpdatesService.create_status_update(
        str(assignment.id),
        StatusUpdateCreate(author_id=str(person.id), status="on_track", message="unblocked"),
        db,
    )
    assert any(n.type == "BLOCKER_RESOLVED" for n in _notifications_for(db, person.id))
    assert any(n.type == "BLOCKER_RESOLVED" for n in _notifications_for(db, manager.id))


def test_project_priority_update_wiring_notifies_assignees(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id, priority="medium")
    factory.assignment(person_id=person.id, project_id=project.id)

    ProjectsService.update_project(str(project.id), ProjectUpdate(priority="critical"), db)

    assert any(n.type == "PRIORITY_CHANGED" for n in _notifications_for(db, person.id))


def test_staleness_alert_wiring_notifies_assignee_and_manager(db, factory):
    """AlertsService.report_stale_assignment is the one place a
    StalenessAlert row is created (reusing the existing staleness_alerts
    table, not a competing detection engine) — confirms it also produces
    guaranteed notifications for both the stale assignee and their
    manager, using the assignee's real Person.full_name."""
    from src.services.alerts import AlertsService

    dept = factory.department()
    manager = factory.person(role="manager")
    person = factory.person(manager_id=manager.id, full_name="Priya Stale-Test")
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    alert = AlertsService.report_stale_assignment(
        db, assignment_id=assignment.id, severity="medium", reason="No check-in this week", days_since_update=9
    )

    assert alert.id is not None
    employee_notifications = _notifications_for(db, person.id)
    manager_notifications = _notifications_for(db, manager.id)
    assert len(employee_notifications) == 1
    assert "9 days" in employee_notifications[0].message
    assert len(manager_notifications) == 1
    assert "Priya Stale-Test" in manager_notifications[0].message
    assert person.full_name not in employee_notifications[0].message  # never show the recipient their own name


def test_notification_bug_never_breaks_assignment_creation(db, factory, monkeypatch):
    """The generalized §17 guarantee, exercised through the real wiring:
    even if notification generation raises, creating the assignment
    itself must still succeed and return normally."""
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)

    def _broken(*args, **kwargs):
        raise RuntimeError("simulated failure inside the rules engine")

    monkeypatch.setattr(NotificationRulesEngine, "on_assignment_created", _broken)

    from src.schemas.assignments import AssignmentCreate

    response = AssignmentsService.create_assignment(
        AssignmentCreate(project_id=str(project.id), person_id=str(person.id)), db
    )

    assert response.person_id == person.id  # the assignment itself was created successfully


# ── Full acceptance scenario (architecture doc §36 / spec §36) ─────────────

def test_full_acceptance_scenario_end_to_end(db, factory):
    """
    Critical work assigned -> guaranteed notification.
    Blocker raised on critical work -> guaranteed CRITICAL_BLOCKER to
        employee + manager, requiring acknowledgement.
    Blocker remains unresolved past the escalation threshold -> sweep
        creates ESCALATION_REQUIRED for the manager.
    Manager acknowledges.
    Blocker is resolved -> BLOCKER_RESOLVED notification generated, and a
        second sweep creates NO further escalation (escalation "stops").
    No duplicate alerts exist at any point.
    """
    dept = factory.department()
    manager = factory.person(role="manager", full_name="Manager Mia")
    employee = factory.person(manager_id=manager.id, full_name="Employee Alex")
    project = factory.project(department_id=dept.id, priority="critical", name="Payment Integration")
    assignment = factory.assignment(person_id=employee.id, project_id=project.id)

    # 1. Assignment created -> guaranteed WORK_ASSIGNED
    NotificationService.notify(db, NotificationRulesEngine.on_assignment_created, assignment)
    assert any(n.type == "WORK_ASSIGNED" for n in _notifications_for(db, employee.id))

    # 2. Blocker raised -> CRITICAL_BLOCKER to employee + manager, ack required
    su = factory.status_update(
        assignment_id=assignment.id, author_id=employee.id, status="blocked", blockers="Finance approval pending"
    )
    NotificationService.notify(db, NotificationRulesEngine.on_status_update_created, assignment, su, "on_track")

    employee_notifications = _notifications_for(db, employee.id)
    manager_notifications = _notifications_for(db, manager.id)
    assert any(n.type == "CRITICAL_BLOCKER" and n.requires_acknowledgement for n in employee_notifications)
    manager_blocker = next(n for n in manager_notifications if n.type == "CRITICAL_BLOCKER")
    assert manager_blocker.requires_acknowledgement is True
    assert manager_blocker.acknowledged_at is None

    # 3. Blocker ages past the high-priority escalation threshold -> sweep escalates
    su.created_at = datetime.now(timezone.utc) - timedelta(
        hours=settings.notification_escalation_hours_high_priority + 1
    )
    db.commit()
    NotificationService.run_sweep(db)

    escalations = [n for n in _notifications_for(db, manager.id) if n.type == "ESCALATION_REQUIRED"]
    assert len(escalations) == 1
    assert escalations[0].requires_acknowledgement is True

    # Running the sweep again the same day must not create a duplicate
    # escalation (fatigue/dedup guarantee).
    NotificationService.run_sweep(db)
    escalations_after_second_sweep = [
        n for n in _notifications_for(db, manager.id) if n.type == "ESCALATION_REQUIRED"
    ]
    assert len(escalations_after_second_sweep) == 1

    # 4. Manager acknowledges the escalation.
    acknowledged = NotificationService.acknowledge(db, escalations[0].id, actor_person_id=manager.id)
    assert acknowledged.acknowledged_at is not None
    assert acknowledged.acknowledged_by_id == manager.id

    # 5. Blocker is resolved -> BLOCKER_RESOLVED notification generated.
    resolution_update = factory.status_update(assignment_id=assignment.id, author_id=employee.id, status="on_track")
    NotificationService.notify(
        db, NotificationRulesEngine.on_status_update_created, assignment, resolution_update, "blocked"
    )
    assert any(n.type == "BLOCKER_RESOLVED" for n in _notifications_for(db, employee.id))
    assert any(n.type == "BLOCKER_RESOLVED" for n in _notifications_for(db, manager.id))

    # 6. Escalation stops: a further sweep must not re-escalate a resolved blocker.
    NotificationService.run_sweep(db)
    final_escalations = [n for n in _notifications_for(db, manager.id) if n.type == "ESCALATION_REQUIRED"]
    assert len(final_escalations) == 1  # unchanged — no new escalation was created

    # 7. No duplicate alerts of any type exist anywhere in this scenario.
    all_notifications = _notifications_for(db, employee.id) + _notifications_for(db, manager.id)
    dedup_keys = [n.dedup_key for n in all_notifications if n.dedup_key]
    assert len(dedup_keys) == len(set(dedup_keys))
