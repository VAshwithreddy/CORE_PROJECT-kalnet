"""
tests/conftest.py

Shared fixtures for the notification-system test suite.

Runs against a real Postgres instance via DATABASE_URL — this project
uses Postgres-only features (JSONB, native enums, RLS, set_config-based
session variables), so an in-memory sqlite substitute would not exercise
the real code paths and would hide real bugs.

There is no pre-existing pytest fixture infrastructure in this project
(test_health.py and test_models.py are self-contained), so this file adds
the minimum needed: a DB session, per-test table isolation, a small
test-data factory, and JWT helpers for API-level tests.

WARNING: `_clean_tables` TRUNCATEs (with CASCADE) every table this suite
touches before each test. Point DATABASE_URL at a disposable test
database — never a shared dev database or production.
"""
from datetime import date, timedelta
from uuid import uuid4

import pytest
from jose import jwt
from sqlalchemy import text

from src.core.config import settings
from src.core.database import SessionLocal
from src.models.assignment import Assignment
from src.models.department import Department
from src.models.enums import Role
from src.models.person import Person
from src.models.project import Project
from src.models.status_update import StatusUpdate

ALGORITHM = "HS256"

# Truncated before every test, in FK-safe order (CASCADE handles the rest).
# Deliberately scoped to what this suite touches — audit_logs, weekly_digests,
# approval_requests, and service_accounts are left alone even though a
# CASCADE from `people` would also clear rows referencing it there, since a
# disposable test DB is expected to be empty of anything precious anyway.
_TRUNCATE_TABLES = [
    "notification_enrichments",
    "notifications",
    "status_updates",
    "assignments",
    "projects",
    "departments",
    "people",
]


@pytest.fixture()
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(autouse=True)
def _clean_tables():
    """Truncate this suite's tables before every test so tests are
    independent of each other and of execution order."""
    session = SessionLocal()
    try:
        session.execute(text(f"TRUNCATE {', '.join(_TRUNCATE_TABLES)} CASCADE"))
        session.commit()
    finally:
        session.close()
    yield


class Factory:
    """Minimal test-data builder so each test can focus on the behavior
    under test instead of re-deriving valid People/Projects/Assignments."""

    def __init__(self, session):
        self.db = session

    def person(self, *, role="employee", manager_id=None, department_id=None, full_name=None, email=None):
        p = Person(
            full_name=full_name or f"Test Person {uuid4().hex[:6]}",
            email=email or f"{uuid4().hex[:10]}@example.test",
            role=Role(role),
            manager_id=manager_id,
            department_id=department_id,
            auth_user_id=uuid4(),
        )
        self.db.add(p)
        self.db.commit()
        self.db.refresh(p)
        return p

    def department(self, *, head_person_id=None, name=None):
        d = Department(name=name or f"Dept {uuid4().hex[:6]}", head_person_id=head_person_id)
        self.db.add(d)
        self.db.commit()
        self.db.refresh(d)
        return d

    def project(self, *, department_id, priority="medium", status="active", name=None, target_date=None):
        proj = Project(
            name=name or f"Project {uuid4().hex[:6]}",
            department_id=department_id,
            priority=priority,
            status=status,
            target_date=target_date,
        )
        self.db.add(proj)
        self.db.commit()
        self.db.refresh(proj)
        return proj

    def assignment(self, *, person_id, project_id, status="on_track", end_date=None, role="developer", start_date=None):
        a = Assignment(
            person_id=person_id,
            project_id=project_id,
            role=role,
            status=status,
            start_date=start_date or date.today(),
            end_date=end_date,
        )
        self.db.add(a)
        self.db.commit()
        self.db.refresh(a)
        return a

    def status_update(self, *, assignment_id, author_id, status, blockers=None, message="update"):
        su = StatusUpdate(
            assignment_id=assignment_id,
            author_id=author_id,
            status=status,
            progress_note=message,
            blockers=blockers,
        )
        self.db.add(su)
        self.db.commit()
        self.db.refresh(su)
        return su


@pytest.fixture()
def factory(db):
    return Factory(db)


@pytest.fixture()
def yesterday():
    return date.today() - timedelta(days=1)


@pytest.fixture()
def tomorrow():
    return date.today() + timedelta(days=1)


def make_token(person) -> str:
    """Mint a JWT exactly like AuthService._create_access_token does, for
    API-level tests — signed with the test environment's own
    settings.secret_key, never a real/production secret."""
    from datetime import datetime, timezone

    payload = {
        "sub": str(person.auth_user_id),
        "email": person.email,
        "role": person.role.value if hasattr(person.role, "value") else str(person.role),
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


@pytest.fixture()
def auth_headers():
    def _make(person):
        return {"Authorization": f"Bearer {make_token(person)}"}

    return _make
