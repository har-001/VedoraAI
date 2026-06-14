"""
VedoraAI — Database Engine & Session Management
Async PostgreSQL connection via SQLAlchemy 2.0
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

# ── Async Engine ─────────────────────────────────────
if settings.database_url.startswith("sqlite"):
    engine = create_async_engine(
        settings.database_url,
        echo=settings.database_echo,
    )
else:
    engine = create_async_engine(
        settings.database_url,
        echo=settings.database_echo,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
    )

# ── Session Factory ──────────────────────────────────
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Base Model ───────────────────────────────────────
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# ── Dependency ───────────────────────────────────────
async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
