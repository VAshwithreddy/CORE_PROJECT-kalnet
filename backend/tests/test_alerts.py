"""
Tests for the StalenessAlert lookup fix (AlertsService.get_alert_by_id /
update_alert): a request for an alert that doesn't exist must 404, never
silently substitute a different alert via a numeric-index/modulo fallback.
"""
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.main import app
from src.services.alerts import AlertsService

client = TestClient(app)


def test_get_alert_by_id_returns_the_correct_alert(db, factory):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)
    alert = AlertsService.report_stale_assignment(
        db, assignment_id=assignment.id, severity="low", reason="test", days_since_update=8
    )

    result = AlertsService.get_alert_by_id(alert.id, db)

    assert result.id == alert.id


def test_get_alert_by_id_404s_on_a_wellformed_but_missing_uuid(db):
    with pytest.raises(HTTPException) as exc_info:
        AlertsService.get_alert_by_id(uuid4(), db)
    assert exc_info.value.status_code == 404


def test_numeric_id_never_substitutes_a_different_alert_via_api(db, factory, auth_headers):
    """The specific regression this guards: `/api/v1/alerts/1` (or any
    small integer) used to be treated as a 1-indexed position into ALL
    alerts, with a modulo wraparound so even a huge number returned
    something. A numeric string is not a valid UUID and must 422, never
    return an arbitrary alert."""
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)
    AlertsService.report_stale_assignment(
        db, assignment_id=assignment.id, severity="low", reason="test", days_since_update=8
    )
    admin = factory.person(role="work_admin")

    for candidate_id in ["1", "2", "999999", "0", "-1"]:
        response = client.get(f"/api/v1/alerts/{candidate_id}", headers=auth_headers(admin))
        assert response.status_code == 422, f"id={candidate_id!r} should 422, got {response.status_code}"


def test_patch_with_numeric_id_never_dismisses_a_different_alert(db, factory, auth_headers):
    dept = factory.department()
    person = factory.person()
    project = factory.project(department_id=dept.id)
    assignment = factory.assignment(person_id=person.id, project_id=project.id)
    alert = AlertsService.report_stale_assignment(
        db, assignment_id=assignment.id, severity="low", reason="test", days_since_update=8
    )
    admin = factory.person(role="work_admin")

    response = client.patch("/api/v1/alerts/1", json={"is_dismissed": True}, headers=auth_headers(admin))

    assert response.status_code == 422
    db.refresh(alert)
    assert alert.is_dismissed is False  # the real alert was never touched


def test_well_formed_missing_uuid_404s_via_api(db, factory, auth_headers):
    admin = factory.person(role="work_admin")
    response = client.get(f"/api/v1/alerts/{uuid4()}", headers=auth_headers(admin))
    assert response.status_code == 404
