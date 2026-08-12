"""
Layer A test suite — the deterministic rules engine and its context
helpers. Nothing here touches AI in any way; these tests should pass
identically whether or not Layer B ever gets built. Covers the
non-AI-dependent subset of docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md
§Phase 6 test list.
"""
from datetime import date, timedelta

from src.models.enums import NotificationSeverity, NotificationType
from src.services.notifications import (
    NotificationRulesEngine,
    escalation_threshold_hours,
    get_current_blocker_state,
    get_escalation_recipients,
    hours_overdue,
    is_deadline_approaching,
    is_overdue,
)


# ── on_assignment_created ──────────────────────────────────────────────────

def test_assignment_created_notifies_the_assignee(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id, name="Payment Integration")
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    drafts = NotificationRulesEngine.on_assignment_created(db, assignment)

    assert len(drafts) == 1
    assert drafts[0].recipient_id == person.id
    assert drafts[0].type == NotificationType.WORK_ASSIGNED
    assert "Payment Integration" in drafts[0].message
    assert drafts[0].dedup_key == f"WORK_ASSIGNED:assignment:{assignment.id}"


# ── on_assignment_reassigned ───────────────────────────────────────────────

def test_reassignment_notifies_both_old_and_new_assignee(db, factory):
    dept = factory.department()
    old_person = factory.person(full_name="Old Assignee")
    new_person = factory.person(full_name="New Assignee")
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=new_person.id, project_id=project.id)

    drafts = NotificationRulesEngine.on_assignment_reassigned(db, assignment, old_person.id)

    recipients = {d.recipient_id for d in drafts}
    assert recipients == {old_person.id, new_person.id}
    assert all(d.type == NotificationType.WORK_REASSIGNED for d in drafts)


def test_reassignment_is_a_noop_when_person_is_unchanged(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    drafts = NotificationRulesEngine.on_assignment_reassigned(db, assignment, person.id)

    assert drafts == []


# ── on_status_update_created: blocker transitions ──────────────────────────

def test_transition_into_blocked_creates_blocker_notification(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id, priority="medium")
    assignment = factory.assignment(person_id=person.id, project_id=project.id)
    su = factory.status_update(
        assignment_id=assignment.id, author_id=person.id, status="blocked", blockers="Waiting on API spec"
    )

    drafts = NotificationRulesEngine.on_status_update_created(db, assignment, su, previous_status="on_track")

    assignee_drafts = [d for d in drafts if d.recipient_id == person.id]
    assert len(assignee_drafts) == 1
    assert assignee_drafts[0].type == NotificationType.BLOCKER_CREATED
    assert assignee_drafts[0].severity == NotificationSeverity.WARNING
    assert assignee_drafts[0].message.startswith("You reported a blocker on")
    assert "Waiting on API spec" in assignee_drafts[0].message
    assert assignee_drafts[0].requires_acknowledgement is False


def test_transition_into_blocked_on_critical_project_is_a_critical_blocker(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id, priority="critical")
    assignment = factory.assignment(person_id=person.id, project_id=project.id)
    su = factory.status_update(assignment_id=assignment.id, author_id=person.id, status="blocked", blockers="DB down")

    drafts = NotificationRulesEngine.on_status_update_created(db, assignment, su, previous_status="on_track")

    assignee_draft = next(d for d in drafts if d.recipient_id == person.id)
    assert assignee_draft.type == NotificationType.CRITICAL_BLOCKER
    assert assignee_draft.severity == NotificationSeverity.CRITICAL
    assert assignee_draft.requires_acknowledgement is True


def test_staying_blocked_does_not_refire_blocker_created(db, factory):
    """The transition-detection guard: a second consecutive 'blocked'
    status update must not create a second BLOCKER_CREATED — this is what
    keeps the deterministic layer from spamming on every check-in."""
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)
    su = factory.status_update(assignment_id=assignment.id, author_id=person.id, status="blocked")

    drafts = NotificationRulesEngine.on_status_update_created(db, assignment, su, previous_status="blocked")

    assert drafts == []


def test_transition_out_of_blocked_creates_resolution_notification(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)
    su = factory.status_update(assignment_id=assignment.id, author_id=person.id, status="on_track")

    drafts = NotificationRulesEngine.on_status_update_created(db, assignment, su, previous_status="blocked")

    assignee_drafts = [d for d in drafts if d.recipient_id == person.id]
    assert len(assignee_drafts) == 1
    assert assignee_drafts[0].type == NotificationType.BLOCKER_RESOLVED


