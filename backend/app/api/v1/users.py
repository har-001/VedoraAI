"""
VedoraAI — Users API Routes
User profile management and settings.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import Device, LoginHistory, User

router = APIRouter(prefix="/users", tags=["Users"])


# ── Schemas ──────────────────────────────────────────
class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_language: Optional[str] = None
    preferred_currency: Optional[str] = None
    timezone: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    avatar_url: Optional[str]
    role: str
    subscription_tier: str
    is_verified: bool
    is_2fa_enabled: bool
    bio: Optional[str]
    preferred_language: str
    preferred_currency: str
    timezone: str
    created_at: str

    class Config:
        from_attributes = True


class DeviceResponse(BaseModel):
    id: str
    device_name: str
    device_type: str
    is_trusted: bool
    last_active: str

    class Config:
        from_attributes = True


class LoginHistoryResponse(BaseModel):
    id: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    location: Optional[str]
    status: str
    auth_method: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


# ── Profile ──────────────────────────────────────────
@router.get("/me", response_model=UserProfileResponse)
async def get_profile(user: User = Depends(get_current_user)):
    """Get full user profile."""
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        role=user.role,
        subscription_tier=user.subscription_tier,
        is_verified=user.is_verified,
        is_2fa_enabled=user.is_2fa_enabled,
        bio=user.bio,
        preferred_language=user.preferred_language,
        preferred_currency=user.preferred_currency,
        timezone=user.timezone,
        created_at=str(user.created_at),
    )


@router.put("/me", response_model=UserProfileResponse)
async def update_profile(
    data: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user profile."""
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        role=user.role,
        subscription_tier=user.subscription_tier,
        is_verified=user.is_verified,
        is_2fa_enabled=user.is_2fa_enabled,
        bio=user.bio,
        preferred_language=user.preferred_language,
        preferred_currency=user.preferred_currency,
        timezone=user.timezone,
        created_at=str(user.created_at),
    )


@router.post("/me/upgrade", response_model=UserProfileResponse)
async def upgrade_user_tier(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upgrade user subscription tier to pro."""
    user.subscription_tier = "pro"
    await db.commit()
    await db.refresh(user)
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        role=user.role,
        subscription_tier=user.subscription_tier,
        is_verified=user.is_verified,
        is_2fa_enabled=user.is_2fa_enabled,
        bio=user.bio,
        preferred_language=user.preferred_language,
        preferred_currency=user.preferred_currency,
        timezone=user.timezone,
        created_at=str(user.created_at),
    )


@router.post("/me/downgrade", response_model=UserProfileResponse)
async def downgrade_user_tier(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Downgrade user subscription tier to free."""
    user.subscription_tier = "free"
    await db.commit()
    await db.refresh(user)
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        role=user.role,
        subscription_tier=user.subscription_tier,
        is_verified=user.is_verified,
        is_2fa_enabled=user.is_2fa_enabled,
        bio=user.bio,
        preferred_language=user.preferred_language,
        preferred_currency=user.preferred_currency,
        timezone=user.timezone,
        created_at=str(user.created_at),
    )


# ── Preferences ──────────────────────────────────────
@router.put("/me/preferences")
async def update_preferences(
    preferences: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user preferences (theme, dashboard layout, etc.)."""
    current_prefs = user.preferences or {}
    current_prefs.update(preferences)
    user.preferences = current_prefs
    return {"message": "Preferences updated", "preferences": current_prefs}


@router.put("/me/dashboard-layout")
async def update_dashboard_layout(
    layout: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update dashboard widget layout."""
    user.dashboard_layout = layout
    return {"message": "Dashboard layout updated"}


# ── Devices ──────────────────────────────────────────
@router.get("/me/devices")
async def get_devices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all registered devices."""
    result = await db.execute(
        select(Device).where(Device.user_id == user.id).order_by(Device.last_active.desc())
    )
    devices = result.scalars().all()
    return [
        DeviceResponse(
            id=str(d.id),
            device_name=d.device_name,
            device_type=d.device_type,
            is_trusted=d.is_trusted,
            last_active=str(d.last_active),
        )
        for d in devices
    ]


@router.delete("/me/devices/{device_id}")
async def remove_device(
    device_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a registered device."""
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await db.delete(device)
    return {"message": "Device removed"}


# ── Login History ────────────────────────────────────
@router.get("/me/login-history")
async def get_login_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """Get recent login activity."""
    result = await db.execute(
        select(LoginHistory)
        .where(LoginHistory.user_id == user.id)
        .order_by(LoginHistory.created_at.desc())
        .limit(limit)
    )
    history = result.scalars().all()
    return [
        LoginHistoryResponse(
            id=str(h.id),
            ip_address=h.ip_address,
            user_agent=h.user_agent,
            location=h.location,
            status=h.status,
            auth_method=h.auth_method,
            created_at=str(h.created_at),
        )
        for h in history
    ]
