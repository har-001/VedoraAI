"""
VedoraAI — Main Application
FastAPI application factory with middleware, CORS, and route registration.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import get_settings
from app.core.redis import close_redis

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # ── Startup ──────────────────────────────────
    print(f"Starting {settings.app_name} API ({settings.app_env})")
    yield
    # ── Shutdown ─────────────────────────────────
    await close_redis()
    print(f"{settings.app_name} API shutting down")


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=f"{settings.app_name} API",
        description="Intelligence Behind Every Decision — AI-Powered Market Intelligence Platform",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # ── Middleware ────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if not settings.debug:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["vedoraai.com", "*.vedoraai.com", "localhost"],
        )

    # ── Routes ───────────────────────────────────
    _register_routes(app)

    # ── Health Check ─────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "service": settings.app_name,
            "version": "1.0.0",
            "environment": settings.app_env,
        }

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.app_name,
            "tagline": "Intelligence Behind Every Decision",
            "version": "1.0.0",
            "docs": "/docs" if settings.debug else None,
        }

    return app


def _register_routes(app: FastAPI):
    """Register all API route groups."""
    from app.api.v1.auth import router as auth_router
    from app.api.v1.users import router as users_router
    from app.api.v1.market import router as market_router
    from app.api.v1.watchlist import router as watchlist_router
    from app.api.v1.portfolio import router as portfolio_router
    from app.api.v1.predictions import router as predictions_router
    from app.api.v1.news import router as news_router
    from app.api.v1.coach import router as coach_router
    from app.api.v1.backtest import router as backtest_router

    api_prefix = f"/api/{settings.api_version}"

    # Phase 1 & 2 routes
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(users_router, prefix=api_prefix)
    app.include_router(market_router, prefix=api_prefix)
    app.include_router(watchlist_router, prefix=api_prefix)
    app.include_router(portfolio_router, prefix=api_prefix)

    # Phase 3 — AI Engine routes
    app.include_router(predictions_router, prefix=api_prefix)
    app.include_router(news_router, prefix=api_prefix)
    app.include_router(coach_router, prefix=api_prefix)

    # Phase 4 — Strategy Lab routes
    app.include_router(backtest_router, prefix=api_prefix)

    # Phase 4 extension — Community Feed & Alerts
    from app.api.v1.community import router as community_router
    from app.api.v1.alerts import router as alerts_router
    app.include_router(community_router, prefix=api_prefix)
    app.include_router(alerts_router, prefix=api_prefix)


# Create app instance
app = create_app()
