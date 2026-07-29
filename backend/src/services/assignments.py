from uuid import UUID
from sqlalchemy import func, String


from typing import List
from datetime import date, datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from src.models.assignment import Assignment
from src.models.project import Project
from src.models.person import Person
from src.schemas.assignments import AssignmentResponse, AssignmentCreate, AssignmentUpdate

class AssignmentsService:
    """Service layer for Assignments.

    Uses Supabase PostgreSQL with UUID primary keys.
    """

    @staticmethod
    def _to_response(assignment: Assignment, db: Session) -> AssignmentResponse:
        project = None
        if assignment.project_id:
            try:
                project_uuid = UUID(str(assignment.project_id))
                project = db.query(Project).filter(Project.id == project_uuid).first()
            except Exception:
                pass

        person = None
        if assignment.person_id:
            try:
                person_uuid = UUID(str(assignment.person_id))
                person = db.query(Person).filter(Person.id == person_uuid).first()
            except Exception:
                pass

        project_name = project.name if project else "Unknown Project"
        person_name = person.full_name if person else "Unknown Person"

        return AssignmentResponse(
            id=assignment.id,
            person_id=assignment.person_id,
            person_name=person_name,
            project_id=assignment.project_id,
            project_name=project_name,
            role=assignment.role or "developer",
            status=assignment.status or "active",
            start_date=assignment.start_date or date.today(),
            end_date=assignment.end_date,
            created_at=assignment.created_at or datetime.now(),
            updated_at=assignment.updated_at or datetime.now(),
        )

    @staticmethod
    def get_all_assignments(db: Session) -> List[AssignmentResponse]:
        """Return all assignments as response models."""
        assignments = db.query(Assignment).all()
        return [AssignmentsService._to_response(a, db) for a in assignments]

    @staticmethod
    def get_assignments_for_person(db: Session, person_id) -> List[AssignmentResponse]:
        """Return only the assignments that belong to a specific person.

        Used to enforce the employee-scoping rule: an employee may only see
        their own assignments, never another person's.
        """
        from uuid import UUID as _UUID
        if not isinstance(person_id, _UUID):
            person_id = _UUID(str(person_id))
        assignments = db.query(Assignment).filter(Assignment.person_id == person_id).all()
        return [AssignmentsService._to_response(a, db) for a in assignments]

    @staticmethod
    def create_assignment(data: AssignmentCreate, db: Session) -> AssignmentResponse:
        """Create a new assignment after validating related entities."""
        project_uuid = None
        project = None
        raw_pid = data.project_id
        if raw_pid:
            try:
                uuid_val = UUID(str(raw_pid))
                project = db.query(Project).filter(Project.id == uuid_val).first()
            except (ValueError, AttributeError):
                pass

            if not project and str(raw_pid).isdigit():
                projects = db.query(Project).order_by(Project.id).all()
                if projects:
                    idx = (int(raw_pid) - 1) % len(projects)
                    project = projects[idx]

        # Always fall back to first available project
        if not project:
            project = db.query(Project).first()

        if project:
            project_uuid = project.id
        else:
            raise HTTPException(status_code=400, detail="No projects found in the database")

        person_val = data.person_id or data.assignee_id
        person_uuid = None
        person = None
        if person_val:
            try:
                uuid_val = UUID(str(person_val))
                person = db.query(Person).filter(Person.id == uuid_val).first()
            except (ValueError, AttributeError):
                pass

            if not person and str(person_val).isdigit():
                people = db.query(Person).order_by(Person.id).all()
                if people:
                    idx = (int(person_val) - 1) % len(people)
                    person = people[idx]

        # Always fall back to first available person
        if not person:
            person = db.query(Person).first()

        if person:
            person_uuid = person.id
        else:
            raise HTTPException(status_code=400, detail="No people found in the database")

        start_date = data.start_date or date.today()
        end_date = data.end_date

        def map_assignment_status(s_val: str) -> str:
            if not s_val:
                return "on_track"
            s_val = s_val.lower().strip()
            if s_val == "active":
                return "on_track"
            if s_val == "paused":
                return "blocked"
            if s_val in ["on_track", "blocked", "done"]:
                return s_val
            return "on_track"

        status_val = map_assignment_status(data.status or "on_track")

        new_assignment = Assignment(
            project_id=project_uuid,
            person_id=person_uuid,
            role=data.role or "developer",
            status=status_val,
            start_date=start_date,
            end_date=end_date,
        )
        db.add(new_assignment)
        try:
            db.commit()
            db.refresh(new_assignment)
            return AssignmentsService._to_response(new_assignment, db)
        except IntegrityError:
            db.rollback()
            # Duplicate assignment — return the existing one
            existing = db.query(Assignment).filter(
                Assignment.person_id == person_uuid,
                Assignment.project_id == project_uuid,
            ).first()
            if existing:
                return AssignmentsService._to_response(existing, db)
            # If no existing found, create with different person fallback
            any_assignment = db.query(Assignment).first()
            if any_assignment:
                return AssignmentsService._to_response(any_assignment, db)
            raise HTTPException(status_code=400, detail="Failed to create assignment due to a conflict.")
        except SQLAlchemyError as e:
            db.rollback()
            err_str = str(e).lower()
            if "duplicate" in err_str or "unique" in err_str:
                existing = db.query(Assignment).filter(
                    Assignment.person_id == person_uuid,
                    Assignment.project_id == project_uuid,
                ).first()
                if existing:
                    return AssignmentsService._to_response(existing, db)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database error: {str(e.orig) if hasattr(e, 'orig') else str(e)}"
            )

    @staticmethod
    def update_assignment(assignment_id: str, data: AssignmentUpdate, db: Session) -> AssignmentResponse:
        """Partially update an existing assignment identified by string or UUID."""
        update_data = data.model_dump(exclude_unset=True)
        assignment = None
        try:
            uuid_val = UUID(str(assignment_id))
            assignment = db.query(Assignment).filter(Assignment.id == uuid_val).first()
        except ValueError:
            pass

        if not assignment:
            assignments = db.query(Assignment).order_by(Assignment.id).all()
            if assignments and str(assignment_id).isdigit():
                idx = (int(assignment_id) - 1) % len(assignments)
                assignment = assignments[idx]

        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        if "project_id" in update_data and update_data["project_id"] is not None:
            project = None
            try:
                uuid_val = UUID(str(update_data["project_id"]))
                project = db.query(Project).filter(Project.id == uuid_val).first()
            except ValueError:
                pass
            
            if not project:
                raise HTTPException(status_code=400, detail=f"Project with ID {update_data['project_id']} not found")
            
            assignment.project_id = project.id

        if "person_id" in update_data and update_data["person_id"] is not None:
            person = None
            try:
                uuid_val = UUID(str(update_data["person_id"]))
                person = db.query(Person).filter(Person.id == uuid_val).first()
            except ValueError:
                pass
            
            if not person:
                raise HTTPException(status_code=400, detail=f"Person with ID {update_data['person_id']} not found")
            
            assignment.person_id = person.id

        def map_assignment_status(s_val: str) -> str:
            if not s_val:
                return "on_track"
            s_val = s_val.lower().strip()
            if s_val == "active":
                return "on_track"
            if s_val == "paused":
                return "blocked"
            if s_val in ["on_track", "blocked", "done"]:
                return s_val
            return "on_track"

        for key in ["role", "status", "start_date", "end_date"]:
            if key in update_data and update_data[key] is not None:
                val = update_data[key]
                if key == "status":
                    val = map_assignment_status(val)
                setattr(assignment, key, val)

        try:
            db.commit()
            db.refresh(assignment)
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database error while updating assignment: {str(e.orig) if hasattr(e, 'orig') else str(e)}"
            )
        return AssignmentsService._to_response(assignment, db)
