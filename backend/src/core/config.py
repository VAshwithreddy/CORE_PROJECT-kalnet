import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # loads values from .env into os.getenv()


def _csv_env(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


def _firebase_service_account_json() -> str:
    """Load Firebase Admin credentials from an environment value or secret file."""
    inline_value = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if inline_value:
        return inline_value

    secret_file = os.getenv("FIREBASE_SERVICE_ACCOUNT_FILE", "").strip()
    if not secret_file:
        return ""
    try:
        return Path(secret_file).read_text(encoding="utf-8").strip()
    except OSError as exc:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_FILE could not be read. "
            "Check the deployed secret-file path."
        ) from exc


@dataclass(frozen=True)
class Settings:
    project_name: str
    environment: str
    allowed_origins: list[str]
    database_url: str
    secret_key: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    jwt_algorithms: list[str]
    jwks_url: str
    allow_dev_passwordless_login: bool
    firebase_service_account_json: str

    # Notification AI Intelligence
    ai_enabled: bool
    ai_api_key: str
    ai_model: str

    # Notification rules
    notification_deadline_warning_hours: int
    notification_escalation_hours_default: int
    notification_escalation_hours_high_priority: int


def load_settings() -> Settings:
    database_url = os.getenv("DATABASE_URL", "")
    jwks_url = os.getenv("JWKS_URL", "")
    environment = os.getenv("CORE_ENV", "development").lower()
    secret_key = os.getenv("SECRET_KEY", "")
    firebase_service_account_json = _firebase_service_account_json()
    if environment == "production" and (not secret_key or secret_key == "insecure-default-secret-key"):
        raise RuntimeError("SECRET_KEY must be set to a strong unique value in production.")
    if environment == "production" and not os.getenv("CORE_ALLOWED_ORIGINS"):
        raise RuntimeError("CORE_ALLOWED_ORIGINS must list the production frontend origin.")
    if environment == "production" and not firebase_service_account_json:
        raise RuntimeError(
            "Configure FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_FILE in production."
        )

    if not jwks_url:
        # Extract from database_url if it's a Supabase pooler/direct connection
        # e.g., postgresql://postgres.jgpklwlzxvlisiktgkzu:...
        if "postgres." in database_url:
            parts = database_url.split("postgres.")
            if len(parts) > 1:
                ref = parts[1].split("@")[0].split(":")[0].split(".")[0]
                jwks_url = f"https://{ref}.supabase.co/rest/v1/auth/jwks"

    return Settings(
        project_name=os.getenv("CORE_PROJECT_NAME", "CORE API"),
        environment=environment,
        allowed_origins=_csv_env(
            "CORE_ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ),
        database_url=database_url,
        secret_key=secret_key or "insecure-default-secret-key",
        access_token_expire_minutes=int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        ),
        refresh_token_expire_days=int(
            os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")
        ),
        jwt_algorithms=_csv_env(
            "JWT_ALGORITHMS",
            "HS256,ES256,RS256",
        ),
        jwks_url=jwks_url,
        allow_dev_passwordless_login=os.getenv(
            "CORE_ALLOW_DEV_PASSWORDLESS_LOGIN",
            "true" if environment != "production" else "false",
        ).lower() == "true",
        firebase_service_account_json=firebase_service_account_json,

        # Notification AI Intelligence
        ai_enabled=os.getenv("AI_ENABLED", "false").lower() == "true",
        ai_api_key=os.getenv("AI_API_KEY", ""),
        ai_model=os.getenv(
            "AI_MODEL",
            "claude-3-5-sonnet-20241022",
        ),

        # Notification rules
        notification_deadline_warning_hours=int(
            os.getenv(
                "NOTIFICATION_DEADLINE_WARNING_HOURS",
                "48",
            )
        ),
        notification_escalation_hours_default=int(
            os.getenv(
                "NOTIFICATION_ESCALATION_HOURS_DEFAULT",
                "96",
            )
        ),
        notification_escalation_hours_high_priority=int(
            os.getenv(
                "NOTIFICATION_ESCALATION_HOURS_HIGH_PRIORITY",
                "24",
            )
        ),
    )


settings = load_settings()
