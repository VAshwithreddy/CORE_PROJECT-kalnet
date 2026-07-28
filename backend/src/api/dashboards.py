from fastapi import APIRouter
from src.schemas.dashboards import (
    EmployeeDashboardResponse,
    DepartmentDashboardResponse,
    ExecutiveDashboardResponse,
    WorkAdminDashboardResponse
)
from src.services.dashboards import DashboardsService
from src.core.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter()


@router.get("/employee", response_model=EmployeeDashboardResponse, tags=["dashboards"])
def get_employee_dashboard(db: Session = Depends(get_db)) -> EmployeeDashboardResponse:
    """
    Retrieve the Employee dashboard.
    Shows the current user's active assignments, recent status updates,
    and a personal summary (total assignments, allocation %, blocked count).
    """
    return DashboardsService.get_employee_dashboard(db)


@router.get("/department", response_model=DepartmentDashboardResponse, tags=["dashboards"])
def get_department_dashboard(db: Session = Depends(get_db)) -> DepartmentDashboardResponse:
    """
    Retrieve the Department Manager dashboard.
    Shows all team members' assignments, department projects, and
    aggregate stats (active projects, blocked members, avg allocation).
    """
    return DashboardsService.get_department_dashboard(db)


@router.get("/executive", response_model=ExecutiveDashboardResponse, tags=["dashboards"])
def get_executive_dashboard(db: Session = Depends(get_db)) -> ExecutiveDashboardResponse:
    """
    Retrieve the Executive dashboard.
    Shows organization-wide summary: project counts by status/priority,
    department overviews, at-risk projects, and blocked assignments.
    """
    return DashboardsService.get_executive_dashboard(db)


@router.get("/work-admin", response_model=WorkAdminDashboardResponse, tags=["dashboards"])
def get_work_admin_dashboard(db: Session = Depends(get_db)) -> WorkAdminDashboardResponse:
    """
    Retrieve the Work Admin operational dashboard.
    Shows workload distribution across all people, stale assignments
    (no update in 7+ days), unassigned projects, and overallocation alerts.
    """
    return DashboardsService.get_work_admin_dashboard(db)
