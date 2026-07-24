from fastapi import HTTPException, status
from src.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, LogoutResponse
from src.dummy_data.auth import DUMMY_USERS_DB, DUMMY_TOKEN, DUMMY_REFRESH_TOKEN


class AuthService:
    """Business logic for the Authentication module (dummy implementation)."""

    @staticmethod
    def login(data: LoginRequest) -> TokenResponse:
        """
        Validate credentials against dummy data and return a dummy JWT pair.
        Raises 401 if the username does not exist or the password is wrong.
        """
        user = DUMMY_USERS_DB.get(data.username)
        if not user or user["password"] != data.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return TokenResponse(
            access_token=DUMMY_TOKEN,
            refresh_token=DUMMY_REFRESH_TOKEN,
            token_type="bearer",
        )

    @staticmethod
    def refresh(data: RefreshRequest) -> TokenResponse:
        """
        Validate the refresh token and issue a new access token.
        Raises 401 if the refresh token is invalid.
        """
        if data.refresh_token != DUMMY_REFRESH_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return TokenResponse(
            access_token=DUMMY_TOKEN,
            refresh_token=DUMMY_REFRESH_TOKEN,
            token_type="bearer",
        )

    @staticmethod
    def logout() -> LogoutResponse:
        """
        Perform a logout. In a real system this would revoke the token.
        With dummy data, always returns a success message.
        """
        return LogoutResponse(message="Successfully logged out.")
