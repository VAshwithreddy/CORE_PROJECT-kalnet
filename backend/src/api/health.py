from fastapi import APIRouter
from src.schemas.health import HealthResponse
from src.services.health import HealthService

router = APIRouter()

@router.get("", response_model=HealthResponse, tags=["system"])
def health_check() -> HealthResponse:
    """
    Health check endpoint to verify if the API is running successfully.
    Returns basic service information and environment details.
    """
    return HealthService.get_health_status()
