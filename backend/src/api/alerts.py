from uuid import UUID
from fastapi import APIRouter, status
from typing import List
from src.schemas.alerts import AlertResponse, AlertUpdate
from src.services.alerts import AlertsService
from src.core.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter()

@router.get(
    "/stale",
    response_model=List[AlertResponse],
    status_code=status.HTTP_200_OK,
    tags=["alerts"]
)
def get_stale_alerts(db: Session = Depends(get_db)) -> List[AlertResponse]:
    """
    Retrieve a list of stale alerts.
    These are assignments that haven't received a status update in a defined period (e.g., 7 days).
    """
    return AlertsService.get_stale_alerts(db)

@router.get(
    "/{id}",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    tags=["alerts"]
)
def get_alert_by_id(id: str, db: Session = Depends(get_db)) -> AlertResponse:
    """
    Retrieve a single alert by its ID.
    """
    return AlertsService.get_alert_by_id(id, db)

@router.patch(
    "/{id}",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    tags=["alerts"]
)
def update_alert(id: str, update_data: AlertUpdate, db: Session = Depends(get_db)) -> AlertResponse:
    """
    Update an alert (e.g., mark it as dismissed).
    """
    return AlertsService.update_alert(id, update_data, db)


