EMPLOYEE_DASHBOARD = {
    "user_id": "11111111-1111-4111-a111-111111111111",
    "user_name": "Alice Smith",
    "active_assignments": [
        {
            "assignment_id": "a1111111-1111-4111-a111-111111111111",
            "project_name": "CORE Platform MVP",
            "role": "developer",
            "allocation_percent": 80,
            "status": "active",
            "due_date": "2026-09-30"
        }
    ],
    "recent_status_updates": [
        {
            "assignment_id": "a1111111-1111-4111-a111-111111111111",
            "status": "blocked",
            "message": "Blocked on missing API spec for the dashboard module.",
            "created_at": "2026-07-08T10:00:00"
        }
    ],
    "summary": {
        "total_assignments": 1,
        "active_assignments": 1,
        "completed_assignments": 0,
        "total_allocation_percent": 80,
        "blocked_count": 1
    }
}

DEPARTMENT_DASHBOARD = {
    "department_id": "d1111111-1111-4111-0111-111111111111",
    "department_name": "Engineering",
    "head_name": "Bob Johnson",
    "member_count": 12,
    "projects": [
        {
            "project_id": "b1111111-1111-4111-8111-111111111111",
            "project_name": "CORE Platform MVP",
            "status": "in_progress",
            "priority": "high",
            "due_date": "2026-09-30"
        }
    ],
    "team_assignments": [
        {
            "person_name": "Alice Smith",
            "project_name": "CORE Platform MVP",
            "role": "developer",
            "allocation_percent": 80,
            "status": "active"
        },
        {
            "person_name": "Bob Johnson",
            "project_name": "CORE Platform MVP",
            "role": "tech_lead",
            "allocation_percent": 50,
            "status": "active"
        }
    ],
    "summary": {
        "total_projects": 1,
        "active_projects": 1,
        "completed_projects": 0,
        "blocked_members": 1,
        "avg_allocation_percent": 65
    }
}

EXECUTIVE_DASHBOARD = {
    "generated_at": "2026-07-15T17:30:00",
    "organization_summary": {
        "total_people": 3,
        "total_departments": 4,
        "total_projects": 3,
        "active_projects": 1,
        "completed_projects": 1,
        "planning_projects": 1,
        "total_assignments": 3,
        "blocked_assignments": 1
    },
    "projects_by_status": {
        "in_progress": 1,
        "planning": 1,
        "completed": 1,
        "on_hold": 0,
        "cancelled": 0
    },
    "projects_by_priority": {
        "critical": 0,
        "high": 1,
        "medium": 1,
        "low": 1
    },
    "departments_overview": [
        {"department": "Engineering", "projects": 1, "members": 12, "blocked": 1},
        {"department": "Design", "projects": 1, "members": 6, "blocked": 0},
        {"department": "Product", "projects": 1, "members": 4, "blocked": 0},
        {"department": "Operations", "projects": 0, "members": 3, "blocked": 0}
    ],
    "at_risk_projects": [],
    "blocked_assignments": [
        {
            "assignment_id": "a1111111-1111-4111-a111-111111111111",
            "project_name": "CORE Platform MVP",
            "person_name": "Alice Smith",
            "blocker": "Waiting for API spec from the product team."
        }
    ]
}

WORK_ADMIN_DASHBOARD = {
    "generated_at": "2026-07-15T17:30:00",
    "workload_summary": {
        "total_assignments": 3,
        "active": 3,
        "paused": 0,
        "completed": 0,
        "cancelled": 0,
        "overallocated_people": 0
    },
    "people_workload": [
        {
            "person_id": "11111111-1111-4111-a111-111111111111",
            "person_name": "Alice Smith",
            "total_allocation_percent": 80,
            "assignment_count": 1,
            "status": "ok"
        },
        {
            "person_id": "22222222-2222-4222-a222-222222222222",
            "person_name": "Bob Johnson",
            "total_allocation_percent": 50,
            "assignment_count": 1,
            "status": "ok"
        },
        {
            "person_id": "33333333-3333-4333-a333-333333333333",
            "person_name": "Carol Williams",
            "total_allocation_percent": 100,
            "assignment_count": 1,
            "status": "fully_allocated"
        }
    ],
    "unassigned_projects": [],
    "stale_assignments": [
        {
            "assignment_id": "a1111111-1111-4111-a111-111111111111",
            "project_name": "CORE Platform MVP",
            "person_name": "Alice Smith",
            "last_update": "2026-07-08T10:00:00",
            "days_since_update": 7
        }
    ]
}

