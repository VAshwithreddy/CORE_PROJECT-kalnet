from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """
    Response model for the health check API.
    """
    status: str = Field(..., description="Current status of the API", example="ok")
    service: str = Field(..., description="Name of the service", example="CORE API")
    environment: str = Field(..., description="Environment (e.g., dev, prod)", example="development")
