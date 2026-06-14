"""
VedoraAI — Technical Scanner Engine
Scans NSE stocks for technical patterns and signals.
Detects: Golden Cross, Death Cross, RSI extremes,
MACD crossovers, Bollinger breakouts, and volume surges.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator, EMAIndicator
from ta.volatility import BollingerBands

logger = logging.getLogger(__name__)

YF_CHART = "https://query1.finance.yahoo.com/v8/finance/chart"

# ── Cache ──
_scan_cache: dict = {}
CACHE_TTL = 900  # 15 minutes

NSE_SCAN_STOCKS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "BAJFINANCE.NS",
    "WIPRO.NS", "HCLTECH.NS", "KOTAKBANK.NS", "LT.NS", "AXISBANK.NS",
    "ASIANPAINT.NS", "MARUTI.NS", "TITAN.NS", "SUNPHARMA.NS", "TATAMOTORS.NS",
]


class ScannerEngine:
    """Technical pattern scanner for NSE stocks."""

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

    async def _fetch_data(self, symbol: str) -> Optional[pd.DataFrame]:
        """Fetch 6-month daily data for scanning."""
        client = await self._get_client()
        try:
            resp = await client.get(
                f"{YF_CHART}/{symbol}",
                params={"interval": "1d", "range": "6mo", "includePrePost": "false"},
            )
            data = resp.json()
            result = data.get("chart", {}).get("result", [])
            if not result:
                return None

            timestamps = result[0].get("timestamp", [])
            quotes = result[0].get("indicators", {}).get("quote", [{}])[0]

            df = pd.DataFrame({
                "time": pd.to_datetime(timestamps, unit="s"),
                "open": quotes.get("open", []),
                "high": quotes.get("high", []),
                "low": quotes.get("low", []),
                "close": quotes.get("close", []),
                "volume": quotes.get("volume", []),
            })
            df = df.dropna(subset=["close"])
            return df if len(df) >= 50 else None
        except Exception as e:
            logger.error(f"Scanner fetch error for {symbol}: {e}")
            return None

    def _scan_stock(self, symbol: str, df: pd.DataFrame) -> list[dict]:
        """Scan a single stock for all patterns."""
        signals = []
        close = df["close"]
        volume = df["volume"].astype(float)

        # Compute indicators
        sma_20 = SMAIndicator(close, window=20).sma_indicator()
        sma_50 = SMAIndicator(close, window=50).sma_indicator()
        ema_12 = EMAIndicator(close, window=12).ema_indicator()
        rsi = RSIIndicator(close, window=14).rsi()
        macd_ind = MACD(close)
        macd_line = macd_ind.macd()
        macd_signal = macd_ind.macd_signal()
        bb = BollingerBands(close, window=20, window_dev=2)

        clean = symbol.replace(".NS", "").replace(".BO", "")
        current_price = float(close.iloc[-1])

        # ── 1. Golden Cross (SMA20 crosses above SMA50) ──
        if len(sma_20) >= 2 and len(sma_50) >= 2:
            if pd.notna(sma_20.iloc[-1]) and pd.notna(sma_50.iloc[-1]):
                if pd.notna(sma_20.iloc[-2]) and pd.notna(sma_50.iloc[-2]):
                    if sma_20.iloc[-1] > sma_50.iloc[-1] and sma_20.iloc[-2] <= sma_50.iloc[-2]:
                        signals.append({
                            "pattern": "Golden Cross",
                            "type": "bullish",
                            "strength": "strong",
                            "description": f"20-day SMA crossed above 50-day SMA",
                        })

        # ── 2. Death Cross (SMA20 crosses below SMA50) ──
                    if sma_20.iloc[-1] < sma_50.iloc[-1] and sma_20.iloc[-2] >= sma_50.iloc[-2]:
                        signals.append({
                            "pattern": "Death Cross",
                            "type": "bearish",
                            "strength": "strong",
                            "description": f"20-day SMA crossed below 50-day SMA",
                        })

        # ── 3. RSI Oversold ──
        if pd.notna(rsi.iloc[-1]):
            rsi_val = float(rsi.iloc[-1])
            if rsi_val < 30:
                signals.append({
                    "pattern": "RSI Oversold",
                    "type": "bullish",
                    "strength": "moderate",
                    "description": f"RSI at {rsi_val:.1f} (below 30 threshold)",
                })
            elif rsi_val > 70:
                signals.append({
                    "pattern": "RSI Overbought",
                    "type": "bearish",
                    "strength": "moderate",
                    "description": f"RSI at {rsi_val:.1f} (above 70 threshold)",
                })

        # ── 4. MACD Crossover ──
        if len(macd_line) >= 2 and len(macd_signal) >= 2:
            if pd.notna(macd_line.iloc[-1]) and pd.notna(macd_signal.iloc[-1]):
                if pd.notna(macd_line.iloc[-2]) and pd.notna(macd_signal.iloc[-2]):
                    if macd_line.iloc[-1] > macd_signal.iloc[-1] and macd_line.iloc[-2] <= macd_signal.iloc[-2]:
                        signals.append({
                            "pattern": "MACD Bullish Crossover",
                            "type": "bullish",
                            "strength": "moderate",
                            "description": "MACD line crossed above signal line",
                        })
                    elif macd_line.iloc[-1] < macd_signal.iloc[-1] and macd_line.iloc[-2] >= macd_signal.iloc[-2]:
                        signals.append({
                            "pattern": "MACD Bearish Crossover",
                            "type": "bearish",
                            "strength": "moderate",
                            "description": "MACD line crossed below signal line",
                        })

        # ── 5. Bollinger Band Breakout ──
        bb_upper = bb.bollinger_hband()
        bb_lower = bb.bollinger_lband()
        if pd.notna(bb_upper.iloc[-1]) and pd.notna(bb_lower.iloc[-1]):
            if close.iloc[-1] > bb_upper.iloc[-1]:
                signals.append({
                    "pattern": "Bollinger Breakout (Upper)",
                    "type": "bullish",
                    "strength": "moderate",
                    "description": "Price broke above upper Bollinger Band",
                })
            elif close.iloc[-1] < bb_lower.iloc[-1]:
                signals.append({
                    "pattern": "Bollinger Breakdown (Lower)",
                    "type": "bearish",
                    "strength": "moderate",
                    "description": "Price fell below lower Bollinger Band",
                })

        # ── 6. Volume Surge ──
        avg_vol = volume.rolling(20).mean().iloc[-1]
        if pd.notna(avg_vol) and avg_vol > 0:
            vol_ratio = float(volume.iloc[-1]) / float(avg_vol)
            if vol_ratio > 2.0:
                signals.append({
                    "pattern": "Volume Surge",
                    "type": "neutral",
                    "strength": "strong",
                    "description": f"Volume {vol_ratio:.1f}x above 20-day average",
                })

        return signals

    async def scan_all(self, force: bool = False) -> dict:
        """Scan all stocks and return detected signals."""
        cache_key = "scan_all"
        if not force and cache_key in _scan_cache:
            cached_time, cached_data = _scan_cache[cache_key]
            if (datetime.now(timezone.utc) - cached_time).total_seconds() < CACHE_TTL:
                return cached_data

        results = []

        # Fetch in batches of 5
        for i in range(0, len(NSE_SCAN_STOCKS), 5):
            batch = NSE_SCAN_STOCKS[i:i+5]
            tasks = [self._fetch_data(s) for s in batch]
            dfs = await asyncio.gather(*tasks, return_exceptions=True)

            for symbol, df in zip(batch, dfs):
                if isinstance(df, pd.DataFrame) and len(df) >= 50:
                    signals = self._scan_stock(symbol, df)
                    if signals:
                        clean = symbol.replace(".NS", "").replace(".BO", "")
                        current_price = float(df["close"].iloc[-1])
                        results.append({
                            "symbol": clean,
                            "raw_symbol": symbol,
                            "price": round(current_price, 2),
                            "signals": signals,
                            "signal_count": len(signals),
                        })

            if i + 5 < len(NSE_SCAN_STOCKS):
                await asyncio.sleep(0.3)

        # Sort by signal count
        results.sort(key=lambda x: x["signal_count"], reverse=True)

        data = {
            "results": results,
            "total_scanned": len(NSE_SCAN_STOCKS),
            "stocks_with_signals": len(results),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        _scan_cache[cache_key] = (datetime.now(timezone.utc), data)
        return data


# Singleton
scanner_engine = ScannerEngine()
