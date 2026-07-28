"""
System service — backed by Supabase PostgreSQL.
All data (users, roles, audit logs, service accounts) comes from live DB queries.
"""
from typing import List
import uuid

from sqlalchemy.orm import Session

from src.schemas.system import (
    SystemUserResponse,
    SystemRoleResponse,
    SystemAuditResponse,
    SystemServiceAccountResponse,
)
from src.models.person import Person
from src.models.audit_log import AuditLog
from src.models.service_account import ServiceAccount


# Permission map per role — describes what each role is allowed to do.
_ROLE_PERMISSIONS: dict = {
    "system_admin": {
        "description": "Full access to all system features including user and role management.",
        "permissions": ["read:all", "write:all", "admin:all"],
    },
    "executive": {
        "description": "Read-only access to all dashboards and org-wide reports.",
        "permissions": ["read:all", "read:dashboards"],
    },
    "department_head": {
        "description": "Can manage their department's members, projects, and assignments.",
        "permissions": [
            "read:projects",
            "write:projects",
            "read:assignments",
            "write:assignments",
            "read:people",
        ],
    },
    "work_admin": {
        "description": "Can manage workloads, assignments, and view all people.",
        "permissions": [
            "read:all",
            "write:assignments",
            "read:dashboards",
        ],
    },
    "employee": {
        "description": "Can view their own assignments and submit status updates.",
        "permissions": [
            "read:own_assignments",
            "write:status_updates",
            "read:own_profile",
            "write:own_profile",
        ],
    },
}


class SystemService:
    """Business logic for the System module — all data from Supabase PostgreSQL."""

    @staticmethod
    def get_users(db: Session) -> List[SystemUserResponse]:
        """Retrieve all system users from the people table."""
        people = db.query(Person).all()
        return [
            SystemUserResponse(
                id=p.id,
                username=p.email.split("@")[0] if p.email else f"user_{p.id}",
                email=p.email or "",
                is_active=True,
                last_login=None,
            )
            for p in people
        ]

    @staticmethod
    def get_roles(db: Session) -> List[SystemRoleResponse]:
        """
        Derive system roles from distinct role values in the people table.
        Returns a role entry for each role that has at least one person assigned,
        enriched with description and permissions from the role permission map.
        """
        # Get distinct roles that exist in the DB
        raw_roles = db.query(Person.role).distinct().all()
        seen = set()
        roles = []

        for (role_val,) in raw_roles:
            role_str = role_val.value if hasattr(role_val, "value") else str(role_val)
            if role_str in seen:
                continue
            seen.add(role_str)

            meta = _ROLE_PERMISSIONS.get(
                role_str,
                {
                    "description": f"Role: {role_str}",
                    "permissions": [f"read:{role_str}"],
                },
            )
            # Count people with this role
            count = db.query(Person).filter(Person.role == role_val).count()
            roles.append(
                SystemRoleResponse(
                    id=uuid.uuid5(uuid.NAMESPACE_DNS, f"role.{role_str}"),
                    name=role_str.replace("_", " ").title(),
                    description=meta["description"] + f" ({count} user(s))",
                    permissions=meta["permissions"],
                )
            )

        # Also include roles that are defined in _ROLE_PERMISSIONS but have 0 users
        for role_str, meta in _ROLE_PERMISSIONS.items():
            if role_str not in seen:
                roles.append(
                    SystemRoleResponse(
                        id=uuid.uuid5(uuid.NAMESPACE_DNS, f"role.{role_str}"),
                        name=role_str.replace("_", " ").title(),
                        description=meta["description"] + " (0 users)",
                        permissions=meta["permissions"],
                    )
                )

        return roles

    @staticmethod
    def get_audit_logs(db: Session) -> List[SystemAuditResponse]:
        """Retrieve all system audit logs ordered by newest first."""
        logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()
        return [
            SystemAuditResponse(
                id=log.id,
                action=log.action,
                user_id=log.user_id,
                details=log.details or "",
                timestamp=log.timestamp.isoformat() if log.timestamp else "",
                ip_address=log.ip_address,
            )
            for log in logs
        ]

    @staticmethod
    def get_service_accounts(db: Session) -> List[SystemServiceAccountResponse]:
        """Retrieve all service accounts from the database."""
        accounts = db.query(ServiceAccount).all()
        return [
            SystemServiceAccountResponse(
                id=a.id,
                name=a.name,
                description=a.description or "",
                is_active=True,
                created_at=a.created_at.isoformat() if a.created_at else "",
            )
            for a in accounts
        ]
