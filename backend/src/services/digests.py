from typing import List
from datetime import datetime
from src.schemas.digests import WeeklyDigestResponse, WeeklyDigestRunResponse
from src.dummy_data.digests import WEEKLY_DIGESTS


class DigestsService:
    """
    Service layer for the Weekly Digest module.
    In Phase 2, the run() method can trigger actual email delivery
    and aggregate data from the database.
    """

    @staticmethod
    def get_all_digests() -> List[WeeklyDigestResponse]:
        """
        Returns a list of all previously generated weekly digests.
        """
        return [WeeklyDigestResponse(**d) for d in WEEKLY_DIGESTS]

    @staticmethod
    def run_weekly_digest() -> WeeklyDigestRunResponse:
        """
        Triggers a new weekly digest generation.
        """
        import uuid
        from datetime import datetime, date

        now = datetime.utcnow()
        new_id = uuid.uuid4()
        week_label = f"Week of {now.strftime('%Y-%m-%d')}"

        new_digest = {
            "id": new_id,
            "department_id": None,
            "week_start": now.date(),
            "week_end": now.date(), # Simplified for dummy
            "summary": "Generated a new weekly digest.",
            "generated_by": "system",
            "model_version": "gpt-4",
            "reviewed_by": None,
            "review_status": "pending",
            "created_at": now
        }

        WEEKLY_DIGESTS.append(new_digest)

        return WeeklyDigestRunResponse(
            message="Weekly digest generated successfully.",
            digest_id=new_id,
            generated_at=now,
            week_label=week_label
        )

