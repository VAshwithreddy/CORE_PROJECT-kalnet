from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID


# ── Employee Dashboard ────────────────────────────────────────────────────────

class EmployeeAssignmentSummary(BaseModel):
    assignment_id: UUID = Field(..., description="ID of the assignment")
    project_name: str = Field(..., example="CORE Platform MVP")
    role: str = Field(..., example="developer")
    allocation_percent: int = Field(..., example=80)
    status: str = Field(..., example="active")
    due_date: str = Field(..., example="2026-09-30")

class EmployeeStatusUpdateSummary(BaseModel):
    assignment_id: UUID = Field(..., description="ID of the assignment")
    status: str = Field(..., example="blocked")
    message: str = Field(..., example="Blocked on missing API spec.")
    created_at: str = Field(..., example="2026-07-08T10:00:00")

class EmployeeSummary(BaseModel):
    total_assignments: int = Field(..., example=1)
    active_assignments: int = Field(..., example=1)
    completed_assignments: int = Field(..., example=0)
    total_allocation_percent: int = Field(..., example=80)
    blocked_count: int = Field(..., example=1)

class EmployeeDashboardResponse(BaseModel):
    """Response model for the Employee dashboard view."""
    user_id: UUID = Field(..., description="ID of the user")
    user_name: str = Field(..., example="Alice Smith")
    active_assignments: List[EmployeeAssignmentSummary]
    recent_status_updates: List[EmployeeStatusUpdateSummary]
    summary: EmployeeSummary


# ── Department Dashboard ──────────────────────────────────────────────────────

class DepartmentProjectSummary(BaseModel):
    project_id: UUID = Field(..., description="ID of the project")
    project_name: str = Field(..., example="CORE Platform MVP")
    status: str = Field(..., example="in_progress")
    priority: str = Field(..., example="high")
    due_date: str = Field(..., example="2026-09-30")

class TeamAssignmentSummary(BaseModel):
    person_name: str = Field(..., example="Alice Smith")
    project_name: str = Field(..., example="CORE Platform MVP")
    role: str = Field(..., example="developer")
    allocation_percent: int = Field(..., example=80)
    status: str = Field(..., example="active")

class DepartmentSummary(BaseModel):
    total_projects: int = Field(..., example=1)
    active_projects: int = Field(..., example=1)
    completed_projects: int = Field(..., example=0)
    blocked_members: int = Field(..., example=1)
    avg_allocation_percent: int = Field(..., example=65)

class DepartmentDashboardResponse(BaseModel):
    """Response model for the Department dashboard view."""
    department_id: UUID = Field(..., description="ID of the department")
    department_name: str = Field(..., example="Engineering")
    head_name: str = Field(..., example="Bob Johnson")
    member_count: int = Field(..., example=12)
    projects: List[DepartmentProjectSummary]
    team_assignments: List[TeamAssignmentSummary]
    summary: DepartmentSummary


# ── Executive Dashboard ───────────────────────────────────────────────────────

class OrganizationSummary(BaseModel):
    total_people: int = Field(..., example=3)
    total_departments: int = Field(..., example=4)
    total_projects: int = Field(..., example=3)
    active_projects: int = Field(..., example=1)
    completed_projects: int = Field(..., example=1)
    planning_projects: int = Field(..., example=1)
    total_assignments: int = Field(..., example=3)
    blocked_assignments: int = Field(..., example=1)

class DepartmentOverview(BaseModel):
    department: str = Field(..., example="Engineering")
    projects: int = Field(..., example=1)
    members: int = Field(..., example=12)
    blocked: int = Field(..., example=1)

class BlockedAssignmentSummary(BaseModel):
    assignment_id: UUID = Field(..., description="ID of the assignment")
    project_name: str = Field(..., example="CORE Platform MVP")
    person_name: str = Field(..., example="Alice Smith")
    blocker: str = Field(..., example="Waiting for API spec.")

class ExecutiveDashboardResponse(BaseModel):
    """Response model for the Executive dashboard view."""
    generated_at: str = Field(..., example="2026-07-15T17:30:00")
    organization_summary: OrganizationSummary
    projects_by_status: Dict[str, int]
    projects_by_priority: Dict[str, int]
    departments_overview: List[DepartmentOverview]
    at_risk_projects: List[Any]
    blocked_assignments: List[BlockedAssignmentSummary]


# ── Work Admin Dashboard ──────────────────────────────────────────────────────

class WorkloadSummary(BaseModel):
    total_assignments: int = Field(..., example=3)
    active: int = Field(..., example=3)
    paused: int = Field(..., example=0)
    completed: int = Field(..., example=0)
    cancelled: int = Field(..., example=0)
    overallocated_people: int = Field(..., example=0)

class PersonWorkload(BaseModel):
    person_id: UUID = Field(..., description="ID of the person")
    person_name: str = Field(..., example="Alice Smith")
    total_allocation_percent: int = Field(..., example=80)
    assignment_count: int = Field(..., example=1)
    status: str = Field(..., example="ok")

class StaleAssignment(BaseModel):
    assignment_id: UUID = Field(..., description="ID of the assignment")
    project_name: str = Field(..., example="CORE Platform MVP")
    person_name: str = Field(..., example="Alice Smith")
    last_update: str = Field(..., example="2026-07-08T10:00:00")
    days_since_update: int = Field(..., example=7)

class WorkAdminDashboardResponse(BaseModel):
    """Response model for the Work Admin dashboard view."""
    generated_at: str = Field(..., example="2026-07-15T17:30:00")
    workload_summary: WorkloadSummary
    people_workload: List[PersonWorkload]
    unassigned_projects: List[Any]
    stale_assignments: List[StaleAssignment]
