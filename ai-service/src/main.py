from fastapi import FastAPI

from src.api.resolve import router as resolve_router

app = FastAPI(
    title="AI Entity Resolution Service",
    description="AI service for resolving project assignments and detecting stale assignments.",
    version="1.0.0",
)

# Register API routes
app.include_router(resolve_router)


@app.get("/")
def root():
    """
    Root endpoint.
    """
    return {
        "service": "AI Entity Resolution Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy"
    }