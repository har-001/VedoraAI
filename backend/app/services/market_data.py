"""
VedoraAI — Market Data Service
Fetches market data from Yahoo Finance (free) for MVP.
Provides price data, market overview, asset info, and chart data.
"""

import asyncio
from datetime import datetime, timezone
from typing import Optional

import httpx

# Yahoo Finance unofficial API endpoints
YF_BASE = "https://query1.finance.yahoo.com/v8/finance"
YF_QUOTE = f"{YF_BASE}/chart"
YF_SEARCH = "https://query2.finance.yahoo.com/v1/finance/search"


class MarketDataService:
    """Market data provider using Yahoo Finance."""

    # ── Indian Market Indices & Popular Stocks ───
    INDIAN_INDICES = {
        "^NSEI": {"name": "NIFTY 50", "type": "index"},
        "^BSESN": {"name": "SENSEX", "type": "index"},
        "^NSEBANK": {"name": "BANK NIFTY", "type": "index"},
    }

    POPULAR_STOCKS_NSE = [
        "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
        "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "BAJFINANCE.NS",
        "WIPRO.NS", "HCLTECH.NS", "KOTAKBANK.NS", "LT.NS", "AXISBANK.NS",
        "ASIANPAINT.NS", "MARUTI.NS", "TITAN.NS", "SUNPHARMA.NS", "ULTRACEMCO.NS",
        "NESTLEIND.NS", "TECHM.NS", "TATAMOTORS.NS", "POWERGRID.NS", "NTPC.NS",
        "ONGC.NS", "JSWSTEEL.NS", "TATASTEEL.NS", "ADANIENT.NS", "ADANIPORTS.NS",
    ]

    SECTORS = {
        "IT": ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS"],
        "Banking": ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS", "AXISBANK.NS"],
        "Energy": ["RELIANCE.NS", "ONGC.NS", "NTPC.NS", "POWERGRID.NS", "ADANIENT.NS"],
        "FMCG": ["HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "DABUR.NS"],
        "Auto": ["MARUTI.NS", "TATAMOTORS.NS", "BAJAJ-AUTO.NS", "EICHERMOT.NS", "M&M.NS"],
        "Pharma": ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "APOLLOHOSP.NS"],
        "Metal": ["TATASTEEL.NS", "JSWSTEEL.NS", "HINDALCO.NS", "COALINDIA.NS", "VEDL.NS"],
    }

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=15.0,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ── Quote Data ───────────────────────────────
    async def get_quote(self, symbol: str) -> dict:
        """Get current quote for a symbol."""
        client = await self._get_client()
        try:
            resp = await client.get(
                f"{YF_QUOTE}/{symbol}",
                params={"interval": "1d", "range": "1d", "includePrePost": "false"},
            )
            data = resp.json()
            result = data.get("chart", {}).get("result", [])
            if not result:
                return {"error": f"No data for {symbol}"}

            meta = result[0].get("meta", {})
            indicators = result[0].get("indicators", {}).get("quote", [{}])[0]

            current_price = meta.get("regularMarketPrice", 0)
            prev_close = meta.get("chartPreviousClose", meta.get("previousClose", 0))
            change = current_price - prev_close if prev_close else 0
            change_pct = (change / prev_close * 100) if prev_close else 0

            return {
                "symbol": symbol.replace(".NS", "").replace(".BO", ""),
                "raw_symbol": symbol,
                "name": meta.get("longName", meta.get("shortName", symbol)),
                "exchange": meta.get("exchangeName", ""),
                "currency": meta.get("currency", "INR"),
                "current_price": round(current_price, 2),
                "previous_close": round(prev_close, 2),
                "change": round(change, 2),
                "change_percent": round(change_pct, 2),
                "day_high": meta.get("regularMarketDayHigh", 0),
                "day_low": meta.get("regularMarketDayLow", 0),
                "volume": indicators.get("volume", [0])[-1] if indicators.get("volume") else 0,
                "market_state": meta.get("marketState", "CLOSED"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        except Exception as e:
            return {"error": str(e), "symbol": symbol}

    async def get_multiple_quotes(self, symbols: list[str]) -> list[dict]:
        """Get quotes for multiple symbols concurrently."""
        tasks = [self.get_quote(s) for s in symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r if isinstance(r, dict) else {"error": str(r)} for r in results]

    # ── Chart Data ───────────────────────────────
    async def get_chart_data(
        self,
        symbol: str,
        interval: str = "1d",
        range_period: str = "6mo",
    ) -> dict:
        """Get OHLCV chart data for a symbol."""
        client = await self._get_client()
        try:
            resp = await client.get(
                f"{YF_QUOTE}/{symbol}",
                params={"interval": interval, "range": range_period, "includePrePost": "false"},
            )
            data = resp.json()
            result = data.get("chart", {}).get("result", [])
            if not result:
                return {"error": f"No chart data for {symbol}"}

            timestamps = result[0].get("timestamp", [])
            indicators = result[0].get("indicators", {})
            quotes = indicators.get("quote", [{}])[0]
            meta = result[0].get("meta", {})

            candles = []
            for i, ts in enumerate(timestamps):
                o = quotes.get("open", [None])[i]
                h = quotes.get("high", [None])[i]
                l = quotes.get("low", [None])[i]
                c = quotes.get("close", [None])[i]
                v = quotes.get("volume", [None])[i]

                if all(x is not None for x in [o, h, l, c]):
                    candles.append({
                        "time": ts,
                        "open": round(o, 2),
                        "high": round(h, 2),
                        "low": round(l, 2),
                        "close": round(c, 2),
                        "volume": v or 0,
                    })

            return {
                "symbol": symbol.replace(".NS", "").replace(".BO", ""),
                "interval": interval,
                "range": range_period,
                "currency": meta.get("currency", "INR"),
                "candles": candles,
                "total": len(candles),
            }
        except Exception as e:
            return {"error": str(e), "symbol": symbol}

    # ── Market Overview ──────────────────────────
    async def get_market_overview(self) -> dict:
        """Get indices + top movers."""
        # Fetch indices
        index_symbols = list(self.INDIAN_INDICES.keys())
        indices = await self.get_multiple_quotes(index_symbols)

        # Fetch top stocks
        top_stocks = await self.get_multiple_quotes(self.POPULAR_STOCKS_NSE[:15])

        # Sort by change %
        valid_stocks = [s for s in top_stocks if "error" not in s]
        gainers = sorted(valid_stocks, key=lambda x: x.get("change_percent", 0), reverse=True)[:5]
        losers = sorted(valid_stocks, key=lambda x: x.get("change_percent", 0))[:5]

        return {
            "indices": [i for i in indices if "error" not in i],
            "top_gainers": gainers,
            "top_losers": losers,
            "market_status": indices[0].get("market_state", "CLOSED") if indices else "UNKNOWN",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    # ── Sector Performance ───────────────────────
    async def get_sector_performance(self) -> list[dict]:
        """Get average performance by sector."""
        sectors = []
        for sector_name, symbols in self.SECTORS.items():
            quotes = await self.get_multiple_quotes(symbols[:3])  # Top 3 per sector for speed
            valid = [q for q in quotes if "error" not in q]
            if valid:
                avg_change = sum(q.get("change_percent", 0) for q in valid) / len(valid)
                sectors.append({
                    "name": sector_name,
                    "change_percent": round(avg_change, 2),
                    "stocks": len(valid),
                    "status": "bullish" if avg_change > 0 else "bearish" if avg_change < 0 else "neutral",
                })
        return sorted(sectors, key=lambda x: x["change_percent"], reverse=True)

    # ── Search ───────────────────────────────────
    async def search_assets(self, query: str, limit: int = 10) -> list[dict]:
        """Search for assets by name or symbol."""
        client = await self._get_client()
        try:
            resp = await client.get(
                YF_SEARCH,
                params={"q": query, "quotesCount": limit, "newsCount": 0},
            )
            data = resp.json()
            results = []
            for item in data.get("quotes", []):
                results.append({
                    "symbol": item.get("symbol", ""),
                    "name": item.get("longname", item.get("shortname", "")),
                    "exchange": item.get("exchange", ""),
                    "type": item.get("quoteType", ""),
                    "score": item.get("score", 0),
                })
            return results
        except Exception as e:
            return [{"error": str(e)}]


# Singleton
market_data = MarketDataService()
