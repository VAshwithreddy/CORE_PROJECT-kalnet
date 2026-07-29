"""
FastAPI reusable dependencies.

get_current_user — decodes the Bearer JWT issued by /auth/login and returns
a lightweight CurrentUser dataclass that carries the caller's person_id and
role.  Raise 401 for missing / invalid / expired tokens.

Uses HTTPBearer so Swagger shows a simple "paste your token" box rather than
an OAuth2 username/password form (which would need form-encoded credentials,
incompatible with our JSON-based /auth/login endpoint).
"""
from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, ExpiredSignatureError

from src.core.config import settings

ALGORITHM = "HS256"

# HTTPBearer: Swagger renders a simple token input box (Value: <your token>).
# The user pastes the access_token from POST /auth/login directly — no form flow.
_bearer_scheme = HTTPBearer(auto_error=True)


@dataclass
class CurrentUser:
    """Lightweight identity object extracted from a validated JWT."""
    person_id: UUID
    email: str
    role: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
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
    token = credentials.credentials  # HTTPBearer strips the "Bearer " prefix
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise credentials_exc

    sub: str = payload.get("sub")
    if not sub:
        raise credentials_exc

    try:
        person_id = UUID(sub)
    except ValueError:
        raise credentials_exc

    return CurrentUser(
        person_id=person_id,
        email=payload.get("email", ""),
        role=payload.get("role", "employee"),
    )
