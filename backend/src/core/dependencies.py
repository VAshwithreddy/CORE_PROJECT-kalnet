"""
FastAPI reusable dependencies.

get_current_user — decodes the Bearer JWT issued by /auth/login and returns
a lightweight CurrentUser dataclass that carries the caller's person_id and
role.  Raise 401 for missing / invalid / expired tokens.

require_roles(*roles) — dependency factory that raises HTTP 403 when the
authenticated user's role is not in the allowed set.

Uses HTTPBearer so Swagger shows a simple "paste your token" box rather than
an OAuth2 username/password form (which would need form-encoded credentials,
incompatible with our JSON-based /auth/login endpoint).
"""
import logging
from dataclasses import dataclass
from typing import Callable, Set, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, ExpiredSignatureError

from src.core.config import settings

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"

# HTTPBearer: Swagger renders a simple token input box (Value: <your token>).
# Setting auto_error=False allows us to raise HTTP 401 Unauthorized on missing tokens (instead of FastAPI's default 403 Forbidden).
_bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    """Lightweight identity object extracted from a validated JWT."""
    person_id: UUID
    email: str
    role: str


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> CurrentUser:
    """
    Decode and validate the JWT Bearer token.

    In Swagger: click Authorize, paste just the token value (without 'Bearer ').
    Swagger adds the 'Bearer ' prefix automatically.

    Raises HTTP 401 if:
    - The Authorization header is missing.
    - The token signature is invalid.
    - The token has expired.
    - The ``sub`` claim (person UUID) is absent or malformed.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials  # HTTPBearer strips the "Bearer " prefix
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    algorithms = settings.jwt_algorithms if hasattr(settings, "jwt_algorithms") else [ALGORITHM]

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=algorithms)
    except ExpiredSignatureError:
        logger.warning("JWT validation failed: Access token has expired.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as exc:
        logger.warning(f"JWT decode error: {exc}")
        try:
            unverified = jwt.get_unverified_claims(token)
            header = jwt.get_unverified_header(token)
            logger.warning(f"Unverified token info - Header: {header}, sub claim: {unverified.get('sub')}")
        except Exception:
            pass
        raise credentials_exc

    sub: str = payload.get("sub")
    if not sub:
        logger.warning("JWT validation failed: 'sub' claim missing from payload.")
        raise credentials_exc

    try:
        person_id = UUID(sub)
    except ValueError:
        logger.warning(f"JWT validation failed: 'sub' claim '{sub}' is not a valid UUID.")
        raise credentials_exc

    role = payload.get("role")
    if not role:
        app_meta = payload.get("app_metadata", {})
        user_meta = payload.get("user_metadata", {})
        role = app_meta.get("role") or user_meta.get("role") or "employee"

    return CurrentUser(
        person_id=person_id,
        email=payload.get("email", ""),
        role=str(role),
    )


def require_roles(*allowed_roles: str) -> Callable:
    """
    Dependency factory — returns a FastAPI dependency that enforces role-based
    access control.

    Usage::

        @router.get("/admin-only")
        def admin_endpoint(
            _: CurrentUser = Depends(require_roles("system_admin", "work_admin")),
        ):
            ...

    Raises HTTP 403 when the authenticated user's role is not in *allowed_roles*.
    """
    allowed: Set[str] = set(allowed_roles)

    def _check(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Role '{current_user.role}' is not permitted to access this resource. "
                    f"Required: {sorted(allowed)}."
                ),
            )
        return current_user

    return _check
