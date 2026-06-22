"""
VedoraAI — Notification API Routes
In-app notification center: list, mark-read, clear.
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ── Schemas ──────────────────────────────────────────
class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    category: str
    symbol: str | None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationSummary(BaseModel):
    notifications: list[NotificationResponse]
    unread_count: int
    total: int


# ── Routes ───────────────────────────────────────────
@router.get("/", response_model=NotificationSummary)
async def list_notifications(
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get user notifications with unread count."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    notifications = result.scalars().all()

    unread = sum(1 for n in notifications if not n.is_read)

    return {
        "notifications": notifications,
        "unread_count": unread,
        "total": len(notifications),
    }


@router.put("/read")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mark all notifications as read."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}


@router.put("/{notification_id}/read")
async def mark_one_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mark a single notification as read."""
    result = await db.execute(
        select(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user.id)
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    return {"message": "Notification marked as read"}


@router.delete("/clear")
async def clear_notifications(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete all read notifications for the user."""
    await db.execute(
        delete(Notification)
        .where(Notification.user_id == user.id, Notification.is_read == True)
    )
    await db.commit()
    return {"message": "Read notifications cleared"}
