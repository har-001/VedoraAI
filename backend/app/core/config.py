"""
VedoraAI — Core Configuration
Centralized settings management using pydantic-settings.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────
    app_name: str = "VedoraAI"
    app_env: str = "development"
    debug: bool = True
    api_version: str = "v1"
    secret_key: str = "change-me-in-production"
    allowed_origins: str = "http://localhost:3000,http://localhost:3001"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    # ── Database ─────────────────────────────────────
    database_url: str = "postgresql+asyncpg://vedora:vedora_secret@localhost:5432/vedoraai"
    database_echo: bool = False

    # ── Redis ────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── JWT ──────────────────────────────────────────
    jwt_secret_key: str = "change-me-jwt-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # ── OAuth ────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    apple_client_id: str = ""
    apple_team_id: str = ""
    apple_key_id: str = ""

    # ── Email ────────────────────────────────────────
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    # ── OTP ──────────────────────────────────────────
    otp_expiry_minutes: int = 5

    # ── External APIs ────────────────────────────────
    alpha_vantage_api_key: str = ""
    gemini_api_key: str = ""

    # ── Payment ──────────────────────────────────────
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    # ── URLs ─────────────────────────────────────────
    frontend_url: str = "http://localhost:3000"
    admin_url: str = "http://localhost:3001"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — loaded once, reused everywhere."""
    return Settings()
