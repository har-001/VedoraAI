"""
VedoraAI — Market Schemas
Pydantic models for watchlist, portfolio, and market data request/response validation.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Watchlist ────────────────────────────────────────
class WatchlistCreate(BaseModel):
    name: str = Field("My Watchlist", min_length=1, max_length=100)


class WatchlistUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class WatchlistItemAdd(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)


class WatchlistItemResponse(BaseModel):
    id: UUID
    symbol: str
    sort_order: int
    added_at: datetime

    class Config:
        from_attributes = True


class WatchlistResponse(BaseModel):
    id: UUID
    name: str
    is_default: bool
    created_at: datetime
    items: list[WatchlistItemResponse] = []

    class Config:
        from_attributes = True


# ── Portfolio ────────────────────────────────────────
class PortfolioCreate(BaseModel):
    name: str = Field("My Portfolio", min_length=1, max_length=100)


class PortfolioUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class HoldingAdd(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    quantity: float = Field(..., gt=0)
    avg_buy_price: float = Field(..., gt=0)
    notes: Optional[str] = None


class HoldingUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0)
    avg_buy_price: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = None


class HoldingResponse(BaseModel):
    id: UUID
    symbol: str
    quantity: float
    avg_buy_price: float
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioResponse(BaseModel):
    id: UUID
    name: str
    is_default: bool
    created_at: datetime
    holdings: list[HoldingResponse] = []

    class Config:
        from_attributes = True
