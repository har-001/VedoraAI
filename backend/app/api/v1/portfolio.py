"""
VedoraAI — Portfolio API Routes
CRUD operations for user portfolios and holdings.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.market import Portfolio, PortfolioHolding
from app.models.user import User
from app.schemas.market import (
    HoldingAdd,
    HoldingUpdate,
    PortfolioCreate,
    PortfolioResponse,
    PortfolioUpdate,
)

router = APIRouter(prefix="/portfolios", tags=["Portfolios"])


# ── List user's portfolios ───────────────────────────
@router.get("/", response_model=list[PortfolioResponse])
async def list_portfolios(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all portfolios for the current user."""
    result = await db.execute(
        select(Portfolio)
        .options(selectinload(Portfolio.holdings))
        .where(Portfolio.user_id == user.id)
        .order_by(Portfolio.created_at)
    )
    portfolios = result.scalars().all()

    # Auto-create default portfolio if none exist
    if not portfolios:
        default = Portfolio(user_id=user.id, name="My Portfolio", is_default=True)
        db.add(default)
        await db.commit()
        await db.refresh(default, ["holdings"])
        portfolios = [default]

    return portfolios


# ── Create portfolio ─────────────────────────────────
@router.post("/", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    body: PortfolioCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new portfolio."""
    portfolio = Portfolio(user_id=user.id, name=body.name)
    db.add(portfolio)
    await db.commit()
    await db.refresh(portfolio, ["holdings"])
    return portfolio


# ── Update portfolio ─────────────────────────────────
@router.put("/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: UUID,
    body: PortfolioUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rename a portfolio."""
    result = await db.execute(
        select(Portfolio)
        .options(selectinload(Portfolio.holdings))
        .where(Portfolio.id == portfolio_id, Portfolio.user_id == user.id)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    if body.name is not None:
        portfolio.name = body.name
    await db.commit()
    await db.refresh(portfolio, ["holdings"])
    return portfolio


# ── Delete portfolio ─────────────────────────────────
@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a portfolio and all its holdings."""
    result = await db.execute(
        select(Portfolio).where(Portfolio.id == portfolio_id, Portfolio.user_id == user.id)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    await db.delete(portfolio)
    await db.commit()


# ── Add holding ──────────────────────────────────────
@router.post("/{portfolio_id}/holdings", status_code=status.HTTP_201_CREATED)
async def add_holding(
    portfolio_id: UUID,
    body: HoldingAdd,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a holding to a portfolio."""
    # Verify ownership
    result = await db.execute(
        select(Portfolio).where(Portfolio.id == portfolio_id, Portfolio.user_id == user.id)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Check duplicate symbol
    existing = await db.execute(
        select(PortfolioHolding).where(
            PortfolioHolding.portfolio_id == portfolio_id,
            PortfolioHolding.symbol == body.symbol.upper(),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="Symbol already in portfolio. Use PUT to update quantity.",
        )

    holding = PortfolioHolding(
        portfolio_id=portfolio_id,
        symbol=body.symbol.upper(),
        quantity=body.quantity,
        avg_buy_price=body.avg_buy_price,
        notes=body.notes,
    )
    db.add(holding)
    await db.commit()
    await db.refresh(holding)
    return {
        "id": str(holding.id),
        "symbol": holding.symbol,
        "quantity": holding.quantity,
        "avg_buy_price": holding.avg_buy_price,
        "message": "Holding added",
    }


# ── Update holding ───────────────────────────────────
@router.put("/{portfolio_id}/holdings/{holding_id}")
async def update_holding(
    portfolio_id: UUID,
    holding_id: UUID,
    body: HoldingUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a holding's quantity, price, or notes."""
    # Verify portfolio ownership
    port_result = await db.execute(
        select(Portfolio).where(Portfolio.id == portfolio_id, Portfolio.user_id == user.id)
    )
    if not port_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Find holding
    result = await db.execute(
        select(PortfolioHolding).where(
            PortfolioHolding.id == holding_id,
            PortfolioHolding.portfolio_id == portfolio_id,
        )
    )
    holding = result.scalar_one_or_none()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")

    if body.quantity is not None:
        holding.quantity = body.quantity
    if body.avg_buy_price is not None:
        holding.avg_buy_price = body.avg_buy_price
    if body.notes is not None:
        holding.notes = body.notes

    await db.commit()
    await db.refresh(holding)
    return {
        "id": str(holding.id),
        "symbol": holding.symbol,
        "quantity": holding.quantity,
        "avg_buy_price": holding.avg_buy_price,
        "message": "Holding updated",
    }


# ── Delete holding ───────────────────────────────────
@router.delete("/{portfolio_id}/holdings/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_holding(
    portfolio_id: UUID,
    holding_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a holding from a portfolio."""
    port_result = await db.execute(
        select(Portfolio).where(Portfolio.id == portfolio_id, Portfolio.user_id == user.id)
    )
    if not port_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Portfolio not found")

    result = await db.execute(
        select(PortfolioHolding).where(
            PortfolioHolding.id == holding_id,
            PortfolioHolding.portfolio_id == portfolio_id,
        )
    )
    holding = result.scalar_one_or_none()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")

    await db.delete(holding)
    await db.commit()
