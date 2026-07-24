from typing import List
from src.schemas.system import (
    SystemUserResponse,
    SystemRoleResponse,
    SystemAuditResponse,
    SystemServiceAccountResponse
)
from src.dummy_data.system import (
    SYSTEM_USERS,
    SYSTEM_ROLES,
    SYSTEM_AUDIT_LOGS,
    SERVICE_ACCOUNTS
)

class SystemService:
    """Business logic for the System module."""

    @staticmethod
    def get_users() -> List[SystemUserResponse]:
        """Retrieve all system users."""
        return [SystemUserResponse(**user) for user in SYSTEM_USERS]

    @staticmethod
    def get_roles() -> List[SystemRoleResponse]:
        """Retrieve all system roles."""
        return [SystemRoleResponse(**role) for role in SYSTEM_ROLES]

    @staticmethod
    def get_audit_logs() -> List[SystemAuditResponse]:
        """Retrieve all system audit logs."""
        return [SystemAuditResponse(**log) for log in SYSTEM_AUDIT_LOGS]

    @staticmethod
    def get_service_accounts() -> List[SystemServiceAccountResponse]:
        """Retrieve all service accounts."""
        return [SystemServiceAccountResponse(**account) for account in SERVICE_ACCOUNTS]
