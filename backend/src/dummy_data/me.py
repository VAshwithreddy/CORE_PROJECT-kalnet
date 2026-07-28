from uuid import UUID

CURRENT_USER_BASIC = {
    "id": UUID("00000000-0000-0000-0000-000000000001"),
    "username": "admin_user",
    "email": "admin@example.com",
    "role": "admin"
}

CURRENT_USER_PROFILE = {
    "id": UUID("00000000-0000-0000-0000-000000000001"),
    "first_name": "Admin",
    "last_name": "User",
    "department": "Engineering",
    "title": "Senior Backend Engineer",
    "bio": "I build things."
}
