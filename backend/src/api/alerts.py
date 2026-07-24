from uuid import UUID
from fastapi import APIRouter, status
from typing import List
from src.schemas.alerts import AlertResponse, AlertUpdate
from src.services.alerts import AlertsService

router = APIRouter()

@router.get(
    "/stale",
    response_model=List[AlertResponse],
    status_code=status.HTTP_200_OK,
    tags=["alerts"]
)
def get_stale_alerts() -> List[AlertResponse]:
    """
    Retrieve a list of stale alerts.
    These are assignments that haven't received a status update in a defined period (e.g., 7 days).
    """
    return AlertsService.get_stale_alerts()

@router.get(
    "/{id}",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    tags=["alerts"]
)
def get_alert_by_id(id: str) -> AlertResponse:
    """
    Retrieve a single alert by its ID.
    """
    return AlertsService.get_alert_by_id(id)

@router.patch(
    "/{id}",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    tags=["alerts"]
)
def update_alert(id: str, update_data: AlertUpdate) -> AlertResponse:
    """
    Update an alert (e.g., mark it as dismissed).
    """
    return AlertsService.update_alert(id, update_data)


