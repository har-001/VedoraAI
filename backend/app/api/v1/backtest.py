"""
VedoraAI — Backtest API Router
Exposes endpoints for running historical strategy backtests.
"""

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.backtester.engine import backtester_engine

router = APIRouter(prefix="/backtest", tags=["Strategy Backtester"])


class BacktestRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol, e.g. RELIANCE, TCS")
    strategy: str = Field(..., description="Strategy code, e.g. sma_crossover, rsi_mean_reversion, macd_momentum")
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Key-value parameters for the selected strategy, e.g. fast_period, slow_period",
    )
    initial_capital: float = Field(
        default=100000.0,
        ge=1000.0,
        description="Starting balance for simulation",
    )
    range_period: str = Field(
        default="1y",
        description="Historical period: 3mo, 6mo, 1y, 2y",
    )


@router.post("/run")
async def run_backtest(payload: BacktestRequest):
    """
    Run backtesting simulation for a given symbol and strategy parameters.
    """
    try:
        results = await backtester_engine.run(
            symbol=payload.symbol,
            strategy=payload.strategy,
            parameters=payload.parameters,
            initial_capital=payload.initial_capital,
            range_period=payload.range_period,
        )

        if "error" in results:
            raise HTTPException(status_code=400, detail=results["error"])

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtester runtime error: {str(e)}")
