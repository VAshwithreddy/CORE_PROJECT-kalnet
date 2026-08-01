from typing import List, Dict, Any

from fastapi import APIRouter, Body

from src.services.resolve_assignments import resolve_assignments
from src.services.staleness import find_stale_assignments

router = APIRouter(
    prefix="/resolve",
    tags=["Entity Resolution"],
)


@router.post("/assignments")
def resolve_assignment_duplicates(
    assignments: List[Dict[str, Any]] = Body(
        ...,
        example=[
            {
                "person_id": "1",
                "project_id": "1",
                "role": "Developer",
                "status": "active"
            },
            {
                "person_id": "1",
                "project_id": "1",
                "role": "Developer",
                "status": "active"
            },
            {
                "person_id": "2",
                "project_id": "1",
                "role": "Tester",
                "status": "active"
            }
        ]
    )
):
    """
    Remove duplicate assignment records.
    """
    return resolve_assignments(assignments)


@router.post("/stale")
def detect_stale_assignments(
    assignments: List[Dict[str, Any]] = Body(
        ...,
        example=[
            {
                "id": "1",
                "person_id": "1",
                "project_id": "1",
                "end_date": "2026-08-01"
            },
            {
                "id": "2",
                "person_id": "2",
                "project_id": "2",
                "end_date": "2025-01-01"
            }
        ]
    )
):
    """
    Detect stale assignments.
    """
    return find_stale_assignments(assignments)


@router.get("/health")
def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "ok",
        "service": "AI Entity Resolution Service"
    }