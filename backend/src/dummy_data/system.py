# Dummy data for the System module
import uuid

SYSTEM_USERS = [
    {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "username": "admin_user",
        "email": "admin@example.com",
        "is_active": True,
        "last_login": "2026-07-16T10:00:00Z"
    },
    {
        "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
        "username": "jdoe",
        "email": "jdoe@example.com",
        "is_active": True,
        "last_login": "2026-07-15T14:30:00Z"
    }
]

SYSTEM_ROLES = [
    {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Super Admin",
        "description": "Full access to all system features and settings.",
        "permissions": ["all"]
    },
    {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Manager",
        "description": "Can manage projects and assignments within their department.",
        "permissions": ["read:projects", "write:projects", "read:assignments", "write:assignments"]
    }
]

SYSTEM_AUDIT_LOGS = [
    {
        "id": "123e4567-e89b-12d3-a456-426614174002",
        "action": "CREATE_PROJECT",
        "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "details": "Created new project 'Authentication V2'",
        "timestamp": "2026-07-15T09:15:00Z",
        "ip_address": "192.168.1.55"
    },
    {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "action": "DELETE_USER",
        "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "details": "Deleted user with ID 45",
        "timestamp": "2026-07-16T11:20:00Z",
        "ip_address": "192.168.1.55"
    }
]

SERVICE_ACCOUNTS = [
    {
        "id": "123e4567-e89b-12d3-a456-426614174004",
        "name": "CI/CD Pipeline Bot",
        "description": "Account used for automated deployments",
        "is_active": True,
        "created_at": "2026-01-10T08:00:00Z"
    },
    {
        "id": "123e4567-e89b-12d3-a456-426614174005",
        "name": "Reporting Service",
        "description": "Account used to generate weekly digest reports",
        "is_active": True,
        "created_at": "2026-02-15T09:30:00Z"
    }
]
