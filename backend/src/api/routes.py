"""
routes.py — kept for backwards compatibility.

All routers are now registered directly in main.py with explicit
/api/v1/... prefixes. This file is no longer the primary aggregator
but is preserved so that any external import of `src.api.routes`
does not raise an ImportError.
"""

from fastapi import APIRouter

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
from src.api.system import router as system_router

# Kept only for legacy compatibility — not used by main.py.
router = APIRouter()
