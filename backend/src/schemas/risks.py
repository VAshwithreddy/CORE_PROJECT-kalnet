"""
risks.py — Pydantic schemas for the Risk Management module.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RiskResponse(BaseModel):
    """Response model for a single risk record."""
    id: str = Field(..., description="Unique ID of the risk (staleness_alert or approval_request UUID)")
    name: str = Field(..., description="Risk/threat name")
    category: str = Field(..., description="Risk category (Infrastructure, Compliance, Performance, etc.)")
    likelihood: int = Field(..., description="Likelihood rating 1-5")
    impact: int = Field(..., description="Impact rating 1-5")
    score: int = Field(..., description="Severity score = likelihood × impact")
    owner: str = Field(..., description="Mitigation owner")
    status: str = Field(..., description="Risk status: Open | Escalated | Mitigated")
    mitigation: str = Field(..., description="Mitigation plan / alert context")
    progress: int = Field(..., description="Mitigation progress percentage 0-100")

    class Config:
        from_attributes = True


class RiskEscalateRequest(BaseModel):
    """Request body for escalating a risk."""
    reason: Optional[str] = Field(
        None,
        description="Escalation reason / context provided by the executive",
        example="Infrastructure risk is blocking the Q3 release. Immediate action required.",
    )


class RiskEscalateResponse(BaseModel):
    """Response returned after escalating or mitigating a risk."""
    risk_id: str = Field(..., description="The risk that was acted on")
    escalation_id: Optional[str] = Field(None, description="Audit log ID for the escalation entry")
    status: str = Field(..., description="New effective status of the risk")
    message: str = Field(..., description="Human-readable result message")


class EscalationResponse(BaseModel):
    """
    Response model for a risk escalation record — used by the Work Admin
    Escalations page to display escalated risks.
    """
    id: str = Field(..., description="Audit log entry ID for this escalation")
    risk_id: str = Field(..., description="The risk that was escalated")
    risk_name: str = Field(..., description="Risk/threat name at time of escalation")
    risk_category: str = Field(..., description="Risk category")
    likelihood: int = Field(..., description="Likelihood rating")
    impact: int = Field(..., description="Impact rating")
    score: int = Field(..., description="Severity score")
    owner: str = Field(..., description="Mitigation owner")
    reason: Optional[str] = Field(None, description="Escalation reason provided by executive")
    escalated_by: str = Field(..., description="Name of the executive who escalated")
    escalation_status: str = Field(..., description="pending | resolved")
    created_at: datetime = Field(..., description="Timestamp when the escalation was created")
    mitigation: Optional[str] = Field(None, description="Mitigation plan / context")
    progress: int = Field(..., description="Mitigation progress 0-100")
