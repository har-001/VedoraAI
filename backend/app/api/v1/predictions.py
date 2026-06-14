"""
VedoraAI — Predictions API
Endpoints for AI-powered market predictions.
"""

from fastapi import APIRouter, Query

from app.ai.prediction.engine import prediction_engine
from app.services.market_data import MarketDataService

router = APIRouter(prefix="/predictions", tags=["Predictions"])

# Default stocks to predict
DEFAULT_SYMBOLS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "BHARTIARTL.NS", "WIPRO.NS", "SBIN.NS", "ITC.NS", "BAJFINANCE.NS",
    "HCLTECH.NS", "TATAMOTORS.NS", "MARUTI.NS", "SUNPHARMA.NS", "TITAN.NS",
]


@router.get("")
async def get_predictions(
    limit: int = Query(default=10, le=20, ge=1),
):
    """
    Get AI predictions for top NSE stocks.
    Returns confidence scores, outlook, risk level, and key reasons.
    """
    symbols = DEFAULT_SYMBOLS[:limit]
    predictions = await prediction_engine.get_batch_predictions(symbols)

    return {
        "predictions": predictions,
        "total": len([p for p in predictions if "error" not in p]),
        "disclaimer": "AI-generated probabilistic estimates for research purposes only. Not financial advice.",
    }


@router.get("/{symbol}")
async def get_prediction(symbol: str):
    """Get detailed AI prediction for a specific stock."""
    # Add .NS suffix if not present
    raw_symbol = symbol if "." in symbol else f"{symbol}.NS"
    prediction = await prediction_engine.get_prediction(raw_symbol)

    return {
        "prediction": prediction,
        "disclaimer": "AI-generated probabilistic estimates for research purposes only. Not financial advice.",
    }
