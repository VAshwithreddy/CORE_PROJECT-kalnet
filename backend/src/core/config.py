
import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()  # loads values from .env into os.getenv()

def _csv_env(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]

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

def load_settings() -> Settings:
    database_url = os.getenv("DATABASE_URL", "")
    jwks_url = os.getenv("JWKS_URL", "")
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
        environment=os.getenv("CORE_ENV", "development"),
        allowed_origins=_csv_env("CORE_ALLOWED_ORIGINS", "http://localhost:3000"),
        database_url=database_url,
        secret_key=os.getenv("SECRET_KEY", "insecure-default-secret-key"),
        access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")),
        refresh_token_expire_days=int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")),
        jwt_algorithms=_csv_env("JWT_ALGORITHMS", "HS256,ES256,RS256"),
        jwks_url=jwks_url,
    )

settings = load_settings()