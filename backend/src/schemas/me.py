from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    """
    Basic information about the current user.
    Matches the Supabase people table.
    """

    id: UUID = Field(..., description="User UUID")
    username: str = Field(..., description="Username (email prefix)")
    email: str = Field(..., description="Email address")
    role: str = Field(..., description="User role")

    class Config:
        from_attributes = True


class UserProfileResponse(BaseModel):
    """
    Detailed profile of the current user.
    """

    id: UUID = Field(..., description="User UUID")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    department: Optional[str] = Field(default=None, description="Department name")
    title: Optional[str] = Field(default=None, description="Job title")
    bio: Optional[str] = Field(default=None, description="Biography")

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """
    Editable profile fields.
    """

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = Field(None, min_length=2)
    job_title: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None
    availability: Optional[str] = None
    skills: Optional[list[str]] = None