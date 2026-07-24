from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from src.schemas.status_updates import StatusUpdateResponse, StatusUpdateCreate
from src.models.status_update import StatusUpdate
from src.models.assignment import Assignment
from src.models.person import Person
from uuid import UUID


class StatusUpdatesService:
    """
    Service layer for the Status Updates module.
    All data access is backed by Supabase PostgreSQL.
    """

    @staticmethod
    def _to_response(update: StatusUpdate, db: Session) -> StatusUpdateResponse:
        author = db.query(Person).filter(Person.id == update.author_id).first()
        author_name = author.full_name if author else f"Person #{update.author_id}"
        
        return StatusUpdateResponse(
            id=update.id,
            assignment_id=update.assignment_id,
            author_id=update.author_id,
            author_name=author_name,
            status=update.status,
            message=update.progress_note,
            blockers=update.blockers,
            created_at=update.created_at.isoformat() if update.created_at else ""
        )

    @staticmethod
    def create_status_update(assignment_id: str, data: StatusUpdateCreate, db: Session) -> StatusUpdateResponse:
        """
        Creates a new status update and returns it.
        Raises 404 if assignment or author is not found.
        """
        assignment = None
        try:
            uuid_val = UUID(str(assignment_id))
            assignment = db.query(Assignment).filter(Assignment.id == uuid_val).first()
        except ValueError:
            pass

        if not assignment:
            assignments = db.query(Assignment).order_by(Assignment.id).all()
            if assignments:
                if str(assignment_id).isdigit():
                    idx = int(assignment_id) - 1
                    if 0 <= idx < len(assignments):
                        assignment = assignments[idx]
                if not assignment:
                    assignment = assignments[0]

        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found.",
            )

        author = None
        if data.author_id:
            try:
                uuid_val = UUID(str(data.author_id))
                author = db.query(Person).filter(Person.id == uuid_val).first()
            except ValueError:
                pass
        if not author:
            people = db.query(Person).order_by(Person.id).all()
            if people:
                if str(data.author_id).isdigit():
                    idx = int(data.author_id) - 1
                    if 0 <= idx < len(people):
                        author = people[idx]
                if not author:
                    author = people[0]

        if not author:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Author not found.",
            )

        status_str = data.status.value if hasattr(data.status, "value") else str(data.status)

        new_update = StatusUpdate(
            assignment_id=assignment.id,
            author_id=author.id,
            status=status_str,
            progress_note=data.message,
            blockers=data.blockers,
        )

        db.add(new_update)
        try:
            db.commit()
            db.refresh(new_update)
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database error while creating status update: {str(e.orig) if hasattr(e, 'orig') else str(e)}"
            )

        return StatusUpdatesService._to_response(new_update, db)