def test_resolved_blocker_never_also_triggers_escalation(db, factory):
    """Regression guard named explicitly in the architecture doc's test
    list: 'resolved blocker → no invalid escalation'."""
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id, priority="critical")
    assignment = factory.assignment(person_id=person.id, project_id=project.id)
    su = factory.status_update(assignment_id=assignment.id, author_id=person.id, status="on_track")

    drafts = NotificationRulesEngine.on_status_update_created(db, assignment, su, previous_status="blocked")

    assert all(d.type != NotificationType.ESCALATION_REQUIRED for d in drafts)


def test_status_update_marked_completed_triggers_work_completed(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)
    su = factory.status_update(assignment_id=assignment.id, author_id=person.id, status="completed")

    drafts = NotificationRulesEngine.on_status_update_created(db, assignment, su, previous_status="on_track")

    assert any(d.type == NotificationType.WORK_COMPLETED and d.recipient_id == person.id for d in drafts)


# ── on_project_priority_changed ────────────────────────────────────────────

def test_priority_change_notifies_open_assignees_only(db, factory):
    dept = factory.department()
    active_person = factory.person(full_name="Active")
    done_person = factory.person(full_name="Done")
    project = factory.project(department_id=dept.id, priority="medium")
    factory.assignment(person_id=active_person.id, project_id=project.id, status="on_track")
    factory.assignment(person_id=done_person.id, project_id=project.id, status="done")

    project.priority = "critical"
    drafts = NotificationRulesEngine.on_project_priority_changed(db, project, previous_priority="medium")

    recipients = {d.recipient_id for d in drafts}
    assert recipients == {active_person.id}
    assert drafts[0].type == NotificationType.PRIORITY_CHANGED


def test_unchanged_priority_produces_no_drafts(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id, priority="medium")
    factory.assignment(person_id=person.id, project_id=project.id)

    drafts = NotificationRulesEngine.on_project_priority_changed(db, project, previous_priority="medium")

    assert drafts == []


# ── get_current_blocker_state ──────────────────────────────────────────────

