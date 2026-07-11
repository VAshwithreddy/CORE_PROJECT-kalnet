from fastapi import APIRouter

from src.core.config import settings
from src.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.project_name,
        environment=settings.environment,
    )


@router.get("/setup-summary", tags=["system"])
def setup_summary() -> dict[str, list[str]]:
    return {
        "mvp_flow": [
            "work intake",
            "routing",
            "assignment creation",
            "employee progress update",
            "blocker tracking",
            "audit history",
        ],
        "first_modules": [
            "auth",
            "work requests",
            "assignments",
            "blockers",
            "approvals",
            "audit logs",
        ],
    }
