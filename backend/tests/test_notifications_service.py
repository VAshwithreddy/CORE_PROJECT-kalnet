"""
NotificationService test suite — dedup guarantees, resilience, and the
read/acknowledge/list API. Still zero AI involved (see
test_notifications_rules_engine.py's module docstring) — this is testing
the guaranteed-delivery layer itself, not anything that could be affected
by an AI provider.
"""
import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from src.models.enums import NotificationEntityType, NotificationSeverity, NotificationType
from src.models.notification import Notification
from src.services.notifications import NotificationDraft, NotificationService


def _draft(person_id, project_id, dedup_key=None, requires_ack=False):
    return NotificationDraft(
        recipient_id=person_id,
        type=NotificationType.WORK_ASSIGNED,
        severity=NotificationSeverity.INFO,
        message="Test message",
        entity_type=NotificationEntityType.ASSIGNMENT,
        entity_id=project_id,  # any UUID works — not FK-constrained
        requires_acknowledgement=requires_ack,
        dedup_key=dedup_key,
    )


# ── deliver() / dedup ───────────────────────────────────────────────────────

def test_deliver_persists_a_notification(db, factory):
    person = factory.person()
    created = NotificationService.deliver(db, [_draft(person.id, person.id)])

    assert len(created) == 1
    row = db.query(Notification).filter(Notification.id == created[0].id).first()
    assert row is not None
    assert row.recipient_id == person.id


def test_deliver_skips_a_second_draft_with_the_same_dedup_key(db, factory):
    person = factory.person()
    drafts = [_draft(person.id, person.id, dedup_key="dup:1"), _draft(person.id, person.id, dedup_key="dup:1")]

    created = NotificationService.deliver(db, drafts)

    assert len(created) == 1
    assert db.query(Notification).filter(Notification.dedup_key == "dup:1").count() == 1


def test_deliver_across_two_separate_calls_still_dedupes(db, factory):
    """Simulates two separate requests (e.g. two retried API calls) rather
    than one batch — the dedup guarantee must hold across calls, not just
    within a single `deliver()` invocation."""
    person = factory.person()
    NotificationService.deliver(db, [_draft(person.id, person.id, dedup_key="dup:2")])
    NotificationService.deliver(db, [_draft(person.id, person.id, dedup_key="dup:2")])

    assert db.query(Notification).filter(Notification.dedup_key == "dup:2").count() == 1


def test_dedup_key_uniqueness_is_enforced_at_the_database_level(db, factory):
    """Verifies migrations/003_notification_system.sql's partial unique
    index actually exists and is enforced — the real guarantee under
    concurrent requests, independent of the application-level pre-check
    in NotificationService.deliver()."""
    person = factory.person()
    db.add(
        Notification(
            recipient_id=person.id, type="WORK_ASSIGNED", message="a", severity="info", dedup_key="race-key"
        )
    )
    db.commit()

    db.add(
        Notification(
            recipient_id=person.id, type="WORK_ASSIGNED", message="b", severity="info", dedup_key="race-key"
        )
    )
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_notifications_without_dedup_key_can_repeat_freely(db, factory):
    person = factory.person()
    created = NotificationService.deliver(db, [_draft(person.id, person.id), _draft(person.id, person.id)])

    assert len(created) == 2


# ── notify() resilience ─────────────────────────────────────────────────────

def test_notify_swallows_exceptions_from_a_broken_rules_engine(db, factory):
    """The core guarantee: a bug in notification generation must never
    propagate to (or appear to break) the caller — mirrors architecture
    doc §17's AI-failure guarantee, generalized to this layer."""

    def _broken(db, *a, **kw):
        raise RuntimeError("simulated bug in a rule")

    result = NotificationService.notify(db, _broken)

    assert result == []  # did not raise


def test_notify_leaves_the_session_usable_after_a_failure(db, factory):
    """After `notify()` swallows an exception, the same db session must
    still be usable for whatever the caller does next."""

    def _broken(db, *a, **kw):
        raise RuntimeError("simulated bug")

    NotificationService.notify(db, _broken)

    person = factory.person()  # would raise if the session were wedged
    assert person.id is not None


# ── read side ────────────────────────────────────────────────────────────────

def test_list_for_recipient_only_returns_that_recipients_notifications(db, factory):
    a = factory.person()
    b = factory.person()
    NotificationService.deliver(db, [_draft(a.id, a.id, dedup_key="a1")])
    NotificationService.deliver(db, [_draft(b.id, b.id, dedup_key="b1")])

    a_notifications = NotificationService.list_for_recipient(db, a.id)

    assert len(a_notifications) == 1
    assert a_notifications[0].recipient_id == a.id


