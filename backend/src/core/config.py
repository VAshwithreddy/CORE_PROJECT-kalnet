
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

def load_settings() -> Settings:
    return Settings(
        project_name=os.getenv("CORE_PROJECT_NAME", "CORE API"),
        environment=os.getenv("CORE_ENV", "development"),
        allowed_origins=_csv_env("CORE_ALLOWED_ORIGINS", "http://localhost:3000"),
        database_url=os.getenv("DATABASE_URL", ""),
        secret_key=os.getenv("SECRET_KEY", "insecure-default-secret-key"),
        access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")),
        refresh_token_expire_days=int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")),
        jwt_algorithms=_csv_env("JWT_ALGORITHMS", "HS256,ES256,RS256"),
    )

settings = load_settings()