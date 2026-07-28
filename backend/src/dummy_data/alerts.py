# Dummy data for the Alerts module

ALERTS = [
    {
        "id": "11111111-1111-4111-a111-111111111111",
        "type": "stale_assignment",
        "title": "Assignment Stale: Authentication Module",
        "description": "No status update has been posted in the last 7 days.",
        "assignment_id": "a1111111-1111-4111-a111-111111111111",
        "created_at": "2026-07-10T08:00:00Z",
        "is_dismissed": False,
    },
    {
        "id": "22222222-2222-4222-a222-222222222222",
        "type": "stale_assignment",
        "title": "Assignment Stale: Database Migration",
        "description": "No status update has been posted in the last 10 days.",
        "assignment_id": "a2222222-2222-4222-a222-222222222222",
        "created_at": "2026-07-08T09:15:00Z",
        "is_dismissed": False,
    },
    {
        "id": "33333333-3333-4333-a333-333333333333",
        "type": "overdue_task",
        "title": "Task Overdue: Setup CI/CD",
        "description": "This task is past its due date.",
        "assignment_id": "a3333333-3333-4333-a333-333333333333",
        "created_at": "2026-07-12T14:30:00Z",
        "is_dismissed": True,
    }
]

