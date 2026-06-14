"""
VedoraAI — Auth Schemas
Pydantic models for authentication request/response validation.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ── Registration ─────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = None


class RegisterResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    message: str = "Registration successful. Please verify your email."


# ── Login ────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserBrief"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── OAuth ────────────────────────────────────────────
class GoogleAuthRequest(BaseModel):
    id_token: str


class AppleAuthRequest(BaseModel):
    id_token: str
    authorization_code: str
    full_name: Optional[str] = None


# ── OTP ──────────────────────────────────────────────
class OTPSendRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    purpose: str = "login"  # login, verify_phone, verify_email, reset_password


class OTPVerifyRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    code: str = Field(..., min_length=4, max_length=8)
    purpose: str = "login"


# ── 2FA ──────────────────────────────────────────────
class Enable2FAResponse(BaseModel):
    secret: str
    qr_code_url: str
    message: str = "Scan QR code with authenticator app"


class Verify2FARequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


# ── Password ─────────────────────────────────────────
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


# ── User Brief (used in token response) ─────────────
class UserBrief(BaseModel):
    id: UUID
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    is_verified: bool

    class Config:
        from_attributes = True


# Forward reference resolution
TokenResponse.model_rebuild()
