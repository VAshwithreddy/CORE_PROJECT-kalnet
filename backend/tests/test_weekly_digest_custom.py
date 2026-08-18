import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch
import uuid
import sys
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend and ai-service paths
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

ai_service_path = os.path.abspath(os.path.join(backend_path, "..", "ai-service", "AiDigest"))
if ai_service_path not in sys.path:
    sys.path.insert(0, ai_service_path)

from src.core.database import Base
from src.models.department import Department
from src.models.person import Person
from src.models.project import Project
from src.models.assignment import Assignment
from src.models.status_update import StatusUpdate
from src.models.weekly_digest import WeeklyDigest
from src.models.enums import Role
from src.services.digests import DigestsService


class TestWeeklyDigest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        tables = [
            Department.__table__,
            Person.__table__,
            Project.__table__,
            Assignment.__table__,
            StatusUpdate.__table__,
            WeeklyDigest.__table__,
        ]
        # Polyfill ARRAY, JSONB, and UUID types for SQLite test execution
        from sqlalchemy.dialects.sqlite import base as sqlite_base
        sqlite_base.SQLiteTypeCompiler.visit_ARRAY = lambda self, type_, **kw: "TEXT"
        sqlite_base.SQLiteTypeCompiler.visit_JSONB = lambda self, type_, **kw: "JSON"
        sqlite_base.SQLiteTypeCompiler.visit_UUID = lambda self, type_, **kw: "CHAR(36)"

        Base.metadata.create_all(cls.engine, tables=tables)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    # 1. Calendar-week calculation tests (Monday, Wednesday, Sunday)
    def test_calendar_week_calculation_monday(self):
        # Monday UTC
        monday_dt = datetime(2026, 8, 17, 10, 0, 0, tzinfo=timezone.utc)
        week_start = (monday_dt - timedelta(days=monday_dt.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

        self.assertEqual(week_start.date(), datetime(2026, 8, 17).date())
        self.assertEqual(week_end.date(), datetime(2026, 8, 23).date())

    def test_calendar_week_calculation_wednesday(self):
        # Wednesday UTC
        wednesday_dt = datetime(2026, 8, 19, 15, 30, 0, tzinfo=timezone.utc)
        week_start = (wednesday_dt - timedelta(days=wednesday_dt.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

        self.assertEqual(week_start.date(), datetime(2026, 8, 17).date())
        self.assertEqual(week_end.date(), datetime(2026, 8, 23).date())

    def test_calendar_week_calculation_sunday(self):
        # Sunday UTC
        sunday_dt = datetime(2026, 8, 23, 23, 59, 0, tzinfo=timezone.utc)
        week_start = (sunday_dt - timedelta(days=sunday_dt.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

        self.assertEqual(week_start.date(), datetime(2026, 8, 17).date())
        self.assertEqual(week_end.date(), datetime(2026, 8, 23).date())

    def test_weekly_digest_run_flow(self):
        ai_service_path = os.path.abspath(os.path.join(backend_path, "..", "ai-service", "AiDigest"))
        if ai_service_path not in sys.path:
            sys.path.insert(0, ai_service_path)
        import agent
        with patch.object(agent.agent, "invoke") as mock_invoke:
            # Mock AI Response
            mock_response = MagicMock()
            mock_response.content = "# Mocked AI Weekly Digest Report\nEverything is on track."
            mock_invoke.return_value = {"messages": [mock_response]}

            now = datetime.now(timezone.utc)
            week_start_dt = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)

            # Setup seed data
            dept = Department(id=uuid.uuid4(), name="Engineering", created_at=now)
            self.db.add(dept)

            person = Person(
                id=uuid.uuid4(),
                full_name="Alice Specialist",
                email="alice@example.com",
                role=Role.employee,
                department_id=dept.id,
                created_at=now
            )
            self.db.add(person)

            proj = Project(
                id=uuid.uuid4(),
                name="CORE Platform",
                department_id=dept.id,
                created_at=now
            )
            self.db.add(proj)

            assign = Assignment(
                id=uuid.uuid4(),
                person_id=person.id,
                project_id=proj.id,
                role="Backend Engineer",
                start_date=now.date(),
                created_at=now,
                updated_at=now
            )
            self.db.add(assign)
            self.db.commit()

            # Update 1: Inside current week (Monday)
            su_valid = StatusUpdate(
                id=uuid.uuid4(),
                assignment_id=assign.id,
                author_id=person.id,
                status="on_track",
                progress_note="Implemented Status Digest AI flow",
                blockers=None,
                created_at=week_start_dt + timedelta(hours=5)
            )
            # Update 2: Previous week (Should be excluded)
            su_old = StatusUpdate(
                id=uuid.uuid4(),
                assignment_id=assign.id,
                author_id=person.id,
                status="blocked",
                progress_note="Old update from last week",
                blockers="Waiting on requirement",
                created_at=week_start_dt - timedelta(days=2)
            )
            # Update 3: Future update (Should be excluded)
            su_future = StatusUpdate(
                id=uuid.uuid4(),
                assignment_id=assign.id,
                author_id=person.id,
                status="on_track",
                progress_note="Future update",
                blockers=None,
                created_at=now + timedelta(days=10)
            )

            self.db.add_all([su_valid, su_old, su_future])
            self.db.commit()

            # Run digest service
            res = DigestsService.run_weekly_digest(self.db)

            # Assert response
            self.assertIsNotNone(res.digest_id)
            self.assertEqual(res.message, "Weekly digest generated successfully.")

            # Verify DB Persistence
            digest = self.db.query(WeeklyDigest).filter(WeeklyDigest.id == res.digest_id).first()
            self.assertIsNotNone(digest)
            self.assertEqual(digest.summary, "# Mocked AI Weekly Digest Report\nEverything is on track.")
            self.assertEqual(digest.week_start, week_start_dt.date())

            # Verify AI Invocation was called with structured context containing valid update and excluding others
            mock_invoke.assert_called_once()
            invoked_args = mock_invoke.call_args[0][0]
            human_msg = invoked_args["messages"][1].content
            self.assertIn("Engineering", human_msg)
            self.assertIn("CORE Platform", human_msg)
            self.assertIn("Implemented Status Digest AI flow", human_msg)
            self.assertNotIn("Old update from last week", human_msg)
            self.assertNotIn("Future update", human_msg)

    def test_weekly_digest_failure_raises_exception(self):
        ai_service_path = os.path.abspath(os.path.join(backend_path, "..", "ai-service", "AiDigest"))
        if ai_service_path not in sys.path:
            sys.path.insert(0, ai_service_path)
        import agent
        from fastapi import HTTPException
        with patch.object(agent.agent, "invoke", side_effect=Exception("AI Agent API key invalid")):
            count_before = self.db.query(WeeklyDigest).count()
            with self.assertRaises(HTTPException) as cm:
                DigestsService.run_weekly_digest(self.db)
            
            self.assertEqual(cm.exception.status_code, 500)
            self.assertIn("AI Agent API key invalid", cm.exception.detail)
            
            # Verify database rollback: No WeeklyDigest was created
            count_after = self.db.query(WeeklyDigest).count()
            self.assertEqual(count_before, count_after)


if __name__ == "__main__":
    unittest.main()
