from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Request model for user login."""

    username: str = Field(..., description="The user's login username", example="jdoe")
    password: str = Field(..., description="The user's password", example="secret123")


class FirebaseSessionRequest(BaseModel):
    """A Firebase ID token exchanged for a CORE API session."""

    id_token: str = Field(..., min_length=100)


class TokenResponse(BaseModel):
    """Response model returned after a successful login or token refresh."""

    access_token: str = Field(
        ...,
        description="JWT access token for authenticating subsequent requests",
        example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.payload",
    )
    refresh_token: str = Field(
        ...,
        description="JWT refresh token used to obtain a new access token",
        example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.refresh",
    )
    token_type: str = Field(
        "bearer",
        description="The type of the token (always 'bearer')",
        example="bearer",
    )


class RefreshRequest(BaseModel):
    """Request model for refreshing an access token."""

    refresh_token: str = Field(
        ...,
        description="The refresh token issued at login",
        example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.refresh",
    )


class LogoutResponse(BaseModel):
    """Response model returned after a successful logout."""

    message: str = Field(
        ...,
        description="Confirmation message",
        example="Successfully logged out.",
    )
