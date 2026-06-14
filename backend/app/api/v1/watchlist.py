"""
VedoraAI — Watchlist API Routes
CRUD operations for user watchlists and watchlist items.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.market import Watchlist, WatchlistItem
from app.models.user import User
from app.schemas.market import (
    WatchlistCreate,
    WatchlistItemAdd,
    WatchlistResponse,
    WatchlistUpdate,
)

router = APIRouter(prefix="/watchlists", tags=["Watchlists"])


# ── List user's watchlists ───────────────────────────
@router.get("/", response_model=list[WatchlistResponse])
async def list_watchlists(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all watchlists for the current user."""
    result = await db.execute(
        select(Watchlist)
        .options(selectinload(Watchlist.items))
        .where(Watchlist.user_id == user.id)
        .order_by(Watchlist.created_at)
    )
    watchlists = result.scalars().all()

    # Auto-create default watchlist if none exist
    if not watchlists:
        default = Watchlist(user_id=user.id, name="My Watchlist", is_default=True)
        db.add(default)
        await db.commit()
        await db.refresh(default, ["items"])
        watchlists = [default]

    return watchlists


# ── Create watchlist ─────────────────────────────────
@router.post("/", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
async def create_watchlist(
    body: WatchlistCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new watchlist."""
    watchlist = Watchlist(user_id=user.id, name=body.name)
    db.add(watchlist)
    await db.commit()
    await db.refresh(watchlist, ["items"])
    return watchlist


# ── Update watchlist ─────────────────────────────────
@router.put("/{watchlist_id}", response_model=WatchlistResponse)
async def update_watchlist(
    watchlist_id: UUID,
    body: WatchlistUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rename a watchlist."""
    result = await db.execute(
        select(Watchlist)
        .options(selectinload(Watchlist.items))
        .where(Watchlist.id == watchlist_id, Watchlist.user_id == user.id)
    )
    watchlist = result.scalar_one_or_none()
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    if body.name is not None:
        watchlist.name = body.name
    await db.commit()
    await db.refresh(watchlist, ["items"])
    return watchlist


# ── Delete watchlist ─────────────────────────────────
@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_watchlist(
    watchlist_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a watchlist and all its items."""
    result = await db.execute(
        select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user.id)
    )
    watchlist = result.scalar_one_or_none()
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    await db.delete(watchlist)
    await db.commit()


# ── Add item to watchlist ────────────────────────────
@router.post("/{watchlist_id}/items", status_code=status.HTTP_201_CREATED)
async def add_watchlist_item(
    watchlist_id: UUID,
    body: WatchlistItemAdd,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add an asset symbol to a watchlist."""
    # Verify ownership
    result = await db.execute(
        select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user.id)
    )
    watchlist = result.scalar_one_or_none()
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    # Check duplicate
    existing = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.symbol == body.symbol.upper(),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Symbol already in watchlist")

    # Get next sort order
    count_result = await db.execute(
        select(WatchlistItem).where(WatchlistItem.watchlist_id == watchlist_id)
    )
    count = len(count_result.scalars().all())

    item = WatchlistItem(
        watchlist_id=watchlist_id,
        symbol=body.symbol.upper(),
        sort_order=count,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"symbol": item.symbol, "id": str(item.id), "message": "Added to watchlist"}


# ── Remove item from watchlist ───────────────────────
@router.delete("/{watchlist_id}/items/{symbol}")
async def remove_watchlist_item(
    watchlist_id: UUID,
    symbol: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove an asset symbol from a watchlist."""
    # Verify ownership
    result = await db.execute(
        select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Watchlist not found")

    # Find item
    item_result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.symbol == symbol.upper(),
        )
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Symbol not in watchlist")

    await db.delete(item)
    await db.commit()
    return {"message": f"{symbol.upper()} removed from watchlist"}
