from sqlalchemy import inspect

from src.models.assignment import Assignment


def test_assignment_model_matches_live_schema():
    mapper = inspect(Assignment)
    columns = {column.name for column in mapper.columns}

    assert {"id", "person_id", "project_id", "role", "status", "start_date", "end_date", "created_at", "updated_at"}.issubset(columns)
    assert "assignee_id" not in columns
    assert "assigned_by_id" not in columns
    assert "allocation_percent" not in columns
    assert "notes" not in columns
