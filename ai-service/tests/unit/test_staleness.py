from datetime import date, timedelta

from src.services.staleness import find_stale_assignments


def test_stale_assignments():

    assignments = [
        {
            "id": 1,
            "end_date": str(date.today() - timedelta(days=5))
        },
        {
            "id": 2,
            "end_date": str(date.today() + timedelta(days=5))
        }
    ]

    result = find_stale_assignments(assignments)

    assert result["total_assignments"] == 2
    assert result["stale_assignments"] == 1
    assert result["active_assignments"] == 1