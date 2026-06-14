"""
VedoraAI — Community Model
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    JSON,
    String,
    Text,
    UUID,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class CommunityPost(Base):
    """Community posts shared by users containing text and optional backtest logs."""

    __tablename__ = "community_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    symbol = Column(String(20), nullable=True, index=True)
    backtest_result = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User")

    def __repr__(self):
        return f"<CommunityPost {self.title} by User {self.user_id}>"
