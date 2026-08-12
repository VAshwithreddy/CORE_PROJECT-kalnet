"""
API-level tests for the notifications router, via FastAPI's TestClient
with real JWTs (see conftest.py's auth_headers fixture). This is the
layer that actually proves authorization and cross-user isolation work
end-to-end over HTTP — the service-layer tests in
test_notifications_service.py exercise the same logic directly, but
don't prove the API wiring (dependency injection, RLS session, route
authorization) is correct.
"""
from uuid import uuid4

from fastapi.testclient import TestClient

from src.main import app
from src.services.notifications import NotificationDraft, NotificationService
from src.models.enums import NotificationEntityType, NotificationSeverity, NotificationType

client = TestClient(app)


def _deliver(db, person_id, *, dedup_key=None, requires_ack=False, is_read=False):
    created = NotificationService.deliver(
        db,
        [
            NotificationDraft(
                recipient_id=person_id,
                type=NotificationType.WORK_ASSIGNED,
                severity=NotificationSeverity.INFO,
                message="Test notification",
                entity_type=NotificationEntityType.ASSIGNMENT,
                entity_id=uuid4(),
                requires_acknowledgement=requires_ack,
                dedup_key=dedup_key,
            )
        ],
    )
    if created and is_read:
        NotificationService.mark_read(db, created[0].id, actor_person_id=person_id)
    return created[0] if created else None


# ── isolation / IDOR ────────────────────────────────────────────────────────

def test_get_notifications_only_returns_callers_own(db, factory, auth_headers):
    alice = factory.person(full_name="Alice")
    bob = factory.person(full_name="Bob")
    _deliver(db, alice.id, dedup_key="alice-1")
    _deliver(db, bob.id, dedup_key="bob-1")

    response = client.get("/api/v1/notifications", headers=auth_headers(alice))

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["message"] == "Test notification"


def test_get_notifications_requires_authentication(db, factory):
    response = client.get("/api/v1/notifications")
    assert response.status_code in (401, 403)


def test_cannot_mark_another_users_notification_as_read(db, factory, auth_headers):
    owner = factory.person()
    attacker = factory.person()
    notification = _deliver(db, owner.id, dedup_key="owned-by-owner")

    response = client.post(f"/api/v1/notifications/{notification.id}/read", headers=auth_headers(attacker))

    assert response.status_code == 403
    # Confirm it genuinely wasn't marked read despite the attempt.
    check = client.get("/api/v1/notifications", headers=auth_headers(owner)).json()
    assert check["items"][0]["is_read"] is False


def test_cannot_acknowledge_another_users_notification(db, factory, auth_headers):
    owner = factory.person()
    attacker = factory.person()
    notification = _deliver(db, owner.id, dedup_key="owned-ack", requires_ack=True)

    response = client.post(f"/api/v1/notifications/{notification.id}/acknowledge", headers=auth_headers(attacker))

    assert response.status_code == 403


def test_cannot_enrich_another_users_notification(db, factory, auth_headers):
    owner = factory.person()
    attacker = factory.person()
    notification = _deliver(db, owner.id, dedup_key="owned-enrich")

    response = client.post(f"/api/v1/notifications/{notification.id}/enrich", headers=auth_headers(attacker))

    assert response.status_code == 403


def test_sweep_endpoint_forbidden_for_regular_employee(db, factory, auth_headers):
    employee = factory.person(role="employee")
    response = client.post("/api/v1/notifications/sweep", headers=auth_headers(employee))
    assert response.status_code == 403


def test_sweep_endpoint_allowed_for_work_admin(db, factory, auth_headers):
    admin = factory.person(role="work_admin")
    response = client.post("/api/v1/notifications/sweep", headers=auth_headers(admin))
    assert response.status_code == 201


def test_enrich_pending_forbidden_for_regular_employee(db, factory, auth_headers):
    employee = factory.person(role="employee")
    response = client.post("/api/v1/notifications/enrich-pending", headers=auth_headers(employee))
    assert response.status_code == 403


# ── unread filter / counts ──────────────────────────────────────────────────

def test_unread_only_filter(db, factory, auth_headers):
    person = factory.person()
    _deliver(db, person.id, dedup_key="read-1", is_read=True)
    _deliver(db, person.id, dedup_key="unread-1")

    response = client.get("/api/v1/notifications?unread_only=true", headers=auth_headers(person))

    body = response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["is_read"] is False


def test_dedicated_unread_endpoint_matches_the_query_param_filter(db, factory, auth_headers):
    person = factory.person()
    _deliver(db, person.id, dedup_key="read-2", is_read=True)
    _deliver(db, person.id, dedup_key="unread-2")

    via_query_param = client.get("/api/v1/notifications?unread_only=true", headers=auth_headers(person)).json()
    via_dedicated_endpoint = client.get("/api/v1/notifications/unread", headers=auth_headers(person)).json()

    assert len(via_dedicated_endpoint["items"]) == 1
    assert via_dedicated_endpoint["items"][0]["id"] == via_query_param["items"][0]["id"]
    assert via_dedicated_endpoint["unread_count"] == via_query_param["unread_count"]


