from fastapi import APIRouter, status
from src.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, LogoutResponse
from src.services.auth import AuthService

router = APIRouter()


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    tags=["Authentication"],
)
def login(data: LoginRequest) -> TokenResponse:
    """
    Authenticate a user with their username and password.

    - Validates the credentials against the user store.
    - Returns a JWT **access token** and a **refresh token** on success.
    - Raises **401 Unauthorized** if the credentials are invalid.

    > **Note:** This is a dummy implementation — no real JWT signing occurs.
    """
    return AuthService.login(data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh Access Token",
    tags=["Authentication"],
)
def refresh_token(data: RefreshRequest) -> TokenResponse:
    """
    Exchange a valid **refresh token** for a new access token pair.

    - Validates the provided refresh token.
    - Returns a new access token and refresh token on success.
    - Raises **401 Unauthorized** if the refresh token is invalid or expired.
    """
    return AuthService.refresh(data)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    tags=["Authentication"],
)
def logout() -> LogoutResponse:
    """
    Log the current user out.

    - In a production system, this would revoke/blacklist the token server-side.
    - Returns a confirmation message.
    """
    return AuthService.logout()
