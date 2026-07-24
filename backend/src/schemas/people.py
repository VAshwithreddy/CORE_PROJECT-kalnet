from uuid import UUID
from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, Field


class PersonResponse(BaseModel):
    """
    Response model for basic person information, used in list views.
    """
    id: UUID = Field(..., description="Unique ID of the person")
    full_name: str = Field(..., description="Person's full name", example="Alice Smith")
    job_title: Optional[str] = Field(None, description="Person's job title", example="Software Engineer")
    department_name: Optional[str] = Field(None, description="Name of the department", example="Engineering")
    role: str = Field(..., description="Role in the system", example="employee")
    availability: str = Field(..., description="Availability status", example="available")


class PersonDetailResponse(PersonResponse):
    """
    Response model for detailed person information.
    Inherits basic fields from PersonResponse.
    """
    email: str = Field(..., description="Person's email address", example="alice.smith@example.com")
    department_id: Optional[UUID] = Field(None, description="ID of the department")
    manager_id: Optional[UUID] = Field(None, description="ID of the person's manager")
    skills: Optional[List[str]] = Field(None, description="List of skills", example=["Python", "React"])
    created_at: datetime = Field(..., description="Timestamp of when the person was created")

    class Config:
        from_attributes = True
