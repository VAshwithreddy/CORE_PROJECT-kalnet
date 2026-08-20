from fastapi import APIRouter, status, Query
from src.schemas.auth import FirebaseSessionRequest, LoginRequest, TokenResponse, RefreshRequest, LogoutResponse
from src.services.auth import AuthService
from src.core.config import settings
from src.core.database import get_db, get_rls_db_for
from src.core.dependencies import CurrentUser, get_current_user
from src.core.rbac import RBACService
from sqlalchemy.orm import Session
from fastapi import Depends
from src.models.person import Person
from src.models.department import Department
from src.models.assignment import Assignment
from src.models.project import Project
from fastapi.responses import JSONResponse
from uuid import UUID

router = APIRouter()


def _profile_response(person: Person, db: Session) -> dict:
    dept_name = "General"
    if person.department_id:
        dept = db.query(Department).filter(Department.id == person.department_id).first()
        dept_name = dept.name if dept else "General"
    role_value = person.role.value if hasattr(person.role, "value") else str(person.role)
    role_map = {
        "department_head": "department_head", "work_admin": "work_admin", "system_admin": "system_admin",
        "executive": "executive", "employee": "employee", "manager": "employee", "team_leader": "employee",
    }
    full_name = person.full_name or ""
    return {
        "id": str(person.id), "name": full_name or person.email.split("@")[0], "email": person.email,
        "role": role_map.get(role_value, role_value), "roleLabel": person.job_title or "Member",
        "departmentId": str(person.department_id) if person.department_id else "dept-general",
        "departmentName": dept_name,
        "initials": "".join(part[0].upper() for part in full_name.split() if part)[:2] or person.email[0].upper(),
    }


@router.get(
    "/lookup",
    status_code=status.HTTP_200_OK,
    summary="Lookup User by Email",
    tags=["Authentication"],
)
def lookup_user_by_email(
    email: str = Query(..., description="Email address to look up"),
    db: Session = Depends(get_db),
):
    """
    Public endpoint to look up a user's profile by email address.
    Used by the frontend after Firebase Google authentication to fetch
    the user's role and department from the database.
    No authentication required — email is validated against the people table.
    """
    if not settings.allow_dev_passwordless_login:
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    person = db.query(Person).filter(Person.email == email.strip().lower()).first()
    if not person:
        return JSONResponse(status_code=404, content={"detail": "User not found"})

    return _profile_response(person, db)


@router.post("/firebase-session", status_code=status.HTTP_200_OK, tags=["Authentication"])
def firebase_session(data: FirebaseSessionRequest, db: Session = Depends(get_db)):
    """Exchange a verified Firebase ID token for a scoped CORE session."""
    tokens, person = AuthService.login_with_firebase(data.id_token, db)
    return {**tokens.model_dump(), "profile": _profile_response(person, db)}


@router.get(
    "/assignments",
    status_code=status.HTTP_200_OK,
    summary="Get Assignments by Person ID",
    tags=["Authentication"],
)
def get_assignments_by_person(
    person_id: str = Query(..., description="Person UUID to fetch assignments for"),
    db: Session = Depends(get_rls_db_for(get_current_user)),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Retrieve assignments after the caller has been authenticated and scoped.
    Returns assignment details including project name and project ID.
    """
    try:
        person_uuid = UUID(person_id)
    except ValueError:
        return JSONResponse(status_code=400, content={"detail": "Invalid person_id format"})

    RBACService.assert_person_access(db, current_user, person_uuid)

    assignments = db.query(Assignment).filter(Assignment.person_id == person_uuid).all()
    result = []
    for a in assignments:
        project = None
        if a.project_id:
            try:
                project = db.query(Project).filter(Project.id == UUID(str(a.project_id))).first()
            except Exception:
                pass

        result.append({
            "id": str(a.id),
            "personId": str(a.person_id),
            "projectId": str(a.project_id) if a.project_id else None,
            "projectName": project.name if project else "Unknown Project",
            "role": a.role or "Member",
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "startDate": str(a.start_date) if a.start_date else None,
            "endDate": str(a.end_date) if a.end_date else None,
        })

    return result


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    tags=["Authentication"],
)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Authenticate a user with their username and password.

    - Validates the credentials against the user store.
    - Returns a JWT **access token** and a **refresh token** on success.
    - Raises **401 Unauthorized** if the credentials are invalid.

    > **Note:** This is a dummy implementation — no real JWT signing occurs.
    """
    return AuthService.login(data, db)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh Access Token",
    tags=["Authentication"],
)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Exchange a valid **refresh token** for a new access token pair.

    - Validates the provided refresh token.
    - Returns a new access token and refresh token on success.
    - Raises **401 Unauthorized** if the refresh token is invalid or expired.
    """
    return AuthService.refresh(data, db)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    tags=["Authentication"],
)
def logout(db: Session = Depends(get_db)) -> LogoutResponse:
    """
    Log the current user out.

    - In a production system, this would revoke/blacklist the token server-side.
    - Returns a confirmation message.
    """
    return AuthService.logout(db)

