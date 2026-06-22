"""
VedoraAI — Stock Detail API
Provides comprehensive stock data (fundamentals, stats, description) from Yahoo Finance.
"""

from fastapi import APIRouter

from app.services.market_data import market_data

router = APIRouter(prefix="/market", tags=["Market"])


@router.get("/detail/{symbol}")
async def get_stock_detail(symbol: str):
    """
    Get comprehensive stock detail for a given symbol.
    Combines quote data, chart history, and key statistics.
    """
    # Normalize symbol
    raw_symbol = symbol.strip().upper()
    yf_symbol = raw_symbol
    if "." not in raw_symbol and "^" not in raw_symbol:
        yf_symbol = f"{raw_symbol}.NS"

    # Fetch quote + chart in parallel
    import asyncio
    quote_task = market_data.get_quote(yf_symbol)
    chart_6m_task = market_data.get_chart_data(yf_symbol, interval="1d", range_period="6mo")
    chart_1y_task = market_data.get_chart_data(yf_symbol, interval="1wk", range_period="1y")

    quote, chart_6m, chart_1y = await asyncio.gather(
        quote_task, chart_6m_task, chart_1y_task
    )

    if "error" in quote:
        return {"error": quote["error"], "symbol": raw_symbol}

    # Calculate derived stats from chart data
    candles_6m = chart_6m.get("candles", [])
    candles_1y = chart_1y.get("candles", [])

    # 52-week high/low from 1Y chart
    week52_high = max((c["high"] for c in candles_1y), default=0) if candles_1y else 0
    week52_low = min((c["low"] for c in candles_1y), default=0) if candles_1y else 0

    # Average volume from 6M chart
    avg_volume = 0
    if candles_6m:
        vols = [c["volume"] for c in candles_6m if c["volume"] > 0]
        avg_volume = int(sum(vols) / len(vols)) if vols else 0

    # Simple 50-day and 200-day moving averages
    sma_50 = 0
    sma_200 = 0
    if candles_6m:
        closes = [c["close"] for c in candles_6m]
        if len(closes) >= 50:
            sma_50 = round(sum(closes[-50:]) / 50, 2)
        if len(closes) >= 200:
            sma_200 = round(sum(closes[-200:]) / 200, 2)

    # Price performance calculations
    perf_1d = quote.get("change_percent", 0)
    perf_1w = 0
    perf_1m = 0
    perf_3m = 0
    perf_6m = 0

    if candles_6m and len(candles_6m) > 0:
        current = candles_6m[-1]["close"]
        if len(candles_6m) >= 5:
            perf_1w = round((current - candles_6m[-5]["close"]) / candles_6m[-5]["close"] * 100, 2)
        if len(candles_6m) >= 22:
            perf_1m = round((current - candles_6m[-22]["close"]) / candles_6m[-22]["close"] * 100, 2)
        if len(candles_6m) >= 66:
            perf_3m = round((current - candles_6m[-66]["close"]) / candles_6m[-66]["close"] * 100, 2)
        perf_6m = round((current - candles_6m[0]["close"]) / candles_6m[0]["close"] * 100, 2)

    return {
        "symbol": raw_symbol,
        "raw_symbol": yf_symbol,
        "name": quote.get("name", raw_symbol),
        "exchange": quote.get("exchange", "NSE"),
        "currency": quote.get("currency", "INR"),
        "current_price": quote.get("current_price", 0),
        "previous_close": quote.get("previous_close", 0),
        "change": quote.get("change", 0),
        "change_percent": quote.get("change_percent", 0),
        "day_high": quote.get("day_high", 0),
        "day_low": quote.get("day_low", 0),
        "volume": quote.get("volume", 0),
        "market_state": quote.get("market_state", "CLOSED"),
        "stats": {
            "week52_high": round(week52_high, 2),
            "week52_low": round(week52_low, 2),
            "avg_volume": avg_volume,
            "sma_50": sma_50,
            "sma_200": sma_200,
        },
        "performance": {
            "1d": perf_1d,
            "1w": perf_1w,
            "1m": perf_1m,
            "3m": perf_3m,
            "6m": perf_6m,
        },
        "chart_6m": candles_6m,
        "chart_1y": candles_1y,
    }
