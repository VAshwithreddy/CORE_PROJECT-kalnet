from src.schemas.dashboards import (
    EmployeeDashboardResponse,
    DepartmentDashboardResponse,
    ExecutiveDashboardResponse,
    WorkAdminDashboardResponse
)
from src.dummy_data.dashboards import (
    EMPLOYEE_DASHBOARD,
    DEPARTMENT_DASHBOARD,
    EXECUTIVE_DASHBOARD,
    WORK_ADMIN_DASHBOARD
)


class DashboardsService:
    """
    Service layer for the Dashboards module.
    In Phase 2, each method can be replaced with aggregated
    database queries without changing the router.
    """

    @staticmethod
    def get_employee_dashboard() -> EmployeeDashboardResponse:
        """
        Returns the dashboard data for an individual employee.
        Shows their active assignments, recent status updates, and a summary.
        """
        return EmployeeDashboardResponse(**EMPLOYEE_DASHBOARD)

    @staticmethod
    def get_department_dashboard() -> DepartmentDashboardResponse:
        """
        Returns the dashboard data for a department manager.
        Shows team assignments, projects, and department-level summary stats.
        """
        return DepartmentDashboardResponse(**DEPARTMENT_DASHBOARD)

    @staticmethod
    def get_executive_dashboard() -> ExecutiveDashboardResponse:
        """
        Returns the high-level executive dashboard.
        Shows organization-wide project stats, department overviews, and blocked items.
        """
        return ExecutiveDashboardResponse(**EXECUTIVE_DASHBOARD)

    @staticmethod
    def get_work_admin_dashboard() -> WorkAdminDashboardResponse:
        """
        Returns the Work Admin operational dashboard.
        Shows workload distribution, stale assignments, and overallocation alerts.
        """
        return WorkAdminDashboardResponse(**WORK_ADMIN_DASHBOARD)
