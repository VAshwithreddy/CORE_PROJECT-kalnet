from datetime import date, datetime
from typing import List, Dict


def is_stale(assignment: Dict) -> bool:
    """
    Returns True if an assignment is considered stale.

    Current rule:
    - If end_date exists and is before today.
    """

    end_date = assignment.get("end_date")

    if not end_date:
        return False

    if isinstance(end_date, str):
        try:
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return False

    return end_date < date.today()


def find_stale_assignments(assignments: List[Dict]) -> Dict:
    """
    Finds stale assignments.

    Expected input:

    [
        {
            "id": "...",
            "person_id": "...",
            "project_id": "...",
            "status": "...",
            "end_date": "2026-07-20"
        }
    ]
    """

    stale = []
    active = []

    for assignment in assignments:

        if is_stale(assignment):
            stale.append(assignment)
        else:
            active.append(assignment)

    return {
        "total_assignments": len(assignments),
        "active_assignments": len(active),
        "stale_assignments": len(stale),
        "stale_records": stale,
    }