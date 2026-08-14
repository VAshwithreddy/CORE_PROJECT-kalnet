"""
CORE API — main application entry point.

Every router is imported and registered here directly with an explicit
/api/v1/... prefix and a Swagger tag so that ALL endpoints appear in:
  • http://127.0.0.1:8000/docs
  • http://127.0.0.1:8000/redoc
  • http://127.0.0.1:8000/api/v1/openapi.json
"""

import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.core.config import settings

# ── Individual routers ────────────────────────────────────────────────────────
from src.api.health import router as health_router
from src.api.auth import router as auth_router
from src.api.me import router as me_router
from src.api.people import router as people_router
from src.api.departments import router as departments_router
from src.api.projects import router as projects_router
from src.api.assignments import router as assignments_router
from src.api.status_updates import router as status_updates_router
from src.api.dashboards import router as dashboards_router
from src.api.digests import router as digests_router
from src.api.alerts import router as alerts_router
from src.api.notifications import router as notifications_router
from src.api.system import router as system_router
from src.api.notifications import router as notifications_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("core_api")


# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    from src.core.database import init_db
    try:
        init_db()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    app = FastAPI(
        title="CORE API",
        description=(
            "**Centralized Organization Registry Engine** — Backend REST API.\n\n"
            "All endpoints are prefixed with `/api/v1/`. "
            "Connected to Supabase PostgreSQL."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/api/v1/openapi.json",
    )

    # ── Global unhandled exception handler ────────────────────────────────────
    # This catches any Exception that escapes route handlers and returns
    # a JSON 500 with the real error message instead of a blank "Internal
    # Server Error", making debugging in Postman / Swagger trivial.
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        tb = traceback.format_exc()
        logger.error(
            "Unhandled exception on %s %s\n%s",
            request.method,
            request.url,
            tb,
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "type": type(exc).__name__,
                "path": str(request.url),
            },
        )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(
        health_router,
        prefix="/api/v1/health",
        tags=["Health"],
    )
    app.include_router(
        auth_router,
        prefix="/api/v1/auth",
        tags=["Authentication"],
    )
    app.include_router(
        me_router,
        prefix="/api/v1/me",
        tags=["Current User"],
    )
    app.include_router(
        people_router,
        prefix="/api/v1/people",
        tags=["People"],
    )
    app.include_router(
        departments_router,
        prefix="/api/v1/departments",
        tags=["Departments"],
    )
    app.include_router(
        projects_router,
        prefix="/api/v1/projects",
        tags=["Projects"],
    )
    app.include_router(
        assignments_router,
        prefix="/api/v1/assignments",
        tags=["Assignments"],
    )
    # Status-updates are nested under /assignments/:id/status-updates
    app.include_router(
        status_updates_router,
        prefix="/api/v1/assignments",
        tags=["Status Updates"],
    )
    app.include_router(
        dashboards_router,
        prefix="/api/v1/dashboard",
        tags=["Dashboard"],
    )
    app.include_router(
        digests_router,
        prefix="/api/v1/digests",
        tags=["Weekly Digests"],
    )
    app.include_router(
        alerts_router,
        prefix="/api/v1/alerts",
        tags=["Alerts"],
    
    )
    app.include_router(
        notifications_router,
        prefix="/api/v1/notifications",
        tags=["Notifications"],
    )
    app.include_router(
        system_router,
        prefix="/api/v1/system",
    )
    app.include_router(
        notifications_router,
        prefix="/api/v1/notifications",
        tags=["Notifications"],
    )

    return app


app = create_app()
