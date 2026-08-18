from typing import List
from datetime import datetime
from src.schemas.digests import WeeklyDigestResponse, WeeklyDigestRunResponse
from sqlalchemy.orm import Session
from src.models.weekly_digest import WeeklyDigest


class DigestsService:
    """
    Service layer for the Weekly Digest module.
    In Phase 2, the run() method can trigger actual email delivery
    and aggregate data from the database.
    """

    @staticmethod
    def get_all_digests(db: Session) -> List[WeeklyDigestResponse]:
        """
        Returns a list of all previously generated weekly digests from the database.
        """
        digests = db.query(WeeklyDigest).order_by(WeeklyDigest.created_at.desc()).all()
        return [WeeklyDigestResponse.model_validate(d) for d in digests]

    @staticmethod
    def run_weekly_digest(db: Session) -> WeeklyDigestRunResponse:
        """
        Triggers a new weekly digest generation and saves to DB.
        """
        import os
        import sys
        import json
        from datetime import datetime, timezone, timedelta
        from sqlalchemy.orm import joinedload
        from src.models.status_update import StatusUpdate
        from src.models.assignment import Assignment
        from src.models.project import Project
        from src.models.person import Person
        from langchain_core.messages import SystemMessage, HumanMessage

        now = datetime.now(timezone.utc)
        
        # Calendar-week calculation: Monday 00:00:00 UTC to Sunday 23:59:59 UTC
        week_start_dt = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        week_end_dt = week_start_dt + timedelta(days=6, hours=23, minutes=59, seconds=59)

        # Query StatusUpdates within the current week up to now
        updates = (
            db.query(StatusUpdate)
            .options(
                joinedload(StatusUpdate.assignment)
                .joinedload(Assignment.project)
                .joinedload(Project.department),
                joinedload(StatusUpdate.assignment)
                .joinedload(Assignment.person)
                .joinedload(Person.department),
                joinedload(StatusUpdate.author)
                .joinedload(Person.department),
            )
            .filter(
                StatusUpdate.created_at >= week_start_dt,
                StatusUpdate.created_at <= now,
            )
            .order_by(StatusUpdate.created_at.asc())
            .all()
        )

        # Format structured data grouped by department
        dept_data = {}
        for su in updates:
            # Determine department context
            dept_name = "General"
            if su.assignment and su.assignment.project and su.assignment.project.department:
                dept_name = su.assignment.project.department.name
            elif su.author and su.author.department:
                dept_name = su.author.department.name
            elif su.assignment and su.assignment.person and su.assignment.person.department:
                dept_name = su.assignment.person.department.name

            if dept_name not in dept_data:
                dept_data[dept_name] = []

            update_info = {
                "department": dept_name,
                "assignment_id": str(su.assignment_id) if su.assignment_id else None,
                "assignment_role": su.assignment.role if su.assignment else None,
                "project_name": su.assignment.project.name if (su.assignment and su.assignment.project) else None,
                "person_name": su.author.full_name if su.author else (su.assignment.person.full_name if (su.assignment and su.assignment.person) else None),
                "status": su.status,
                "progress_note": su.progress_note,
                "blockers": su.blockers,
                "timestamp": su.created_at.isoformat() if su.created_at else None,
            }
            dept_data[dept_name].append(update_info)

        # Import AI agent from ai-service
        ai_service_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai-service", "AiDigest"))
        if ai_service_path not in sys.path:
            sys.path.insert(0, ai_service_path)

        try:
            from agent import agent, system
            
            prompt_content = f"Here is the structured department-wise status update data for the week ({week_start_dt.date()} to {now.date()}):\n\n"
            prompt_content += json.dumps(dept_data, indent=2)

            result = agent.invoke({
                "messages": [
                    SystemMessage(content=system),
                    HumanMessage(content=prompt_content)
                ]
            })
            digest_summary = result["messages"][-1].content
        except Exception as e:
            from fastapi import HTTPException, status
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate weekly status digest via AI agent: {str(e)}"
            )

        new_digest = WeeklyDigest(
            week_start=week_start_dt.date(),
            week_end=week_end_dt.date(),
            summary=digest_summary,
            generated_by="system",
            model_version="gemini-2.5-flash",
            review_status="pending",
        )

        db.add(new_digest)
        db.commit()
        db.refresh(new_digest)

        week_label = f"Week of {week_start_dt.strftime('%Y-%m-%d')}"
        return WeeklyDigestRunResponse(
            message="Weekly digest generated successfully.",
            digest_id=new_digest.id,
            generated_at=now,
            week_label=week_label
        )

