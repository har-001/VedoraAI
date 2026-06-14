"""
VedoraAI — AI Prediction Engine
Real-time stock predictions using XGBoost + Technical Indicators.
Fetches historical data from Yahoo Finance, computes 30+ indicators,
trains a lightweight model, and outputs confidence scores.
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
import numpy as np
import pandas as pd
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.trend import MACD, EMAIndicator, SMAIndicator, ADXIndicator
from ta.volatility import BollingerBands, AverageTrueRange
from ta.volume import OnBalanceVolumeIndicator, VolumeWeightedAveragePrice

logger = logging.getLogger(__name__)

YF_CHART = "https://query1.finance.yahoo.com/v8/finance/chart"

# ── Simple in-memory cache ──────────────────────────
_prediction_cache: dict = {}
CACHE_TTL_SECONDS = 1800  # 30 minutes


class PredictionEngine:
    """
    Lightweight AI prediction engine.
    Uses XGBoost with engineered technical features.
    """

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=20.0,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ── Fetch Historical Data ───────────────────────
    async def _fetch_history(self, symbol: str, period: str = "1y") -> Optional[pd.DataFrame]:
        """Fetch OHLCV history from Yahoo Finance."""
        client = await self._get_client()
        try:
            resp = await client.get(
                f"{YF_CHART}/{symbol}",
                params={"interval": "1d", "range": period, "includePrePost": "false"},
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
            df = df.dropna(subset=["open", "high", "low", "close"])
            df = df.reset_index(drop=True)
            return df if len(df) >= 50 else None
        except Exception as e:
            logger.error(f"Failed to fetch history for {symbol}: {e}")
            return None

    # ── Compute Technical Indicators ────────────────
    def _compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute 30+ technical indicators as features."""
        close = df["close"]
        high = df["high"]
        low = df["low"]
        volume = df["volume"].astype(float)

        # ── Trend Indicators ──
        df["sma_10"] = SMAIndicator(close, window=10).sma_indicator()
        df["sma_20"] = SMAIndicator(close, window=20).sma_indicator()
        df["sma_50"] = SMAIndicator(close, window=50).sma_indicator()
        df["ema_10"] = EMAIndicator(close, window=10).ema_indicator()
        df["ema_20"] = EMAIndicator(close, window=20).ema_indicator()

        macd = MACD(close)
        df["macd"] = macd.macd()
        df["macd_signal"] = macd.macd_signal()
        df["macd_hist"] = macd.macd_diff()

        adx = ADXIndicator(high, low, close, window=14)
        df["adx"] = adx.adx()
        df["adx_pos"] = adx.adx_pos()
        df["adx_neg"] = adx.adx_neg()

        # ── Momentum Indicators ──
        df["rsi"] = RSIIndicator(close, window=14).rsi()

        stoch = StochasticOscillator(high, low, close, window=14)
        df["stoch_k"] = stoch.stoch()
        df["stoch_d"] = stoch.stoch_signal()

        # ── Volatility Indicators ──
        bb = BollingerBands(close, window=20, window_dev=2)
        df["bb_upper"] = bb.bollinger_hband()
        df["bb_lower"] = bb.bollinger_lband()
        df["bb_width"] = bb.bollinger_wband()
        df["bb_pct"] = bb.bollinger_pband()

        atr = AverageTrueRange(high, low, close, window=14)
        df["atr"] = atr.average_true_range()

        # ── Volume Indicators ──
        df["obv"] = OnBalanceVolumeIndicator(close, volume).on_balance_volume()

        # ── Price-derived Features ──
        df["price_change_1d"] = close.pct_change(1) * 100
        df["price_change_5d"] = close.pct_change(5) * 100
        df["price_change_10d"] = close.pct_change(10) * 100
        df["price_change_20d"] = close.pct_change(20) * 100

        df["vol_ratio_5d"] = volume / volume.rolling(5).mean()
        df["vol_ratio_20d"] = volume / volume.rolling(20).mean()

        df["high_low_range"] = (high - low) / close * 100
        df["close_vs_sma20"] = (close - df["sma_20"]) / df["sma_20"] * 100
        df["close_vs_sma50"] = (close - df["sma_50"]) / df["sma_50"] * 100

        # ── Trend Strength ──
        df["ema_cross"] = (df["ema_10"] - df["ema_20"]) / close * 100
        df["sma_cross"] = (df["sma_10"] - df["sma_20"]) / close * 100

        return df

    # ── Build Training Labels ──────────────────────
    def _build_labels(self, df: pd.DataFrame, horizon: int = 5) -> pd.Series:
        """
        Label: 1 if price goes UP by > 1% in `horizon` days, 0 otherwise.
        This creates a forward-looking target for the classifier.
        """
        future_return = df["close"].shift(-horizon) / df["close"] - 1
        labels = (future_return > 0.01).astype(int)
        return labels

    # ── Train & Predict ────────────────────────────
    def _run_prediction(self, df: pd.DataFrame) -> dict:
        """Train XGBoost on historical indicators and predict next period."""
        try:
            from xgboost import XGBClassifier
        except ImportError:
            logger.warning("XGBoost not installed, falling back to sklearn")
            from sklearn.ensemble import GradientBoostingClassifier as XGBClassifier

        feature_cols = [
            "sma_10", "sma_20", "sma_50", "ema_10", "ema_20",
            "macd", "macd_signal", "macd_hist",
            "adx", "adx_pos", "adx_neg",
            "rsi", "stoch_k", "stoch_d",
            "bb_upper", "bb_lower", "bb_width", "bb_pct",
            "atr", "obv",
            "price_change_1d", "price_change_5d", "price_change_10d", "price_change_20d",
            "vol_ratio_5d", "vol_ratio_20d",
            "high_low_range", "close_vs_sma20", "close_vs_sma50",
            "ema_cross", "sma_cross",
        ]

        df_model = df.copy()
        df_model["target"] = self._build_labels(df_model, horizon=5)
        df_model = df_model.dropna(subset=feature_cols + ["target"])

        if len(df_model) < 30:
            return {"error": "Insufficient data for prediction"}

        # Split: last 20% for validation
        split_idx = int(len(df_model) * 0.8)
        train = df_model.iloc[:split_idx]
        test = df_model.iloc[split_idx:]

        X_train = train[feature_cols].values
        y_train = train["target"].values
        X_test = test[feature_cols].values
        y_test = test["target"].values

        # Train model
        try:
            model = XGBClassifier(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.1,
                use_label_encoder=False,
                eval_metric="logloss",
                verbosity=0,
                random_state=42,
            )
        except TypeError:
            # Fallback for sklearn GradientBoosting
            model = XGBClassifier(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.1,
                random_state=42,
            )

        model.fit(X_train, y_train)

        # Predict on latest data point
        latest = df_model.iloc[-1:][feature_cols].values
        prob = model.predict_proba(latest)[0]
        bullish_prob = float(prob[1]) if len(prob) > 1 else 0.5

        # Validation accuracy
        from sklearn.metrics import accuracy_score
        val_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, val_pred) if len(y_test) > 0 else 0.5

        # Feature importance for "reasons"
        importances = model.feature_importances_
        top_features_idx = np.argsort(importances)[-5:][::-1]
        top_features = [(feature_cols[i], float(importances[i])) for i in top_features_idx]

        return {
            "bullish_probability": bullish_prob,
            "accuracy": float(accuracy),
            "top_features": top_features,
        }

    # ── Generate Reasons ────────────────────────────
    def _generate_reasons(self, df: pd.DataFrame, top_features: list) -> list[str]:
        """Convert technical signals into human-readable reasons."""
        latest = df.iloc[-1]
        reasons = []

        rsi = latest.get("rsi", 50)
        if rsi < 30:
            reasons.append("RSI in oversold territory (%.1f) — potential bounce" % rsi)
        elif rsi > 70:
            reasons.append("RSI in overbought zone (%.1f) — potential pullback" % rsi)
        else:
            reasons.append("RSI at neutral level (%.1f)" % rsi)

        macd_hist = latest.get("macd_hist", 0)
        if macd_hist > 0:
            reasons.append("MACD histogram positive — bullish momentum")
        else:
            reasons.append("MACD histogram negative — bearish pressure")

        adx = latest.get("adx", 0)
        if adx > 25:
            reasons.append("Strong trend detected (ADX: %.1f)" % adx)
        else:
            reasons.append("Weak trend / consolidation (ADX: %.1f)" % adx)

        close_vs_sma = latest.get("close_vs_sma20", 0)
        if close_vs_sma > 2:
            reasons.append("Trading above 20-day SMA (+%.1f%%)" % close_vs_sma)
        elif close_vs_sma < -2:
            reasons.append("Trading below 20-day SMA (%.1f%%)" % close_vs_sma)

        vol_ratio = latest.get("vol_ratio_5d", 1)
        if vol_ratio > 1.5:
            reasons.append("Volume surge (%.1fx above 5-day avg)" % vol_ratio)
        elif vol_ratio < 0.5:
            reasons.append("Low volume (%.1fx of 5-day avg)" % vol_ratio)

        return reasons[:4] if reasons else ["Moderate technical signals"]

    # ── Public API ─────────────────────────────────
    async def get_prediction(self, symbol: str) -> dict:
        """Get AI prediction for a single stock."""
        # Check cache
        cache_key = symbol
        if cache_key in _prediction_cache:
            cached_time, cached_data = _prediction_cache[cache_key]
            if (datetime.now(timezone.utc) - cached_time).total_seconds() < CACHE_TTL_SECONDS:
                return cached_data

        df = await self._fetch_history(symbol)
        if df is None:
            return {"error": f"Could not fetch data for {symbol}", "symbol": symbol}

        df = self._compute_indicators(df)

        # Run prediction in thread pool (CPU-bound)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self._run_prediction, df)

        if "error" in result:
            return {"error": result["error"], "symbol": symbol}

        bullish_prob = result["bullish_probability"]
        accuracy = result["accuracy"]

        # Determine outlook
        if bullish_prob > 0.6:
            outlook = "Bullish"
        elif bullish_prob < 0.4:
            outlook = "Bearish"
        else:
            outlook = "Neutral"

        # Confidence: blend of model probability and validation accuracy
        raw_confidence = (bullish_prob if outlook == "Bullish" else (1 - bullish_prob)) * 0.6 + accuracy * 0.4
        confidence = min(95, max(30, int(raw_confidence * 100)))

        # Risk level
        atr_pct = float(df["atr"].iloc[-1] / df["close"].iloc[-1] * 100) if df["atr"].iloc[-1] else 2
        if atr_pct < 1.5:
            risk = "Low"
        elif atr_pct < 3.0:
            risk = "Moderate"
        else:
            risk = "High"

        # Target price range
        current = float(df["close"].iloc[-1])
        atr_val = float(df["atr"].iloc[-1]) if df["atr"].iloc[-1] else current * 0.02
        if outlook == "Bullish":
            target_low = current + atr_val * 0.5
            target_high = current + atr_val * 2.0
        elif outlook == "Bearish":
            target_low = current - atr_val * 2.0
            target_high = current - atr_val * 0.5
        else:
            target_low = current - atr_val * 0.5
            target_high = current + atr_val * 0.5

        reasons = self._generate_reasons(df, result["top_features"])

        clean_symbol = symbol.replace(".NS", "").replace(".BO", "")

        prediction = {
            "symbol": clean_symbol,
            "raw_symbol": symbol,
            "name": clean_symbol,
            "confidence": confidence,
            "outlook": outlook,
            "risk": risk,
            "current_price": round(current, 2),
            "target_low": round(target_low, 2),
            "target_high": round(target_high, 2),
            "target": "Rs.{:,.0f} - Rs.{:,.0f}".format(target_low, target_high),
            "horizon": "5 Days",
            "reasons": reasons,
            "model_accuracy": round(accuracy * 100, 1),
            "bullish_probability": round(bullish_prob * 100, 1),
            "indicators": {
                "rsi": round(float(df["rsi"].iloc[-1]), 1) if pd.notna(df["rsi"].iloc[-1]) else None,
                "macd": round(float(df["macd"].iloc[-1]), 2) if pd.notna(df["macd"].iloc[-1]) else None,
                "adx": round(float(df["adx"].iloc[-1]), 1) if pd.notna(df["adx"].iloc[-1]) else None,
                "atr": round(atr_val, 2),
                "bb_width": round(float(df["bb_width"].iloc[-1]) * 100, 2) if pd.notna(df["bb_width"].iloc[-1]) else None,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Cache it
        _prediction_cache[cache_key] = (datetime.now(timezone.utc), prediction)
        return prediction

    async def get_batch_predictions(self, symbols: list[str]) -> list[dict]:
        """Get predictions for multiple stocks concurrently."""
        # Run in batches of 5 to avoid hammering Yahoo
        results = []
        for i in range(0, len(symbols), 5):
            batch = symbols[i:i+5]
            tasks = [self.get_prediction(s) for s in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in batch_results:
                if isinstance(r, Exception):
                    results.append({"error": str(r)})
                else:
                    results.append(r)
            if i + 5 < len(symbols):
                await asyncio.sleep(0.5)  # Rate limit

        # Sort by confidence descending
        valid = [r for r in results if "error" not in r]
        errors = [r for r in results if "error" in r]
        valid.sort(key=lambda x: x.get("confidence", 0), reverse=True)
        return valid + errors


# Singleton
prediction_engine = PredictionEngine()
