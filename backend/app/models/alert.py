"""
VedoraAI — Alert Model
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    String,
    UUID,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Alert(Base):
    """User-configured alerts based on price triggers or technical scanner patterns."""

    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    alert_type = Column(String(30), nullable=False)  # price_above, price_below, technical_pattern
    target_value = Column(Float, nullable=True)
    pattern_name = Column(String(50), nullable=True)  # e.g., Golden Cross, RSI Oversold
    is_triggered = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    triggered_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")

    def __repr__(self):
        return f"<Alert {self.symbol} {self.alert_type} for User {self.user_id}>"
