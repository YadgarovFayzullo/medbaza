"""Application settings, loaded from the environment (never hardcoded)."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    project_name: str = "MedBaza API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    log_level: str = "INFO"
    sentry_dsn: str = ""

    database_url: str = "postgresql+asyncpg://medsupply:medsupply@localhost:5432/medsupply"
    redis_url: str = "redis://localhost:6379/0"

    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    # CLAUDE.md §12.1: access tokens are short-lived.
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 14

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    web_base_url: str = "http://localhost:3000"

    prescription_encryption_key: str = ""
    storage_bucket: str = "medbaza-local"
    storage_endpoint_url: str = ""
    storage_access_key_id: str = ""
    storage_secret_access_key: str = ""
    # Presigned prescription URLs are short-lived and every issue is audited (§5.5).
    presigned_url_ttl_seconds: int = 300

    # CLAUDE.md §4 is open: 'fake' is the only implementation that exists.
    payment_provider: str = "fake"
    payment_webhook_secret: str = "change-me-in-production"
    # Platform commission in basis points, applied per shipment.
    platform_fee_bps: int = 800

    email_api_key: str = ""
    email_from: str = "orders@medbaza.example"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
