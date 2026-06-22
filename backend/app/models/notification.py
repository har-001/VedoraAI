"""
VedoraAI — Notification Model
In-app notifications for price alerts, system messages, and AI insights.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
    UUID,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Notification(Base):
    """User notifications for triggered alerts, system messages, and AI insights."""

    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(30), nullable=False, default="system")  # alert, system, insight
    symbol = Column(String(20), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User")

    def __repr__(self):
        return f"<Notification {self.title} for User {self.user_id}>"
