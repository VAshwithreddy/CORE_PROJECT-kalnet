import uuid
from datetime import date, datetime

WEEKLY_DIGESTS = [
    {
        "id": uuid.uuid4(),
        "department_id": None,
        "week_start": date(2026, 7, 6),
        "week_end": date(2026, 7, 12),
        "summary": "This week saw significant progress on the CORE Platform MVP.",
        "generated_by": "system",
        "model_version": "gpt-4",
        "reviewed_by": None,
        "review_status": "pending",
        "created_at": datetime(2026, 7, 7, 8, 0, 0)
    }
]
