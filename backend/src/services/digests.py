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
        from datetime import datetime
        now = datetime.utcnow()
        week_label = f"Week of {now.strftime('%Y-%m-%d')}"

        new_digest = WeeklyDigest(
            week_start=now.date(),
            week_end=now.date(), # Simplified
            summary="Generated a new weekly digest.",
            generated_by="system",
            model_version="gpt-4",
            review_status="pending",
        )
        
        db.add(new_digest)
        db.commit()
        db.refresh(new_digest)

        return WeeklyDigestRunResponse(
            message="Weekly digest generated successfully.",
            digest_id=new_digest.id,
            generated_at=now,
            week_label=week_label
        )

