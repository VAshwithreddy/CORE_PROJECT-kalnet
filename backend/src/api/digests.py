from typing import List
from fastapi import APIRouter, status
from src.schemas.digests import WeeklyDigestResponse, WeeklyDigestRunResponse
from src.services.digests import DigestsService
from src.core.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter()


@router.post(
    "/weekly/run",
    response_model=WeeklyDigestRunResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["weekly digest"]
)
def run_weekly_digest(db: Session = Depends(get_db)) -> WeeklyDigestRunResponse:
    """
    Trigger a new weekly digest generation.
    Aggregates data from all active assignments and status updates.
    In Phase 2, this will also trigger email delivery to stakeholders.
    Returns a confirmation with the new digest ID and week label.
    """
    return DigestsService.run_weekly_digest(db)


@router.get(
    "/weekly",
    response_model=List[WeeklyDigestResponse],
    tags=["weekly digest"]
)
def get_all_weekly_digests(db: Session = Depends(get_db)) -> List[WeeklyDigestResponse]:
    """
    Retrieve a list of all previously generated weekly digests.
    Each digest contains a summary, highlights, blocked items,
    and a per-person update summary for that week.
    """
    return DigestsService.get_all_digests(db)
