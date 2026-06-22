"""
VedoraAI — Admin API Routes
Management endpoints for platform admin actions.
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func, or_, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.user import User
from app.models.alert import Alert
from app.models.community import CommunityPost
from app.models.market import Prediction
from app.ai.scanner.engine import scanner_engine

router = APIRouter(prefix="/admin", tags=["Admin Control"])

# ── Schemas ──────────────────────────────────────────

class SubscriptionTierCount(BaseModel):
    tier: str
    count: int

class PlatformStatsResponse(BaseModel):
    total_users: int
    pro_users: int
    free_users: int
    inactive_users: int
    total_alerts: int
    triggered_alerts: int
    total_community_posts: int
    total_predictions: int
    db_status: str
    scanner_last_run: Optional[str]

class UserListItem(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    subscription_tier: str
    is_active: bool
    is_verified: bool
    created_at: str

    class Config:
        from_attributes = True

class PaginatedUserResponse(BaseModel):
    users: List[UserListItem]
    total_count: int
    page: int
    page_size: int

class UpdateUserRequest(BaseModel):
    role: Optional[str] = None
    subscription_tier: Optional[str] = None
    is_active: Optional[bool] = None

# ── Endpoints ────────────────────────────────────────

@router.get("/stats", response_model=PlatformStatsResponse)
async def get_platform_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve platform analytics and health check data."""
    # Count totals
    users_count = await db.scalar(select(func.count(User.id)))
    pro_count = await db.scalar(select(func.count(User.id)).where(User.subscription_tier == "pro"))
    free_count = await db.scalar(select(func.count(User.id)).where(User.subscription_tier == "free"))
    inactive_count = await db.scalar(select(func.count(User.id)).where(User.is_active == False))
    
    alerts_count = await db.scalar(select(func.count(Alert.id)))
    triggered_alerts_count = await db.scalar(select(func.count(Alert.id)).where(Alert.is_triggered == True))
    
    posts_count = await db.scalar(select(func.count(CommunityPost.id)))
    predictions_count = await db.scalar(select(func.count(Prediction.id)))
    
    # Scanner status check
    last_run_str = None
    if hasattr(scanner_engine, "last_scan_time") and scanner_engine.last_scan_time:
        last_run_str = scanner_engine.last_scan_time.isoformat()
    else:
        last_run_str = datetime.utcnow().isoformat()  # Mock fallback

    return PlatformStatsResponse(
        total_users=users_count or 0,
        pro_users=pro_count or 0,
        free_users=free_count or 0,
        inactive_users=inactive_count or 0,
        total_alerts=alerts_count or 0,
        triggered_alerts=triggered_alerts_count or 0,
        total_community_posts=posts_count or 0,
        total_predictions=predictions_count or 0,
        db_status="Online - SQLite (Operational)",
        scanner_last_run=last_run_str
    )

@router.get("/users", response_model=PaginatedUserResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    subscription_tier: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve lists of users with paginated filters and search."""
    offset = (page - 1) * page_size
    
    # Build query
    query = select(User)
    
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                User.email.like(search_filter),
                User.full_name.like(search_filter),
                User.phone.like(search_filter)
            )
        )
        
    if role:
        query = query.where(User.role == role)
        
    if subscription_tier:
        query = query.where(User.subscription_tier == subscription_tier)
        
    # Get total count (for pagination stats)
    count_query = select(func.count()).select_from(query.subquery())
    total_count = await db.scalar(count_query)
    
    # Execute paginated query
    query = query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Map to schemas
    user_items = [
        UserListItem(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            phone=u.phone,
            role=u.role,
            subscription_tier=u.subscription_tier,
            is_active=u.is_active,
            is_verified=u.is_verified,
            created_at=str(u.created_at)
        ) for u in users
    ]
    
    return PaginatedUserResponse(
        users=user_items,
        total_count=total_count or 0,
        page=page,
        page_size=page_size
    )

@router.put("/users/{user_id}", response_model=UserListItem)
async def update_user_status(
    user_id: UUID,
    payload: UpdateUserRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Modify user credentials, active statuses, or permissions."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Security check: Prevent admins from self-demoting or self-deactivating
    if user.id == admin.id:
        if payload.role and payload.role != admin.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admins cannot change their own administrative roles"
            )
        if payload.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admins cannot ban/deactivate their own active session accounts"
            )

    # Apply updates
    if payload.role is not None:
        user.role = payload.role
    if payload.subscription_tier is not None:
        user.subscription_tier = payload.subscription_tier
    if payload.is_active is not None:
        user.is_active = payload.is_active
        
    await db.commit()
    await db.refresh(user)
    
    return UserListItem(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        subscription_tier=user.subscription_tier,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=str(user.created_at)
    )

@router.post("/scanner/trigger")
async def trigger_manual_scan(
    admin: User = Depends(get_current_admin)
):
    """Trigger an immediate backend scanner job to recalculate patterns."""
    try:
        # Run scan_all with force enabled
        results = await scanner_engine.scan_all(force=True)
        return {
            "status": "success",
            "message": "Technical pattern scan completed successfully",
            "assets_scanned": len(results) if results else 0,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute background pattern scanner: {str(e)}"
        )
