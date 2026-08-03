"""
FastAPI reusable dependencies.

get_current_user — decodes the Bearer JWT issued by /auth/login, looks up
the matching Person record via auth_user_id, and returns a lightweight
CurrentUser dataclass that carries the caller's real person_id (people.id,
not the Supabase auth.users id) and role. Raise 401 for missing / invalid /
expired tokens, or if no matching Person record exists.

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
from sqlalchemy.orm import Session

from src.core.config import settings
from src.core.database import get_db

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"

# HTTPBearer: Swagger renders a simple token input box (Value: <your token>).
# Setting auto_error=False allows us to raise HTTP 401 Unauthorized on missing tokens (instead of FastAPI's default 403 Forbidden).
_bearer_scheme = HTTPBearer(auto_error=False)


import urllib.request
import json
import time
from jose import jwk

_jwks_cache = None
_jwks_cache_expiry = 0

def get_jwks() -> dict:
    global _jwks_cache, _jwks_cache_expiry
    now = time.time()
    if _jwks_cache is None or now > _jwks_cache_expiry:
        if not settings.jwks_url:
            raise JWTError("JWKS_URL is not configured.")
        try:
            with urllib.request.urlopen(settings.jwks_url, timeout=5) as response:
                _jwks_cache = json.loads(response.read().decode())
                _jwks_cache_expiry = now + 3600  # cache 1 hour
        except Exception as e:
            logger.error(f"Failed to fetch JWKS from {settings.jwks_url}: {e}")
            if _jwks_cache:
                return _jwks_cache
            raise JWTError(f"Failed to fetch JWKS: {e}") from e
    return _jwks_cache


@dataclass
class CurrentUser:
    """Lightweight identity object extracted from a validated JWT + Person lookup."""
    person_id: UUID
    email: str
    role: str


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    """
    Decode and validate the JWT Bearer token, then resolve the real
    `people.id` by looking up `people.auth_user_id == token sub claim`.

    In Swagger: click Authorize, paste just the token value (without 'Bearer ').
    Swagger adds the 'Bearer ' prefix automatically.

    Raises HTTP 401 if:
    - The Authorization header is missing.
    - The token signature is invalid.
    - The token has expired.
    - The ``sub`` claim (auth.users UUID) is absent or malformed.
    - No Person record exists with matching auth_user_id.
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
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg")
        kid = unverified_header.get("kid")
    except JWTError as exc:
        logger.warning(f"Failed to decode JWT headers: {exc}")
        raise credentials_exc

    if alg == "HS256":
        key_to_use = settings.secret_key
    elif alg in ("ES256", "RS256"):
        if not kid:
            logger.warning("JWT validation failed: 'kid' missing from asymmetric token header.")
            raise credentials_exc
        try:
            jwks = get_jwks()
            keys = jwks.get("keys", [])
            jwk_dict = next((k for k in keys if k.get("kid") == kid), None)
            if not jwk_dict:
                logger.warning(f"JWT validation failed: No matching JWK found for kid '{kid}'.")
                raise credentials_exc
            key_to_use = jwk.construct(jwk_dict)
        except JWTError as exc:
            logger.warning(f"Asymmetric key extraction failed: {exc}")
            raise credentials_exc
    else:
        logger.warning(f"Unsupported JWT algorithm: {alg}")
        raise credentials_exc

    try:
        payload = jwt.decode(token, key_to_use, algorithms=algorithms, audience="authenticated")
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
        auth_user_id = UUID(sub)
    except ValueError:
        logger.warning(f"JWT validation failed: 'sub' claim '{sub}' is not a valid UUID.")
        raise credentials_exc

    # --- Resolve the real people.id via auth_user_id lookup ---
    # sub is Supabase's auth.users.id, NOT people.id. RLS/queries filter on
    # people.id (assignments.person_id etc.), so we must look it up.
    from src.models.person import Person
    person = db.query(Person).filter(Person.auth_user_id == auth_user_id).first()
    if not person:
        logger.warning(f"JWT validation failed: no Person found with auth_user_id '{auth_user_id}'.")
        raise credentials_exc

    role = payload.get("role")
    if not role:
        app_meta = payload.get("app_metadata", {})
        user_meta = payload.get("user_metadata", {})
        role = app_meta.get("role") or user_meta.get("role") or "employee"
    # Prefer the role stored on the Person record if available (source of truth)
    if getattr(person, "role", None):
        role = person.role.value if hasattr(person.role, "value") else str(person.role)

    return CurrentUser(
        person_id=person.id,
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