from src.core.config import settings
from src.schemas.health import HealthResponse

class HealthService:
    """
    Service layer for Health module.
    Organized to isolate business logic from API routing.
    """
    
    @staticmethod
    def get_health_status() -> HealthResponse:
        """
        Retrieves the health status of the application.
        Can be extended later to check database connectivity.
        """
        return HealthResponse(
            status="ok",
            service=settings.project_name,
            environment=settings.environment,
        )
