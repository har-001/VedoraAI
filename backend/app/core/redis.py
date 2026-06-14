"""
VedoraAI — Redis Client
Async Redis connection for caching, rate limiting, and session management.
"""

import redis.asyncio as aioredis

from app.core.config import get_settings

settings = get_settings()

# ── Redis Connection Pool ────────────────────────────
redis_client = aioredis.from_url(
    settings.redis_url,
    encoding="utf-8",
    decode_responses=True,
    max_connections=50,
)


async def get_redis() -> aioredis.Redis:
    """FastAPI dependency for Redis access."""
    return redis_client


async def close_redis():
    """Graceful shutdown."""
    await redis_client.close()