def test_malformed_notification_id_returns_422_not_500(db, factory, auth_headers):
    person = factory.person()
    for bad_id in ["not-a-uuid", "1", "'; DROP TABLE notifications; --"]:
        response = client.post(f"/api/v1/notifications/{bad_id}/read", headers=auth_headers(person))
        assert response.status_code == 422, f"id={bad_id!r} should 422, got {response.status_code}"


def test_staleness_notification_uses_stale_type_not_overdue(db, factory, auth_headers):
    """Regression guard: staleness (no progress update) must never be
    reported as WORK_OVERDUE (deadline passed) — they're different
    conditions. See docs/NOTIFICATION_INTELLIGENCE_ARCHITECTURE.md,
    'Staleness vs overdue are not the same thing'."""
    from src.services.alerts import AlertsService

    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id, end_date=None)
    AlertsService.report_stale_assignment(
        db, assignment_id=assignment.id, severity="medium", reason="no check-in", days_since_update=10
    )

    response = client.get("/api/v1/notifications", headers=auth_headers(person)).json()

    assert len(response["items"]) == 1
    assert response["items"][0]["type"] == "STALE_ASSIGNMENT"
    assert response["items"][0]["type"] != "WORK_OVERDUE"


def test_counts_reflect_full_inbox_not_just_current_page(db, factory, auth_headers):
    person = factory.person()
    for i in range(5):
        _deliver(db, person.id, dedup_key=f"count-test-{i}")

    response = client.get("/api/v1/notifications?limit=2", headers=auth_headers(person))

    body = response.json()
    assert len(body["items"]) == 2  # page size respected
    assert body["total_count"] == 5  # but counts reflect the whole inbox
    assert body["unread_count"] == 5


# ── pagination ──────────────────────────────────────────────────────────────

def test_pagination_limit_and_offset(db, factory, auth_headers):
    person = factory.person()
    for i in range(5):
        _deliver(db, person.id, dedup_key=f"page-test-{i}")

    page1 = client.get("/api/v1/notifications?limit=2&offset=0", headers=auth_headers(person)).json()
    page2 = client.get("/api/v1/notifications?limit=2&offset=2", headers=auth_headers(person)).json()
    page3 = client.get("/api/v1/notifications?limit=2&offset=4", headers=auth_headers(person)).json()

    ids_page1 = {item["id"] for item in page1["items"]}
    ids_page2 = {item["id"] for item in page2["items"]}
    ids_page3 = {item["id"] for item in page3["items"]}

    assert len(page1["items"]) == 2
    assert len(page2["items"]) == 2
    assert len(page3["items"]) == 1  # only 1 left on the last page
    assert ids_page1.isdisjoint(ids_page2)  # no overlap between pages
    assert ids_page2.isdisjoint(ids_page3)
    assert page1["limit"] == 2 and page1["offset"] == 0
    assert page2["offset"] == 2


def test_pagination_rejects_out_of_range_limit(db, factory, auth_headers):
    person = factory.person()
    response = client.get("/api/v1/notifications?limit=9999", headers=auth_headers(person))
    assert response.status_code == 422  # FastAPI validation: limit is capped at 200


# ── mark read / mark all read via HTTP ──────────────────────────────────────

def test_mark_read_via_api(db, factory, auth_headers):
    person = factory.person()
    notification = _deliver(db, person.id, dedup_key="mark-read-api")

    response = client.post(f"/api/v1/notifications/{notification.id}/read", headers=auth_headers(person))

    assert response.status_code == 200
    assert response.json()["is_read"] is True


def test_mark_all_read_via_api(db, factory, auth_headers):
    person = factory.person()
    _deliver(db, person.id, dedup_key="mark-all-1")
    _deliver(db, person.id, dedup_key="mark-all-2")

    response = client.post("/api/v1/notifications/read-all", headers=auth_headers(person))

    assert response.status_code == 200
    assert response.json()["updated_count"] == 2
    check = client.get("/api/v1/notifications", headers=auth_headers(person)).json()
    assert check["unread_count"] == 0


# ── enrichment via HTTP (AI disabled by default — should be a safe no-op) ──

def test_enrich_endpoint_is_a_safe_noop_when_ai_disabled(db, factory, auth_headers):
    person = factory.person()
    notification = _deliver(db, person.id, dedup_key="enrich-api-test")

    response = client.post(f"/api/v1/notifications/{notification.id}/enrich", headers=auth_headers(person))

    assert response.status_code == 200
    assert response.json()["enrichment"] is None