def test_list_for_recipient_unread_only_filter(db, factory):
    person = factory.person()
    created = NotificationService.deliver(
        db, [_draft(person.id, person.id, dedup_key="r1"), _draft(person.id, person.id, dedup_key="r2")]
    )
    NotificationService.mark_read(db, created[0].id, actor_person_id=person.id)

    unread = NotificationService.list_for_recipient(db, person.id, unread_only=True)

    assert len(unread) == 1
    assert unread[0].id == created[1].id


def test_mark_read_sets_is_read_and_read_at(db, factory):
    person = factory.person()
    created = NotificationService.deliver(db, [_draft(person.id, person.id)])

    row = NotificationService.mark_read(db, created[0].id, actor_person_id=person.id)

    assert row.is_read is True
    assert row.read_at is not None


def test_mark_read_forbidden_for_non_owner(db, factory):
    owner = factory.person()
    other = factory.person()
    created = NotificationService.deliver(db, [_draft(owner.id, owner.id)])

    with pytest.raises(HTTPException) as exc_info:
        NotificationService.mark_read(db, created[0].id, actor_person_id=other.id)

    assert exc_info.value.status_code == 403


def test_mark_all_read_updates_every_unread_row(db, factory):
    person = factory.person()
    NotificationService.deliver(
        db, [_draft(person.id, person.id, dedup_key="m1"), _draft(person.id, person.id, dedup_key="m2")]
    )

    updated = NotificationService.mark_all_read(db, person.id)

    assert updated == 2
    assert all(n.is_read for n in NotificationService.list_for_recipient(db, person.id))


def test_acknowledge_requires_requires_acknowledgement_flag(db, factory):
    person = factory.person()
    created = NotificationService.deliver(db, [_draft(person.id, person.id, requires_ack=False)])

    with pytest.raises(HTTPException) as exc_info:
        NotificationService.acknowledge(db, created[0].id, actor_person_id=person.id)

    assert exc_info.value.status_code == 400


def test_acknowledge_happy_path_also_marks_read(db, factory):
    person = factory.person()
    created = NotificationService.deliver(db, [_draft(person.id, person.id, requires_ack=True)])

    row = NotificationService.acknowledge(db, created[0].id, actor_person_id=person.id)

    assert row.acknowledged_at is not None
    assert row.acknowledged_by_id == person.id
    assert row.is_read is True


def test_acknowledge_forbidden_for_non_owner(db, factory):
    owner = factory.person()
    other = factory.person()
    created = NotificationService.deliver(db, [_draft(owner.id, owner.id, requires_ack=True)])

    with pytest.raises(HTTPException) as exc_info:
        NotificationService.acknowledge(db, created[0].id, actor_person_id=other.id)

    assert exc_info.value.status_code == 403


# ── sweep ────────────────────────────────────────────────────────────────────

def test_run_sweep_returns_zero_with_nothing_to_do(db):
    assert NotificationService.run_sweep(db) == 0


def test_run_sweep_persists_created_notifications(db, factory, yesterday):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    factory.assignment(person_id=person.id, project_id=project.id, end_date=yesterday)

    created_count = NotificationService.run_sweep(db)

    assert created_count >= 1
    assert any(n.type == "WORK_OVERDUE" for n in NotificationService.list_for_recipient(db, person.id))


def test_sweep_is_idempotent_across_repeated_runs(db, factory, yesterday):
    """Referenced directly in api/notifications.py's /sweep docstring —
    running the sweep twice in a row (e.g. an overlapping cron tick, or a
    manual re-trigger) must create zero additional notifications the
    second time, for every rule the sweep evaluates: overdue, deadline-
    approaching, and escalation."""
    dept = factory.department()
    manager = factory.person(role="manager")
    person = factory.person(manager_id=manager.id)
    project = factory.project(department_id=dept.id, priority="critical")
    factory.assignment(person_id=person.id, project_id=project.id, end_date=yesterday)

    blocked_assignment = factory.assignment(person_id=person.id, project_id=project.id)
    su = factory.status_update(assignment_id=blocked_assignment.id, author_id=person.id, status="blocked")
    from datetime import datetime, timezone, timedelta as _td

    su.created_at = datetime.now(timezone.utc) - _td(hours=72)
    db.commit()

    first_run = NotificationService.run_sweep(db)
    second_run = NotificationService.run_sweep(db)

    assert first_run > 0  # sanity check — the scenario actually produced notifications
    assert second_run == 0
    total_notifications = len(NotificationService.list_for_recipient(db, person.id)) + len(
        NotificationService.list_for_recipient(db, manager.id)
    )
    assert total_notifications == first_run  # confirms nothing was double-counted either
