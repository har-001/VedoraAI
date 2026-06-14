"""
VedoraAI — Strategy Backtester Engine
Runs historical simulations of trading strategies on stock market data.
"""

import asyncio
import logging
import math
from datetime import datetime, timezone
from typing import Optional

import httpx
import numpy as np
import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator

logger = logging.getLogger(__name__)

YF_CHART = "https://query1.finance.yahoo.com/v8/finance/chart"


class BacktesterEngine:
    """Simulates trading strategies on historical Yahoo Finance data."""

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

    async def _fetch_data(self, symbol: str, range_period: str) -> Optional[pd.DataFrame]:
        """Fetch historical daily candles from Yahoo Finance."""
        client = await self._get_client()
        try:
            resp = await client.get(
                f"{YF_CHART}/{symbol}",
                params={"interval": "1d", "range": range_period, "includePrePost": "false"},
            )
            data = resp.json()
            result = data.get("chart", {}).get("result", [])
            if not result:
                return None

            timestamps = result[0].get("timestamp", [])
            quotes = result[0].get("indicators", {}).get("quote", [{}])[0]

            df = pd.DataFrame({
                "date": pd.to_datetime(timestamps, unit="s"),
                "open": quotes.get("open", []),
                "high": quotes.get("high", []),
                "low": quotes.get("low", []),
                "close": quotes.get("close", []),
                "volume": quotes.get("volume", []),
            })
            df = df.dropna(subset=["close"])
            df = df.reset_index(drop=True)
            return df if len(df) >= 30 else None
        except Exception as e:
            logger.error(f"Backtester fetch failed for {symbol}: {e}")
            return None

    def run_backtest(
        self,
        df: pd.DataFrame,
        strategy: str,
        parameters: dict,
        initial_capital: float = 100000.0,
    ) -> dict:
        """
        Executes strategy logic on historical dataframe.
        Returns metrics, equity curve, and trade log.
        """
        close = df["close"]
        n = len(df)

        # ── Compute Technical Indicators ──
        if strategy == "sma_crossover":
            fast_period = int(parameters.get("fast_period", 10))
            slow_period = int(parameters.get("slow_period", 20))
            df["fast_sma"] = SMAIndicator(close, window=fast_period).sma_indicator()
            df["slow_sma"] = SMAIndicator(close, window=slow_period).sma_indicator()
            warmup = max(fast_period, slow_period)
        elif strategy == "rsi_mean_reversion":
            rsi_period = int(parameters.get("rsi_period", 14))
            oversold = float(parameters.get("oversold_threshold", 30))
            overbought = float(parameters.get("overbought_threshold", 70))
            df["rsi"] = RSIIndicator(close, window=rsi_period).rsi()
            warmup = rsi_period
        elif strategy == "macd_momentum":
            fast = int(parameters.get("macd_fast", 12))
            slow = int(parameters.get("macd_slow", 26))
            signal = int(parameters.get("macd_signal", 9))
            macd_ind = MACD(close, window_fast=fast, window_slow=slow, window_sign=signal)
            df["macd"] = macd_ind.macd()
            df["macd_signal"] = macd_ind.macd_signal()
            warmup = max(fast, slow) + signal
        else:
            return {"error": f"Unknown strategy type: {strategy}"}

        df = df.dropna().reset_index(drop=True)
        if len(df) < 10:
            return {"error": "Insufficient data after indicators warmup"}

        # ── Simulation Variables ──
        cash = initial_capital
        holdings = 0
        portfolio_value = initial_capital
        transactions = []
        equity_curve = []

        buy_price = 0.0
        buy_date = None

        # Add initial equity curve point
        equity_curve.append({
            "date": df.iloc[0]["date"].strftime("%Y-%m-%d"),
            "equity": initial_capital,
            "price": float(df.iloc[0]["close"]),
            "cash": initial_capital,
            "holdings": 0,
        })

        for i in range(1, len(df)):
            row = df.iloc[i]
            prev_row = df.iloc[i - 1]
            price = float(row["close"])
            date_str = row["date"].strftime("%Y-%m-%d")

            # Determine Signals
            buy_sig = False
            sell_sig = False

            if strategy == "sma_crossover":
                if prev_row["fast_sma"] <= prev_row["slow_sma"] and row["fast_sma"] > row["slow_sma"]:
                    buy_sig = True
                elif prev_row["fast_sma"] >= prev_row["slow_sma"] and row["fast_sma"] < row["slow_sma"]:
                    sell_sig = True

            elif strategy == "rsi_mean_reversion":
                if prev_row["rsi"] >= oversold and row["rsi"] < oversold:
                    buy_sig = True
                elif prev_row["rsi"] <= overbought and row["rsi"] > overbought:
                    sell_sig = True

            elif strategy == "macd_momentum":
                if prev_row["macd"] <= prev_row["macd_signal"] and row["macd"] > row["macd_signal"]:
                    buy_sig = True
                elif prev_row["macd"] >= prev_row["macd_signal"] and row["macd"] < row["macd_signal"]:
                    sell_sig = True

            # Execute Signals
            if buy_sig and holdings == 0 and cash > price:
                # Buy maximum possible shares
                qty = math.floor(cash / price)
                if qty > 0:
                    holdings = qty
                    buy_price = price
                    buy_date = row["date"]
                    cash -= qty * price
                    transactions.append({
                        "date": date_str,
                        "action": "BUY",
                        "price": round(price, 2),
                        "quantity": qty,
                        "value": round(qty * price, 2),
                        "pnl": 0.0,
                        "pnl_percent": 0.0,
                        "balance": round(cash, 2),
                    })

            elif sell_sig and holdings > 0:
                # Sell all holdings
                qty = holdings
                pnl = qty * (price - buy_price)
                pnl_percent = (price - buy_price) / buy_price * 100
                cash += qty * price
                holdings = 0
                transactions.append({
                    "date": date_str,
                    "action": "SELL",
                    "price": round(price, 2),
                    "quantity": qty,
                    "value": round(qty * price, 2),
                    "pnl": round(pnl, 2),
                    "pnl_percent": round(pnl_percent, 2),
                    "balance": round(cash, 2),
                })

            portfolio_value = cash + (holdings * price)
            equity_curve.append({
                "date": date_str,
                "equity": round(portfolio_value, 2),
                "price": round(price, 2),
                "cash": round(cash, 2),
                "holdings": holdings,
            })

        # Close open trade at the end to get clean final balance
        if holdings > 0:
            row = df.iloc[-1]
            price = float(row["close"])
            date_str = row["date"].strftime("%Y-%m-%d")
            qty = holdings
            pnl = qty * (price - buy_price)
            pnl_percent = (price - buy_price) / buy_price * 100
            cash += qty * price
            holdings = 0
            transactions.append({
                "date": date_str,
                "action": "SELL_CLOSE",
                "price": round(price, 2),
                "quantity": qty,
                "value": round(qty * price, 2),
                "pnl": round(pnl, 2),
                "pnl_percent": round(pnl_percent, 2),
                "balance": round(cash, 2),
            })
            portfolio_value = cash
            # Update last curve point
            equity_curve[-1]["equity"] = round(portfolio_value, 2)
            equity_curve[-1]["cash"] = round(cash, 2)
            equity_curve[-1]["holdings"] = 0

        # ── Calculate Metrics ──
        total_return = (portfolio_value - initial_capital) / initial_capital * 100

        initial_price = float(df.iloc[0]["close"])
        final_price = float(df.iloc[-1]["close"])
        benchmark_return = (final_price - initial_price) / initial_price * 100

        # Trades metrics
        trades_pnl = [t["pnl"] for t in transactions if t["action"] in ("SELL", "SELL_CLOSE")]
        total_trades = len(trades_pnl)
        winning_trades = len([p for p in trades_pnl if p > 0])
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0.0

        gross_profit = sum([p for p in trades_pnl if p > 0])
        gross_loss = abs(sum([p for p in trades_pnl if p < 0]))
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 1.0)

        # Sharpe Ratio
        equity_series = pd.Series([e["equity"] for e in equity_curve])
        daily_returns = equity_series.pct_change().dropna()
        if len(daily_returns) > 1 and daily_returns.std() > 0:
            # Annualized Sharpe (assuming 252 trading days)
            mean_ret = daily_returns.mean()
            std_ret = daily_returns.std()
            sharpe_ratio = (mean_ret / std_ret) * math.sqrt(252)
        else:
            sharpe_ratio = 0.0

        # Max Drawdown
        peaks = equity_series.cummax()
        drawdowns = (equity_series - peaks) / peaks * 100
        max_drawdown = drawdowns.min()

        return {
            "metrics": {
                "initial_capital": round(initial_capital, 2),
                "final_value": round(portfolio_value, 2),
                "total_return": round(total_return, 2),
                "benchmark_return": round(benchmark_return, 2),
                "sharpe_ratio": round(sharpe_ratio, 2),
                "max_drawdown": round(max_drawdown, 2),
                "win_rate": round(win_rate, 2),
                "total_trades": total_trades,
                "profit_factor": round(profit_factor, 2),
            },
            "equity_curve": equity_curve,
            "trade_log": transactions,
        }

    async def run(
        self,
        symbol: str,
        strategy: str,
        parameters: dict,
        initial_capital: float = 100000.0,
        range_period: str = "1y",
    ) -> dict:
        """Fetch stock history and run strategy backtest."""
        # Normalize symbol
        raw_symbol = symbol if "." in symbol or "^" in symbol else f"{symbol}.NS"
        df = await self._fetch_data(raw_symbol, range_period)
        if df is None:
            return {"error": f"Failed to download historical prices for {symbol}"}

        # Run CPU-bound backtesting logic in thread pool
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            self.run_backtest,
            df,
            strategy,
            parameters,
            initial_capital,
        )
        return results


# Singleton
backtester_engine = BacktesterEngine()
