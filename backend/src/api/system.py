from fastapi import APIRouter, status
from typing import List
from src.schemas.system import (
    SystemUserResponse,
    SystemRoleResponse,
    SystemAuditResponse,
    SystemServiceAccountResponse,
)
from src.services.system import SystemService

router = APIRouter()


@router.get(
    "/users",
    response_model=List[SystemUserResponse],
    status_code=status.HTTP_200_OK,
    summary="List System Users",
    tags=["System Users"],
)
def get_system_users() -> List[SystemUserResponse]:
    """
    Retrieve a list of all registered system users.

    Returns each user's **id**, **username**, **email**, **active status**,
    and **last login timestamp**. Intended for administrators only.
    """
    return SystemService.get_users()


@router.get(
    "/roles",
    response_model=List[SystemRoleResponse],
    status_code=status.HTTP_200_OK,
    summary="List System Roles",
    tags=["Roles"],
)
def get_system_roles() -> List[SystemRoleResponse]:
    """
    Retrieve a list of all system roles and their associated permissions.

    Each role includes its **id**, **name**, **description**, and a list
    of **permission strings** (e.g. `read:projects`, `write:assignments`).
    """
    return SystemService.get_roles()


@router.get(
    "/audit",
    response_model=List[SystemAuditResponse],
    status_code=status.HTTP_200_OK,
    summary="List Audit Logs",
    tags=["Audit Logs"],
)
def get_system_audit_logs() -> List[SystemAuditResponse]:
    """
    Retrieve the system audit log for compliance and activity tracking.

    Each entry records the **action** performed, the **user** who performed it,
    a human-readable **details** string, the **timestamp**, and the originating
    **IP address**. Useful for security reviews and change management.
    """
    return SystemService.get_audit_logs()


@router.get(
    "/service-accounts",
    response_model=List[SystemServiceAccountResponse],
    status_code=status.HTTP_200_OK,
    summary="List Service Accounts",
    tags=["Service Accounts"],
)
def get_service_accounts() -> List[SystemServiceAccountResponse]:
    """
    Retrieve a list of all non-human service accounts used by the system.

    Each entry includes the account's **name**, **description**, **active status**,
    and **creation timestamp**. Examples include CI/CD bots and reporting services.
    """
    return SystemService.get_service_accounts()
