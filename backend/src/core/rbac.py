"""
rbac.py — Row-Level Access Control helpers.

Every access-control decision in the application should route through this
module so that the business rules for each role live in exactly one place.

Role hierarchy (most → least privileged):
  system_admin > work_admin > executive > department_head
    > team_leader (dept members)
    > manager     (direct reports)
    > employee    (self only)
"""

from typing import Set
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.core.dependencies import CurrentUser
from src.models.person import Person
from src.models.assignment import Assignment

# ---------------------------------------------------------------------------
# Role constants
# ---------------------------------------------------------------------------

# Roles that may see ALL data in the system.
PRIVILEGED_ROLES: Set[str] = {
    "department_head",
    "executive",
    "work_admin",
    "system_admin",
}

# Roles that may see their own data PLUS a wider team.
MANAGER_ROLES: Set[str] = {"manager", "team_leader"}


class RBACService:
    """
    Central service for Row-Level Access Control.

    All methods accept the current SQLAlchemy Session and the validated
    CurrentUser object extracted from the Bearer JWT.
    """

    # ------------------------------------------------------------------
    # Core: compute the set of person IDs the caller may see
    # ------------------------------------------------------------------

    @staticmethod
    def get_visible_person_ids(db: Session, current_user: CurrentUser) -> Set[UUID]:
        """
        Return the set of ``people.id`` values the caller is authorised to view.

        - Privileged roles → every person in the system.
        - manager          → self + persons whose manager_id == caller.
        - team_leader      → self + members of the caller's department.
        - employee         → self only.
        """
        role = current_user.role
        uid = current_user.person_id

        if role in PRIVILEGED_ROLES:
            # Return all person IDs.
            rows = db.query(Person.id).all()
            return {r[0] for r in rows}

        # Start with self.
        visible: Set[UUID] = {uid}

        if role == "manager":
            # Direct reports: persons who have manager_id pointing at the caller.
            reports = (
                db.query(Person.id)
                .filter(Person.manager_id == uid)
                .all()
            )
            visible.update(r[0] for r in reports)

        elif role == "team_leader":
            # Same-department members.
            caller = db.query(Person).filter(Person.id == uid).first()
            if caller and caller.department_id:
                members = (
                    db.query(Person.id)
                    .filter(Person.department_id == caller.department_id)
                    .all()
                )
                visible.update(r[0] for r in members)

        # employee — only self (already seeded above)
        return visible

    # ------------------------------------------------------------------
    # Guards — raise HTTP 403 when access is denied
    # ------------------------------------------------------------------

    @staticmethod
    def assert_person_access(
        db: Session,
        current_user: CurrentUser,
        target_person_id: UUID,
    ) -> None:
        """
        Raise HTTP 403 if *current_user* is not allowed to view *target_person_id*.
        """
        visible = RBACService.get_visible_person_ids(db, current_user)
        if target_person_id not in visible:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this person's data.",
            )

    @staticmethod
    def assert_assignment_access(
        db: Session,
        current_user: CurrentUser,
        assignment: Assignment,
    ) -> None:
        """
        Raise HTTP 403 if *current_user* is not allowed to view *assignment*.
        The check is: the assignment's person_id must be in the visible set.
        """
        visible = RBACService.get_visible_person_ids(db, current_user)
        if assignment.person_id not in visible:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this assignment.",
            )

    @staticmethod
    def assert_privileged(current_user: CurrentUser) -> None:
        """
        Raise HTTP 403 if *current_user* is not a privileged role.
        Used to guard write/admin endpoints.
        """
        if current_user.role not in PRIVILEGED_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to perform this action.",
            )
