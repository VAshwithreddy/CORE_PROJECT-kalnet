from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class SystemUserResponse(BaseModel):
    id: UUID = Field(..., description="Unique ID of the user")
    username: str = Field(..., description="Username", example="admin_user")
    email: str = Field(..., description="User's email address", example="admin@example.com")
    is_active: bool = Field(..., description="Whether the user is currently active", example=True)
    last_login: Optional[str] = Field(None, description="Timestamp of the user's last login", example="2026-07-16T10:00:00Z")

class SystemRoleResponse(BaseModel):
    id: UUID = Field(..., description="Unique ID of the role")
    name: str = Field(..., description="Name of the role", example="Super Admin")
    description: str = Field(..., description="Description of the role's purpose", example="Full access to all system features.")
    permissions: List[str] = Field(..., description="List of permission strings", example=["read:projects", "write:projects"])

class SystemAuditResponse(BaseModel):
    id: UUID = Field(..., description="Unique ID of the audit log entry")
    action: str = Field(..., description="The action that was performed", example="CREATE_PROJECT")
    user_id: UUID = Field(..., description="ID of the user who performed the action")
    details: str = Field(..., description="Detailed description of the action", example="Created new project 'Authentication V2'")
    timestamp: str = Field(..., description="When the action occurred", example="2026-07-15T09:15:00Z")
    ip_address: Optional[str] = Field(None, description="IP address from which the action was performed", example="192.168.1.55")
    actor: str = Field(..., description="Name or email of the person who performed the action")
    role: str = Field(..., description="Role of the person who performed the action")
    target: str = Field(..., description="Audited entity and, when available, its ID")
    outcome: str = Field(..., description="Recorded audit outcome")

class SystemServiceAccountResponse(BaseModel):
    id: UUID = Field(..., description="Unique ID of the service account")
    name: str = Field(..., description="Name of the service account", example="CI/CD Pipeline Bot")
    description: str = Field(..., description="Description of what this account is used for", example="Account used for automated deployments")
    is_active: bool = Field(..., description="Whether the service account is active", example=True)
    created_at: str = Field(..., description="When the service account was created", example="2026-01-10T08:00:00Z")

