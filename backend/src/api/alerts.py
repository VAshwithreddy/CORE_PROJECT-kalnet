from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import get_current_user, CurrentUser, require_roles
from src.core.rbac import PRIVILEGED_ROLES
from src.schemas.alerts import AlertResponse, AlertUpdate
from src.services.alerts import AlertsService

router = APIRouter()

@router.get(
    "/stale",
    response_model=List[AlertResponse],
    status_code=status.HTTP_200_OK,
    tags=["alerts"],
    dependencies=[Depends(require_roles(*PRIVILEGED_ROLES))]
)
def get_stale_alerts(
    db: Session = Depends(get_rls_db_for(get_current_user))
) -> List[AlertResponse]:
    """
    Retrieve a list of stale alerts.
    These are assignments that haven't received a status update in a defined period (e.g., 7 days).
    """
    return AlertsService.get_stale_alerts(db)

@router.get(
    "/{id}",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    tags=["alerts"],
    dependencies=[Depends(require_roles(*PRIVILEGED_ROLES))]
)
def get_alert_by_id(
    id: UUID, 
    db: Session = Depends(get_rls_db_for(get_current_user))
) -> AlertResponse:
    """
    Retrieve a single alert by its ID.
    """
    return AlertsService.get_alert_by_id(id, db)

@router.patch(
    "/{id}",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    tags=["alerts"],
    dependencies=[Depends(require_roles(*PRIVILEGED_ROLES))]
)
def update_alert(
    id: UUID, 
    update_data: AlertUpdate, 
    db: Session = Depends(get_rls_db_for(get_current_user))
) -> AlertResponse:
    """
    Update an alert (e.g., mark it as dismissed).
    """
    return AlertsService.update_alert(id, update_data, db)
