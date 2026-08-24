from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import get_current_user, CurrentUser, require_roles
from src.core.rbac import PRIVILEGED_ROLES
from src.schemas.risks import RiskResponse, RiskEscalateRequest, RiskEscalateResponse, EscalationResponse
from src.services.risks import RisksService

router = APIRouter()

@router.get(
    "",
    response_model=List[RiskResponse],
    status_code=status.HTTP_200_OK,
    tags=["risks"],
    dependencies=[Depends(require_roles(*PRIVILEGED_ROLES))]
)
def get_all_risks(
    db: Session = Depends(get_rls_db_for(get_current_user))
) -> List[RiskResponse]:
    """
    Retrieve all risks from the database (both staleness alerts and compliance items).
    Requires executive, work_admin, or system_admin role.
    """
    return RisksService.get_all_risks(db)

@router.get(
    "/escalations",
    response_model=List[EscalationResponse],
    status_code=status.HTTP_200_OK,
    tags=["risks"],
    dependencies=[Depends(require_roles(*PRIVILEGED_ROLES))]
)
def get_escalations(
    db: Session = Depends(get_rls_db_for(get_current_user))
) -> List[EscalationResponse]:
    """
    Retrieve all escalated risks. Used by Work Admin Escalations page.
    Requires executive, work_admin, or system_admin role.
    """
    return RisksService.get_escalations(db)

@router.post(
    "/{risk_id}/escalate",
    response_model=RiskEscalateResponse,
    status_code=status.HTTP_200_OK,
    tags=["risks"],
    dependencies=[Depends(require_roles("executive", "system_admin"))]
)
def escalate_risk(
    risk_id: UUID,
    request: RiskEscalateRequest,
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user)
) -> RiskEscalateResponse:
    """
    Escalate a specific risk. Only accessible to executives and system administrators.
    """
    res = RisksService.escalate_risk(db, str(risk_id), current_user, request.reason)
    return RiskEscalateResponse(
        risk_id=res["risk_id"],
        escalation_id=res["escalation_id"],
        status=res["status"],
        message=res["message"]
    )

@router.post(
    "/{risk_id}/mitigate",
    response_model=RiskEscalateResponse,
    status_code=status.HTTP_200_OK,
    tags=["risks"],
    dependencies=[Depends(require_roles(*PRIVILEGED_ROLES))]
)
def mitigate_risk(
    risk_id: UUID,
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user)
) -> RiskEscalateResponse:
    """
    Mark a specific risk as mitigated. Accessible to executive, work_admin, or system_admin.
    """
    res = RisksService.mitigate_risk(db, str(risk_id), current_user)
    return RiskEscalateResponse(
        risk_id=res["risk_id"],
        escalation_id=res["escalation_id"],
        status=res["status"],
        message=res["message"]
    )
