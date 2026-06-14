"""
VedoraAI — Community API Routes
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.community import CommunityPost
from app.models.user import User

router = APIRouter(prefix="/community", tags=["Community"])


# ── Schemas ──────────────────────────────────────────
class PostCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    content: str = Field(..., min_length=5)
    symbol: Optional[str] = Field(None, max_length=20)
    backtest_result: Optional[dict[str, Any]] = None


class UserMinResponse(BaseModel):
    id: UUID
    full_name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    content: str
    symbol: Optional[str]
    backtest_result: Optional[dict[str, Any]]
    created_at: datetime
    user: UserMinResponse

    class Config:
        from_attributes = True


# ── Routes ───────────────────────────────────────────
@router.get("/", response_model=list[PostResponse])
async def list_posts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Retrieve all community posts sorted by creation date (newest first)."""
    result = await db.execute(
        select(CommunityPost)
        .options(selectinload(CommunityPost.user))
        .order_by(CommunityPost.created_at.desc())
    )
    posts = result.scalars().all()
    return posts


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    body: PostCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new post on the community sentiment feed."""
    post = CommunityPost(
        user_id=user.id,
        title=body.title,
        content=body.content,
        symbol=body.symbol,
        backtest_result=body.backtest_result,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post, ["user"])
    return post
