"""
VedoraAI — Portfolio Analytics API
Advanced analytics: allocation breakdown, risk metrics, performance history.
"""

import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.market import Portfolio
from app.models.user import User
from app.services.market_data import market_data

router = APIRouter(prefix="/portfolios", tags=["Portfolio Analytics"])


# ── Sector Mapping ──────────────────────────────────
STOCK_SECTORS = {
    "RELIANCE": "Energy", "ONGC": "Energy", "NTPC": "Energy", "POWERGRID": "Energy", "ADANIENT": "Energy",
    "TCS": "IT", "INFY": "IT", "WIPRO": "IT", "HCLTECH": "IT", "TECHM": "IT",
    "HDFCBANK": "Banking", "ICICIBANK": "Banking", "SBIN": "Banking", "KOTAKBANK": "Banking", "AXISBANK": "Banking",
    "HINDUNILVR": "FMCG", "ITC": "FMCG", "NESTLEIND": "FMCG", "BRITANNIA": "FMCG", "DABUR": "FMCG",
    "MARUTI": "Auto", "TATAMOTORS": "Auto", "BAJAJ-AUTO": "Auto", "EICHERMOT": "Auto",
    "SUNPHARMA": "Pharma", "DRREDDY": "Pharma", "CIPLA": "Pharma", "DIVISLAB": "Pharma",
    "TATASTEEL": "Metal", "JSWSTEEL": "Metal", "HINDALCO": "Metal", "COALINDIA": "Metal",
    "TITAN": "Consumer", "ASIANPAINT": "Consumer", "BAJFINANCE": "Finance", "LT": "Infrastructure",
    "BHARTIARTL": "Telecom",
}


@router.get("/{portfolio_id}/analytics")
async def get_portfolio_analytics(
    portfolio_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Advanced portfolio analytics: allocation, risk metrics, performance.
    """
    # Fetch portfolio
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.id == portfolio_id, Portfolio.user_id == user.id)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Load holdings
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.id == portfolio_id)
        .options(selectinload(Portfolio.holdings))
    )
    portfolio = result.scalar_one()
    holdings = portfolio.holdings

    if not holdings:
        return {
            "portfolio_id": str(portfolio_id),
            "portfolio_name": portfolio.name,
            "total_value": 0,
            "total_invested": 0,
            "total_pnl": 0,
            "total_pnl_percent": 0,
            "allocation": [],
            "sector_allocation": [],
            "risk_metrics": {},
            "top_performers": [],
            "bottom_performers": [],
        }

    # Fetch live prices for all holdings
    symbols = [h.symbol for h in holdings]
    yf_symbols = [f"{s}.NS" if "." not in s and "^" not in s else s for s in symbols]
    quotes = await market_data.get_multiple_quotes(yf_symbols)

    # Build price map
    prices = {}
    for q in quotes:
        if "error" not in q:
            clean = q.get("raw_symbol", "").replace(".NS", "").replace(".BO", "")
            if not clean:
                clean = q.get("symbol", "")
            prices[clean] = {
                "price": q["current_price"],
                "change_pct": q.get("change_percent", 0),
                "name": q.get("name", clean),
            }

    # Calculate analytics
    allocation = []
    total_value = 0
    total_invested = 0

    for h in holdings:
        sym = h.symbol.upper()
        p_data = prices.get(sym, {"price": h.avg_buy_price, "change_pct": 0, "name": sym})
        current_val = h.quantity * p_data["price"]
        invested_val = h.quantity * h.avg_buy_price
        pnl = current_val - invested_val
        pnl_pct = (pnl / invested_val * 100) if invested_val > 0 else 0

        allocation.append({
            "symbol": sym,
            "name": p_data["name"],
            "quantity": h.quantity,
            "avg_buy_price": round(h.avg_buy_price, 2),
            "current_price": round(p_data["price"], 2),
            "current_value": round(current_val, 2),
            "invested_value": round(invested_val, 2),
            "pnl": round(pnl, 2),
            "pnl_percent": round(pnl_pct, 2),
            "day_change": round(p_data["change_pct"], 2),
            "sector": STOCK_SECTORS.get(sym, "Other"),
        })

        total_value += current_val
        total_invested += invested_val

    # Weights
    for item in allocation:
        item["weight"] = round((item["current_value"] / total_value * 100) if total_value > 0 else 0, 2)

    # Sector allocation
    sector_map = {}
    for item in allocation:
        sec = item["sector"]
        if sec not in sector_map:
            sector_map[sec] = {"sector": sec, "value": 0, "weight": 0, "count": 0}
        sector_map[sec]["value"] += item["current_value"]
        sector_map[sec]["count"] += 1

    for sec in sector_map.values():
        sec["weight"] = round((sec["value"] / total_value * 100) if total_value > 0 else 0, 2)
        sec["value"] = round(sec["value"], 2)

    sector_allocation = sorted(sector_map.values(), key=lambda x: x["weight"], reverse=True)

    # Risk metrics
    total_pnl = total_value - total_invested
    total_pnl_pct = (total_pnl / total_invested * 100) if total_invested > 0 else 0

    # Concentration risk: weight of top holding
    sorted_by_weight = sorted(allocation, key=lambda x: x["weight"], reverse=True)
    top_weight = sorted_by_weight[0]["weight"] if sorted_by_weight else 0
    
    # Diversification score (1 - HHI normalized)
    hhi = sum((item["weight"] / 100) ** 2 for item in allocation)
    n = len(allocation)
    diversification = round((1 - hhi) * 100, 1) if n > 1 else 0

    risk_metrics = {
        "total_holdings": n,
        "total_sectors": len(sector_map),
        "concentration_top": round(top_weight, 1),
        "diversification_score": diversification,
        "largest_position": sorted_by_weight[0]["symbol"] if sorted_by_weight else None,
        "volatility_label": "High" if top_weight > 40 else "Moderate" if top_weight > 25 else "Low",
    }

    # Top/Bottom performers
    sorted_by_pnl = sorted(allocation, key=lambda x: x["pnl_percent"], reverse=True)
    top_performers = sorted_by_pnl[:3]
    bottom_performers = sorted_by_pnl[-3:][::-1] if len(sorted_by_pnl) >= 3 else sorted_by_pnl[::-1]

    return {
        "portfolio_id": str(portfolio_id),
        "portfolio_name": portfolio.name,
        "total_value": round(total_value, 2),
        "total_invested": round(total_invested, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_percent": round(total_pnl_pct, 2),
        "allocation": allocation,
        "sector_allocation": sector_allocation,
        "risk_metrics": risk_metrics,
        "top_performers": top_performers,
        "bottom_performers": bottom_performers,
    }
