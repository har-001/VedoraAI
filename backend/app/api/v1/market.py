"""
VedoraAI — Market API Routes
Endpoints for market overview, asset quotes, chart data, search, and sectors.
"""

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
import asyncio
import json

from app.services.market_data import market_data
from app.ai.scanner.engine import scanner_engine

router = APIRouter(prefix="/market", tags=["Market Data"])


# ── Market Overview ──────────────────────────────
@router.get("/overview")
async def get_market_overview():
    """Get market indices, top gainers/losers, and market status."""
    return await market_data.get_market_overview()


# ── Technical Scanner ─────────────────────────────
@router.get("/scan")
async def get_market_scan(
    refresh: bool = Query(default=False, description="Bypass cache and run fresh scan")
):
    """Scan top NSE stocks for technical patterns and signals."""
    return await scanner_engine.scan_all(force=refresh)


# ── Asset Quote ──────────────────────────────────
@router.get("/quote/{symbol}")
async def get_asset_quote(symbol: str):
    """Get current quote for a single asset."""
    # Auto-append .NS if no exchange suffix provided
    if "." not in symbol and "^" not in symbol:
        symbol = f"{symbol}.NS"
    return await market_data.get_quote(symbol)


# ── Multiple Quotes ──────────────────────────────
@router.get("/quotes")
async def get_multiple_quotes(
    symbols: str = Query(..., description="Comma-separated symbols, e.g. RELIANCE,TCS,INFY"),
):
    """Get quotes for multiple assets at once."""
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    # Auto-append .NS where needed
    normalized = []
    for s in symbol_list:
        if "." not in s and "^" not in s:
            normalized.append(f"{s}.NS")
        else:
            normalized.append(s)
    return await market_data.get_multiple_quotes(normalized)


# ── Chart Data ───────────────────────────────────
@router.get("/chart/{symbol}")
async def get_chart_data(
    symbol: str,
    interval: str = Query("1d", description="Candle interval: 1m, 5m, 15m, 1h, 1d, 1wk, 1mo"),
    range: str = Query("6mo", description="Data range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max"),
):
    """Get OHLCV candlestick chart data for an asset."""
    if "." not in symbol and "^" not in symbol:
        symbol = f"{symbol}.NS"
    return await market_data.get_chart_data(symbol, interval=interval, range_period=range)


# ── Sector Performance ───────────────────────────
@router.get("/sectors")
async def get_sector_performance():
    """Get average performance by sector."""
    return await market_data.get_sector_performance()


# ── Search ───────────────────────────────────────
@router.get("/search")
async def search_assets(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Max results"),
):
    """Search for assets by name or symbol."""
    return await market_data.search_assets(q, limit=limit)


# ── Popular / Trending ───────────────────────────
@router.get("/popular")
async def get_popular_stocks():
    """Get quotes for the most popular NSE stocks."""
    return await market_data.get_multiple_quotes(market_data.POPULAR_STOCKS_NSE[:20])


# ── Real-Time Price Streaming via WebSocket ──────
@router.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket):
    """WebSocket connection for streaming real-time prices of subscribed symbols."""
    await websocket.accept()
    subscribed_symbols = set()
    
    try:
        # Task to handle incoming messages (e.g. subscribe, unsubscribe)
        async def receive_messages():
            nonlocal subscribed_symbols
            while True:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    action = message.get("action")
                    symbols = message.get("symbols", [])
                    
                    # Normalize symbols
                    normalized_symbols = []
                    for s in symbols:
                        if "." not in s and "^" not in s:
                            normalized_symbols.append(f"{s}.NS")
                        else:
                            normalized_symbols.append(s)
                            
                    if action == "subscribe":
                        subscribed_symbols.update(normalized_symbols)
                    elif action == "unsubscribe":
                        subscribed_symbols.difference_update(normalized_symbols)
                except Exception as e:
                    print(f"WS JSON parse error: {e}")

        # Start the receive task in background
        receive_task = asyncio.create_task(receive_messages())

        # Main loop to stream prices
        while True:
            if subscribed_symbols:
                try:
                    quotes = await market_data.get_multiple_quotes(list(subscribed_symbols))
                    await websocket.send_json({
                        "type": "prices",
                        "data": quotes
                    })
                except Exception as e:
                    print(f"WS price stream error: {e}")
            await asyncio.sleep(4) # Stream updates every 4 seconds

    except WebSocketDisconnect:
        print("WS Client disconnected")
    finally:
        # Clean up task
        if 'receive_task' in locals():
            receive_task.cancel()
