"""
VedoraAI — User Model
Core user entity with auth, profile, and preferences.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    String,
    Text,
    UUID,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """Main user account."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Null for OAuth-only users
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True, unique=True, index=True)
    avatar_url = Column(Text, nullable=True)

    # Auth
    role = Column(String(20), nullable=False, default="user")  # user, admin, moderator
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_2fa_enabled = Column(Boolean, default=False)
    totp_secret = Column(String(255), nullable=True)

    # OAuth
    google_id = Column(String(255), nullable=True, unique=True)
    apple_id = Column(String(255), nullable=True, unique=True)
    auth_provider = Column(String(20), default="email")  # email, google, apple

    # Profile
    bio = Column(Text, nullable=True)
    preferred_language = Column(String(10), default="en")
    preferred_currency = Column(String(5), default="INR")
    timezone = Column(String(50), default="Asia/Kolkata")

    # Preferences (JSON for flexibility)
    preferences = Column(JSON, default=dict)
    dashboard_layout = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    login_history = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")
    otp_codes = relationship("OTPCode", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_role", "role"),
        Index("ix_users_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<User {self.email}>"


class Device(Base):
    """Registered devices for a user (for device management & biometric)."""

    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    device_name = Column(String(255), nullable=False)
    device_type = Column(String(50), nullable=False)  # android, ios, web
    device_token = Column(Text, nullable=True)  # FCM token for push
    fingerprint = Column(String(255), nullable=True)
    is_trusted = Column(Boolean, default=False)
    last_active = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="devices")


class LoginHistory(Base):
    """Track login activity for security monitoring."""

    __tablename__ = "login_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False)  # success, failed, blocked
    auth_method = Column(String(20), nullable=True)  # email, google, apple, otp
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="login_history")


class OTPCode(Base):
    """One-Time Password codes for phone/email verification."""

    __tablename__ = "otp_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    code = Column(String(10), nullable=False)
    purpose = Column(String(30), nullable=False)  # login, verify_phone, verify_email, reset_password
    is_used = Column(Boolean, default=False)
    attempts = Column(String(5), default="0")
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="otp_codes")
