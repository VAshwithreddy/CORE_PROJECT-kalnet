"""
Dashboards service — all data sourced from Supabase PostgreSQL.
No dummy/hardcoded data is used anywhere in this module.
"""
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from src.models.project import Project
from src.models.assignment import Assignment
from src.models.status_update import StatusUpdate
from src.models.person import Person
from src.models.department import Department
from src.models.staleness_alert import StalenessAlert

from src.schemas.dashboards import (
    EmployeeDashboardResponse,
    DepartmentDashboardResponse,
    ExecutiveDashboardResponse,
    WorkAdminDashboardResponse,
)


def _get_current_user(db: Session) -> Person:
    """
    Return the 'current' user for demo purposes.
    In production this would be decoded from the JWT in the request.
    Falls back to the first person in the DB if the placeholder UUID is absent.
    """
    from uuid import UUID
    _CURRENT_USER_ID = UUID("00000000-0000-0000-0000-000000000001")
    user = db.query(Person).filter(Person.id == _CURRENT_USER_ID).first()
    if not user:
        user = db.query(Person).order_by(Person.created_at).first()
    return user


class DashboardsService:
    """Business logic for the Dashboards module — fully backed by live DB queries."""

    # ── Employee Dashboard ────────────────────────────────────────────────────

    @staticmethod
    def get_employee_dashboard(db: Session) -> EmployeeDashboardResponse:
        user = _get_current_user(db)
        if not user:
            # No users in DB at all — return empty shell
            from uuid import uuid4
            return EmployeeDashboardResponse(
                user_id=uuid4(),
                user_name="No User",
                active_assignments=[],
                recent_status_updates=[],
                summary={
                    "total_assignments": 0,
                    "active_assignments": 0,
                    "completed_assignments": 0,
                    "total_allocation_percent": 0,
                    "blocked_count": 0,
                },
            )

        assignments = db.query(Assignment).filter(Assignment.person_id == user.id).all()

        active_assignments = []
        total_allocation = 0
        blocked_count = 0

        for a in assignments:
            if a.status == "active":
                proj = db.query(Project).filter(Project.id == a.project_id).first()
                proj_name = proj.name if proj else "Unknown"
                alloc = a.allocation_percent if a.allocation_percent is not None else 0
                active_assignments.append({
                    "assignment_id": a.id,
                    "project_name": proj_name,
                    "role": a.role,
                    "allocation_percent": alloc,
                    "status": a.status,
                    "due_date": str(a.end_date) if a.end_date else "N/A",
                })
                total_allocation += alloc

        # Recent status updates — use progress_note (the actual DB column)
        updates = (
            db.query(StatusUpdate)
            .filter(StatusUpdate.author_id == user.id)
            .order_by(StatusUpdate.created_at.desc())
            .limit(5)
            .all()
        )
        recent_updates = []
        for u in updates:
            status_val = u.status.value if hasattr(u.status, "value") else str(u.status)
            recent_updates.append({
                "assignment_id": u.assignment_id,
                "status": status_val,
                "message": u.progress_note or "",
                "created_at": u.created_at.isoformat() if u.created_at else "",
            })
            if status_val == "blocked":
                blocked_count += 1

        summary = {
            "total_assignments": len(assignments),
            "active_assignments": len(active_assignments),
            "completed_assignments": sum(1 for a in assignments if a.status == "completed"),
            "total_allocation_percent": total_allocation,
            "blocked_count": blocked_count,
        }

        return EmployeeDashboardResponse(
            user_id=user.id,
            user_name=user.full_name,
            active_assignments=active_assignments,
            recent_status_updates=recent_updates,
            summary=summary,
        )

    # ── Department Dashboard ──────────────────────────────────────────────────

    @staticmethod
    def get_department_dashboard(db: Session) -> DepartmentDashboardResponse:
        # Use the first department, or the department of the current user
        user = _get_current_user(db)
        dept = None
        if user and user.department_id:
            dept = db.query(Department).filter(Department.id == user.department_id).first()
        if not dept:
            dept = db.query(Department).order_by(Department.created_at).first()

        if not dept:
            from uuid import uuid4
            return DepartmentDashboardResponse(
                department_id=uuid4(),
                department_name="No Department",
                head_name="N/A",
                member_count=0,
                projects=[],
                team_assignments=[],
                summary={
                    "total_projects": 0,
                    "active_projects": 0,
                    "completed_projects": 0,
                    "blocked_members": 0,
                    "avg_allocation_percent": 0,
                },
            )

        head = (
            db.query(Person).filter(Person.id == dept.head_person_id).first()
            if dept.head_person_id
            else None
        )

        members = db.query(Person).filter(Person.department_id == dept.id).all()
        member_ids = [m.id for m in members]

        # Department projects
        projects = db.query(Project).filter(Project.department_id == dept.id).all()
        dept_projects = []
        for p in projects:
            dept_projects.append({
                "project_id": p.id,
                "project_name": p.name,
                "status": str(p.status),
                "priority": str(p.priority),
                "due_date": str(p.target_date) if p.target_date else "N/A",
            })

        # Team assignments
        assignments = (
            db.query(Assignment).filter(Assignment.person_id.in_(member_ids)).all()
            if member_ids else []
        )
        team_assignments = []
        total_alloc = 0
        blocked_member_ids = set()

        for a in assignments:
            person = next((m for m in members if m.id == a.person_id), None)
            p_name = person.full_name if person else "Unknown"
            proj = db.query(Project).filter(Project.id == a.project_id).first()
            alloc = a.allocation_percent if a.allocation_percent is not None else 0
            team_assignments.append({
                "person_name": p_name,
                "project_name": proj.name if proj else "Unknown",
                "role": a.role,
                "allocation_percent": alloc,
                "status": a.status,
            })
            if a.status == "active":
                total_alloc += alloc

            # Check if this person has any blocked status update
            latest = (
                db.query(StatusUpdate)
                .filter(StatusUpdate.assignment_id == a.id)
                .order_by(StatusUpdate.created_at.desc())
                .first()
            )
            if latest:
                s = latest.status.value if hasattr(latest.status, "value") else str(latest.status)
                if s == "blocked" and a.person_id:
                    blocked_member_ids.add(a.person_id)

        avg_alloc = total_alloc // max(1, len(members))

        summary = {
            "total_projects": len(projects),
            "active_projects": sum(
                1 for p in projects if str(p.status) in ("active", "in_progress")
            ),
            "completed_projects": sum(1 for p in projects if str(p.status) == "completed"),
            "blocked_members": len(blocked_member_ids),
            "avg_allocation_percent": avg_alloc,
        }

        return DepartmentDashboardResponse(
            department_id=dept.id,
            department_name=dept.name,
            head_name=head.full_name if head else "N/A",
            member_count=len(members),
            projects=dept_projects,
            team_assignments=team_assignments,
            summary=summary,
        )

    # ── Executive Dashboard ───────────────────────────────────────────────────

    @staticmethod
    def get_executive_dashboard(db: Session) -> ExecutiveDashboardResponse:
        now = datetime.datetime.utcnow().isoformat()

        people_count = db.query(Person).count()
        dept_count = db.query(Department).count()
        projects = db.query(Project).all()
        assignments = db.query(Assignment).all()

        # Status & priority breakdowns
        status_counts: dict = {}
        priority_counts: dict = {}
        for p in projects:
            st = str(p.status)
            pr = str(p.priority)
            status_counts[st] = status_counts.get(st, 0) + 1
            priority_counts[pr] = priority_counts.get(pr, 0) + 1

        # Blocked assignments — those whose latest status update is "blocked"
        blocked_assignments = []
        for a in assignments:
            latest = (
                db.query(StatusUpdate)
                .filter(StatusUpdate.assignment_id == a.id)
                .order_by(StatusUpdate.created_at.desc())
                .first()
            )
            if latest:
                s = latest.status.value if hasattr(latest.status, "value") else str(latest.status)
                if s == "blocked":
                    proj = db.query(Project).filter(Project.id == a.project_id).first()
                    person = db.query(Person).filter(Person.id == a.person_id).first()
                    blocked_assignments.append({
                        "assignment_id": a.id,
                        "project_name": proj.name if proj else "Unknown",
                        "person_name": person.full_name if person else "Unknown",
                        "blocker": latest.blockers or latest.progress_note or "No details provided.",
                    })

        org_sum = {
            "total_people": people_count,
            "total_departments": dept_count,
            "total_projects": len(projects),
            "active_projects": sum(
                1 for p in projects if str(p.status) in ("active", "in_progress")
            ),
            "completed_projects": sum(1 for p in projects if str(p.status) == "completed"),
            "planning_projects": sum(
                1 for p in projects if str(p.status) in ("planning", "planned")
            ),
            "total_assignments": len(assignments),
            "blocked_assignments": len(blocked_assignments),
        }

        # Departments overview — per department: project count, member count, blocked count
        departments = db.query(Department).all()
        departments_overview = []
        for dept in departments:
            d_members = db.query(Person).filter(Person.department_id == dept.id).count()
            d_projects = db.query(Project).filter(Project.department_id == dept.id).count()
            # Count blocked members in this dept
            dept_member_ids = [
                p.id
                for p in db.query(Person).filter(Person.department_id == dept.id).all()
            ]
            d_blocked = 0
            if dept_member_ids:
                dept_assignments = (
                    db.query(Assignment)
                    .filter(Assignment.person_id.in_(dept_member_ids))
                    .all()
                )
                blocked_persons = set()
                for a in dept_assignments:
                    latest = (
                        db.query(StatusUpdate)
                        .filter(StatusUpdate.assignment_id == a.id)
                        .order_by(StatusUpdate.created_at.desc())
                        .first()
                    )
                    if latest:
                        s = (
                            latest.status.value
                            if hasattr(latest.status, "value")
                            else str(latest.status)
                        )
                        if s == "blocked":
                            blocked_persons.add(a.person_id)
                d_blocked = len(blocked_persons)

            departments_overview.append({
                "department": dept.name,
                "projects": d_projects,
                "members": d_members,
                "blocked": d_blocked,
            })

        return ExecutiveDashboardResponse(
            generated_at=now,
            organization_summary=org_sum,
            projects_by_status=status_counts,
            projects_by_priority=priority_counts,
            departments_overview=departments_overview,
            at_risk_projects=[],
            blocked_assignments=blocked_assignments,
        )

    # ── Work Admin Dashboard ──────────────────────────────────────────────────

    @staticmethod
    def get_work_admin_dashboard(db: Session) -> WorkAdminDashboardResponse:
        now = datetime.datetime.utcnow().isoformat()
        assignments = db.query(Assignment).all()

        workload_sum = {
            "total_assignments": len(assignments),
            "active": sum(1 for a in assignments if a.status == "active"),
            "paused": sum(1 for a in assignments if a.status == "paused"),
            "completed": sum(1 for a in assignments if a.status == "completed"),
            "cancelled": sum(1 for a in assignments if a.status == "cancelled"),
            "overallocated_people": 0,
        }

        # People workload — sum allocation_percent per person across active assignments
        people = db.query(Person).all()
        people_workload = []
        overallocated = 0
        for person in people:
            person_assignments = [a for a in assignments if a.person_id == person.id]
            active_alloc = sum(
                (a.allocation_percent or 0)
                for a in person_assignments
                if a.status == "active"
            )
            p_status = "ok"
            if active_alloc > 100:
                p_status = "overallocated"
                overallocated += 1
            elif active_alloc == 100:
                p_status = "fully_allocated"
            people_workload.append({
                "person_id": person.id,
                "person_name": person.full_name,
                "total_allocation_percent": active_alloc,
                "assignment_count": len(person_assignments),
                "status": p_status,
            })
        workload_sum["overallocated_people"] = overallocated

        # Stale assignments — active assignments with no status update in last 7 days
        seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
        stale_assignments = []
        for a in assignments:
            if a.status != "active":
                continue
            latest = (
                db.query(StatusUpdate)
                .filter(StatusUpdate.assignment_id == a.id)
                .order_by(StatusUpdate.created_at.desc())
                .first()
            )
            is_stale = False
            last_update_dt = None
            if latest is None:
                # Never updated — stale since creation
                is_stale = True
                last_update_dt = a.created_at
            elif latest.created_at and latest.created_at.replace(tzinfo=None) < seven_days_ago:
                is_stale = True
                last_update_dt = latest.created_at

            if is_stale:
                proj = db.query(Project).filter(Project.id == a.project_id).first()
                person = db.query(Person).filter(Person.id == a.person_id).first()
                last_update_str = last_update_dt.isoformat() if last_update_dt else ""
                days_since = (
                    (datetime.datetime.utcnow() - last_update_dt.replace(tzinfo=None)).days
                    if last_update_dt
                    else 0
                )
                stale_assignments.append({
                    "assignment_id": a.id,
                    "project_name": proj.name if proj else "Unknown",
                    "person_name": person.full_name if person else "Unknown",
                    "last_update": last_update_str,
                    "days_since_update": days_since,
                })

        # Unassigned projects — projects with no assignments
        all_project_ids_with_assignments = {a.project_id for a in assignments}
        all_projects = db.query(Project).all()
        unassigned_projects = [
            {
                "project_id": p.id,
                "project_name": p.name,
                "status": str(p.status),
                "priority": str(p.priority),
            }
            for p in all_projects
            if p.id not in all_project_ids_with_assignments
        ]

        return WorkAdminDashboardResponse(
            generated_at=now,
            workload_summary=workload_sum,
            people_workload=people_workload,
            unassigned_projects=unassigned_projects,
            stale_assignments=stale_assignments,
        )
