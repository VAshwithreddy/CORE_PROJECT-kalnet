from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import get_current_user, CurrentUser, require_roles
from src.schemas.dashboards import (
    EmployeeDashboardResponse,
    DepartmentDashboardResponse,
    ExecutiveDashboardResponse,
    WorkAdminDashboardResponse,
)
from src.services.dashboards import DashboardsService

router = APIRouter()

@router.get("/employee", response_model=EmployeeDashboardResponse, tags=["Dashboards"])
def get_employee_dashboard(
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user)
) -> EmployeeDashboardResponse:
    """
    Overview for a single contributor.
    Returns their active assignments, recent updates, and a status summary.
    """
    return DashboardsService.get_employee_dashboard(db, current_user)

@router.get(
    "/department", 
    response_model=DepartmentDashboardResponse, 
    tags=["Dashboards"],
    dependencies=[Depends(require_roles("department_head", "team_leader", "executive", "work_admin", "system_admin"))]
)
def get_department_dashboard(db: Session = Depends(get_db)) -> DepartmentDashboardResponse:
    """
    Overview for a department head / team leader.
    Returns aggregation of all projects and members in their department.
    """
    return DashboardsService.get_department_dashboard(db)

@router.get(
    "/executive", 
    response_model=ExecutiveDashboardResponse, 
    tags=["Dashboards"],
    dependencies=[Depends(require_roles("executive", "work_admin", "system_admin"))]
)
def get_executive_dashboard(db: Session = Depends(get_db)) -> ExecutiveDashboardResponse:
    """
    High-level overview for leadership.
    Focuses on organizational health, cross-department metrics, and critical risks.
    """
    return DashboardsService.get_executive_dashboard(db)

@router.get(
    "/work-admin", 
    response_model=WorkAdminDashboardResponse, 
    tags=["Dashboards"],
    dependencies=[Depends(require_roles("work_admin", "system_admin"))]
)
def get_work_admin_dashboard(db: Session = Depends(get_db)) -> WorkAdminDashboardResponse:
    """
    Operational overview for resource managers.
    Focuses on utilization, unassigned work, and system-wide bottlenecks.
    """
    return DashboardsService.get_work_admin_dashboard(db)
