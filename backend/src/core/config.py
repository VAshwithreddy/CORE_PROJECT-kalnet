import os
from dataclasses import dataclass


def _csv_env(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    project_name: str
    environment: str
    allowed_origins: list[str]


def load_settings() -> Settings:
    return Settings(
        project_name=os.getenv("CORE_PROJECT_NAME", "CORE API"),
        environment=os.getenv("CORE_ENV", "development"),
        allowed_origins=_csv_env("CORE_ALLOWED_ORIGINS", "http://localhost:3000"),
    )


settings = load_settings()
