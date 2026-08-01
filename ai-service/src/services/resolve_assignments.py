from typing import List, Dict


def normalize(value: str) -> str:
    """
    Normalize text for comparison.
    """
    if value is None:
        return ""

    return " ".join(value.strip().lower().split())


def resolve_assignments(assignments: List[Dict]) -> Dict:
    """
    Resolve duplicate assignment records.

    Expected input:

    [
        {
            "person_id": "...",
            "project_id": "...",
            "role": "Developer",
            "status": "on_track"
        }
    ]
    """

    unique_assignments = []
    duplicates = []

    seen = set()

    for assignment in assignments:

        person_id = normalize(str(assignment.get("person_id", "")))
        project_id = normalize(str(assignment.get("project_id", "")))

        key = (person_id, project_id)

        if key in seen:
            duplicates.append(assignment)
            continue

        seen.add(key)
        unique_assignments.append(assignment)

    return {
        "total_records": len(assignments),
        "unique_records": len(unique_assignments),
        "duplicate_records": len(duplicates),
        "resolved_assignments": unique_assignments,
        "duplicates": duplicates,
    }