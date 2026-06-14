"""
VedoraAI — News API
Endpoints for market news with sentiment analysis.
"""

from fastapi import APIRouter, Query

from app.ai.sentiment.engine import sentiment_engine

router = APIRouter(prefix="/news", tags=["News"])


@router.get("")
async def get_market_news(
    limit: int = Query(default=20, le=50, ge=1),
):
    """
    Get market news with AI sentiment analysis.
    Returns articles with sentiment scores and labels.
    """
    result = await sentiment_engine.get_market_news(limit=limit)
    return result


@router.get("/{symbol}")
async def get_symbol_news(
    symbol: str,
    limit: int = Query(default=10, le=20, ge=1),
):
    """Get news for a specific stock with sentiment analysis."""
    # Add .NS suffix if not present for Yahoo Finance
    raw_symbol = symbol if "." in symbol else f"{symbol}.NS"
    result = await sentiment_engine.get_symbol_news(raw_symbol, limit=limit)
    return result