def test_blocker_state_not_blocked_with_no_history(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    state = get_current_blocker_state(db, assignment.id)

    assert state.is_blocked is False


def test_blocker_state_finds_the_start_of_the_current_streak(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    factory.status_update(assignment_id=assignment.id, author_id=person.id, status="on_track")
    first_blocked = factory.status_update(assignment_id=assignment.id, author_id=person.id, status="blocked")
    factory.status_update(assignment_id=assignment.id, author_id=person.id, status="blocked")

    state = get_current_blocker_state(db, assignment.id)

    assert state.is_blocked is True
    assert state.triggering_status_update_id == first_blocked.id


def test_blocker_state_not_blocked_when_latest_update_cleared_it(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    factory.status_update(assignment_id=assignment.id, author_id=person.id, status="blocked")
    factory.status_update(assignment_id=assignment.id, author_id=person.id, status="on_track")

    state = get_current_blocker_state(db, assignment.id)

    assert state.is_blocked is False


# ── is_overdue / hours_overdue / is_deadline_approaching ───────────────────

def test_completed_work_is_never_overdue_even_past_due_date(db, factory, yesterday):
    """Named explicitly in the architecture doc's test list: 'completed
    work → not incorrectly marked overdue'."""
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id, status="done", end_date=yesterday)

    assert is_overdue(assignment) is False
    assert hours_overdue(assignment) == 0.0


def test_open_assignment_past_due_date_is_overdue(db, factory, yesterday):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id, status="on_track", end_date=yesterday)

    assert is_overdue(assignment) is True
    assert hours_overdue(assignment) >= 24.0


def test_assignment_without_end_date_is_never_overdue_or_approaching(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id, end_date=None)

    assert is_overdue(assignment) is False
    assert is_deadline_approaching(assignment, warning_hours=48) is False


def test_deadline_within_warning_window_is_approaching(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    soon = date.today() + timedelta(days=1)
    assignment = factory.assignment(person_id=person.id, project_id=project.id, end_date=soon)

    assert is_deadline_approaching(assignment, warning_hours=48) is True
    assert is_overdue(assignment) is False


def test_deadline_far_in_future_is_not_approaching(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    far = date.today() + timedelta(days=30)
    assignment = factory.assignment(person_id=person.id, project_id=project.id, end_date=far)

    assert is_deadline_approaching(assignment, warning_hours=48) is False


# ── escalation thresholds & recipients ─────────────────────────────────────

def test_escalation_threshold_is_shorter_for_high_priority_projects(db, factory):
    dept = factory.department()
    high = factory.project(department_id=dept.id, priority="critical")
    low = factory.project(department_id=dept.id, priority="low")

    assert escalation_threshold_hours(high) < escalation_threshold_hours(low)


def test_escalation_recipients_prefer_manager(db, factory):
    dept = factory.department()
    manager = factory.person(role="manager")
    person = factory.person(manager_id=manager.id)
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    recipients = get_escalation_recipients(db, assignment)

    assert manager.id in recipients


def test_escalation_recipients_fall_back_to_department_head_without_manager(db, factory):
    head = factory.person(role="department_head")
    dept = factory.department(head_person_id=head.id)
    person = factory.person()  # no manager_id
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    recipients = get_escalation_recipients(db, assignment)

    assert head.id in recipients


def test_escalation_recipients_fall_back_to_work_admin_when_org_data_is_missing(db, factory):
    """A critical event must never end up with zero recipients just
    because manager_id / department head are unset."""
    admin = factory.person(role="work_admin")
    dept = factory.department()  # no head_person_id
    person = factory.person()  # no manager_id
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    recipients = get_escalation_recipients(db, assignment)

    assert admin.id in recipients
    assert len(recipients) >= 1


# ── sweep_deadlines_and_overdue ────────────────────────────────────────────

def test_sweep_flags_overdue_and_approaching_assignments(db, factory, yesterday, tomorrow):
    dept = factory.department()
    person_overdue = factory.person(full_name="Overdue Person")
    person_soon = factory.person(full_name="Soon Person")
    project = factory.project(department_id=dept.id)
    factory.assignment(person_id=person_overdue.id, project_id=project.id, end_date=yesterday)
    factory.assignment(person_id=person_soon.id, project_id=project.id, end_date=tomorrow)

    drafts = NotificationRulesEngine.sweep_deadlines_and_overdue(db)

    types_by_recipient = {d.recipient_id: d.type for d in drafts}
    assert types_by_recipient[person_overdue.id] == NotificationType.WORK_OVERDUE
    assert types_by_recipient[person_soon.id] == NotificationType.DEADLINE_APPROACHING


def test_sweep_never_flags_completed_work_as_overdue(db, factory, yesterday):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    factory.assignment(person_id=person.id, project_id=project.id, status="done", end_date=yesterday)

    drafts = NotificationRulesEngine.sweep_deadlines_and_overdue(db)

    assert drafts == []


def test_sweep_escalates_long_unresolved_blockers_on_critical_projects(db, factory):
    dept = factory.department()
    manager = factory.person(role="manager")
    person = factory.person(manager_id=manager.id)
    project = factory.project(department_id=dept.id, priority="critical")
    assignment = factory.assignment(person_id=person.id, project_id=project.id)

    # Backdate the blocking status update past the high-priority escalation
    # threshold by writing directly (factory always stamps "now").
    su = factory.status_update(assignment_id=assignment.id, author_id=person.id, status="blocked")
    from datetime import datetime, timezone

    su.created_at = datetime.now(timezone.utc) - timedelta(hours=72)
    db.commit()

    drafts = NotificationRulesEngine.sweep_deadlines_and_overdue(db)

    escalations = [d for d in drafts if d.type == NotificationType.ESCALATION_REQUIRED]
    assert any(d.recipient_id == manager.id for d in escalations)
    assert all(d.requires_acknowledgement for d in escalations)


def test_sweep_does_not_escalate_a_freshly_created_blocker(db, factory):
    dept = factory.department()
    manager = factory.person(role="manager")
    person = factory.person(manager_id=manager.id)
    project = factory.project(department_id=dept.id, priority="critical")
    assignment = factory.assignment(person_id=person.id, project_id=project.id)
    factory.status_update(assignment_id=assignment.id, author_id=person.id, status="blocked")

    drafts = NotificationRulesEngine.sweep_deadlines_and_overdue(db)

    assert all(d.type != NotificationType.ESCALATION_REQUIRED for d in drafts)
