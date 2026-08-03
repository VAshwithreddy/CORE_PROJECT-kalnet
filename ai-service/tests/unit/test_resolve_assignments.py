from src.services.resolve_assignments import resolve_assignments


def test_duplicate_assignments():

    assignments = [
        {
            "person_id": "P1",
            "project_id": "PR1",
            "role": "Developer"
        },
        {
            "person_id": "P1",
            "project_id": "PR1",
            "role": "Developer"
        },
        {
            "person_id": "P2",
            "project_id": "PR2",
            "role": "Tester"
        }
    ]

    result = resolve_assignments(assignments)

    assert result["total_records"] == 3
    assert result["unique_records"] == 2
    assert result["duplicate_records"] == 1