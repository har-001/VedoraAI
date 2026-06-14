"""
VedoraAI — Market Models
Assets, price data, predictions, watchlists, portfolios.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UUID,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Asset(Base):
    """Financial asset (stock, crypto, forex, etc.)."""

    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(30), nullable=False)  # stock, crypto, forex, commodity, index
    exchange = Column(String(50), nullable=True)  # NSE, BSE, NASDAQ, etc.
    sector = Column(String(100), nullable=True)
    industry = Column(String(100), nullable=True)
    country = Column(String(50), default="IN")
    currency = Column(String(5), default="INR")
    is_active = Column(Boolean, default=True)
    logo_url = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)

    # Current snapshot (updated by data pipeline)
    current_price = Column(Float, nullable=True)
    previous_close = Column(Float, nullable=True)
    day_change = Column(Float, nullable=True)
    day_change_percent = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    market_cap = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    predictions = relationship("Prediction", back_populates="asset", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_assets_type", "asset_type"),
        Index("ix_assets_exchange", "exchange"),
        Index("ix_assets_sector", "sector"),
    )


class PriceHistory(Base):
    """OHLCV candle data."""

    __tablename__ = "price_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False, index=True)
    timeframe = Column(String(10), nullable=False)  # 1m, 5m, 15m, 1h, 4h, 1d, 1w
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        Index("ix_price_history_asset_time", "asset_id", "timeframe", "timestamp"),
    )


class Prediction(Base):
    """AI-generated prediction for an asset."""

    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False, index=True)

    # Prediction horizon
    horizon = Column(String(20), nullable=False)  # intraday, 1d, 3d, 7d, 30d, long_term

    # Probabilities (sum to 1.0)
    bullish_probability = Column(Float, nullable=False)
    bearish_probability = Column(Float, nullable=False)
    neutral_probability = Column(Float, nullable=False)

    # Scores
    confidence_score = Column(Float, nullable=False)  # 0-100
    risk_score = Column(Float, nullable=False)  # 0-100
    opportunity_score = Column(Float, nullable=False)  # 0-100
    trend_strength = Column(Float, nullable=True)  # 0-100
    volatility_score = Column(Float, nullable=True)  # 0-100

    # Outlook
    outlook = Column(String(20), nullable=False)  # bullish, bearish, neutral
    market_condition = Column(String(50), nullable=True)

    # Price targets
    price_target_low = Column(Float, nullable=True)
    price_target_high = Column(Float, nullable=True)
    expected_upside_min = Column(Float, nullable=True)
    expected_upside_max = Column(Float, nullable=True)
    expected_downside_min = Column(Float, nullable=True)
    expected_downside_max = Column(Float, nullable=True)

    # Explanation (JSON for structured reasons)
    reasoning = Column(JSON, default=list)
    alternative_scenario = Column(Text, nullable=True)
    contributing_indicators = Column(JSON, default=list)
    affecting_news = Column(JSON, default=list)
    risks = Column(JSON, default=list)
    invalidation_conditions = Column(JSON, default=list)

    # Model info
    model_version = Column(String(50), nullable=True)
    models_used = Column(JSON, default=list)

    # Timestamps
    generated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Accuracy tracking (filled in after the fact)
    actual_outcome = Column(String(20), nullable=True)
    accuracy_score = Column(Float, nullable=True)

    asset = relationship("Asset", back_populates="predictions")

    __table_args__ = (
        Index("ix_predictions_asset_horizon", "asset_id", "horizon"),
        Index("ix_predictions_generated", "generated_at"),
    )


class Watchlist(Base):
    """User's watchlist."""

    __tablename__ = "watchlists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False, default="My Watchlist")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")


class WatchlistItem(Base):
    """Asset in a watchlist."""

    __tablename__ = "watchlist_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    watchlist_id = Column(UUID(as_uuid=True), ForeignKey("watchlists.id"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=True)
    sort_order = Column(Integer, default=0)
    added_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    watchlist = relationship("Watchlist", back_populates="items")


class Portfolio(Base):
    """User's portfolio for tracking (NOT actual trading)."""

    __tablename__ = "portfolios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False, default="My Portfolio")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    holdings = relationship("PortfolioHolding", back_populates="portfolio", cascade="all, delete-orphan")


class PortfolioHolding(Base):
    """Individual holding in a portfolio."""

    __tablename__ = "portfolio_holdings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    avg_buy_price = Column(Float, nullable=False)
    buy_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    portfolio = relationship("Portfolio", back_populates="holdings")
