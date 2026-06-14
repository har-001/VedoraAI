"""
VedoraAI — Auth API Routes
Registration, login, OAuth, OTP, 2FA, password management.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_password,
    verify_password,
)
from app.models.user import LoginHistory, OTPCode, User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    OTPSendRequest,
    OTPVerifyRequest,
    RegisterRequest,
    RegisterResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserBrief,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


# ── Register ─────────────────────────────────────────
@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user with email and password."""
    # Check existing
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Check phone uniqueness if provided
    if data.phone:
        phone_check = await db.execute(select(User).where(User.phone == data.phone))
        if phone_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phone number already registered",
            )

    # Create user
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        auth_provider="email",
    )
    db.add(user)
    await db.flush()

    return RegisterResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
    )


# ── Login ────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        # Log failed attempt
        await _log_login(db, None, request, "failed", "email")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(data.password, user.password_hash):
        await _log_login(db, user.id, request, "failed", "email")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated",
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await _log_login(db, user.id, request, "success", "email")

    return _create_token_response(user)


# ── Refresh Token ────────────────────────────────────
@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh an access token using a refresh token."""
    payload = decode_token(data.refresh_token)

    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )

    return _create_token_response(user)


# ── OTP Send ─────────────────────────────────────────
@router.post("/otp/send")
async def send_otp(
    data: OTPSendRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send OTP to phone or email."""
    if not data.phone and not data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone or email required",
        )

    code = generate_otp()
    otp = OTPCode(
        phone=data.phone,
        email=data.email,
        code=code,
        purpose=data.purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes),
    )

    # Link to user if exists
    if data.email:
        result = await db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()
        if user:
            otp.user_id = user.id
    elif data.phone:
        result = await db.execute(select(User).where(User.phone == data.phone))
        user = result.scalar_one_or_none()
        if user:
            otp.user_id = user.id

    db.add(otp)

    # In production, send via SMS/email service
    # For dev, return the code
    return {
        "message": f"OTP sent to {'phone' if data.phone else 'email'}",
        "expires_in": settings.otp_expiry_minutes * 60,
        # DEV ONLY — remove in production
        "dev_code": code if settings.debug else None,
    }


# ── OTP Verify ───────────────────────────────────────
@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(
    data: OTPVerifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Verify OTP and login/verify user."""
    query = select(OTPCode).where(
        OTPCode.code == data.code,
        OTPCode.purpose == data.purpose,
        OTPCode.is_used == False,
        OTPCode.expires_at > datetime.now(timezone.utc),
    )

    if data.phone:
        query = query.where(OTPCode.phone == data.phone)
    elif data.email:
        query = query.where(OTPCode.email == data.email)

    result = await db.execute(query.order_by(OTPCode.created_at.desc()).limit(1))
    otp = result.scalar_one_or_none()

    if not otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
        )

    otp.is_used = True

    # Find or create user
    user = None
    if otp.user_id:
        result = await db.execute(select(User).where(User.id == otp.user_id))
        user = result.scalar_one_or_none()

    if not user:
        # Auto-register for phone OTP login
        if data.phone:
            user = User(
                email=f"{data.phone}@phone.vedoraai.com",
                full_name="VedoraAI User",
                phone=data.phone,
                is_verified=True,
                auth_provider="phone",
            )
            db.add(user)
            await db.flush()
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

    # Mark verified if purpose is verification
    if data.purpose in ("verify_phone", "verify_email"):
        user.is_verified = True

    user.last_login = datetime.now(timezone.utc)
    await _log_login(db, user.id, request, "success", "otp")

    return _create_token_response(user)


# ── Forgot Password ──────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send password reset OTP."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    # Always return success (security — don't reveal email existence)
    if user:
        code = generate_otp()
        otp = OTPCode(
            user_id=user.id,
            email=data.email,
            code=code,
            purpose="reset_password",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes),
        )
        db.add(otp)

    return {"message": "If the email exists, a reset code has been sent."}


# ── Change Password ──────────────────────────────────
@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password for logged-in user."""
    if not user.password_hash or not verify_password(data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    user.password_hash = hash_password(data.new_password)
    return {"message": "Password updated successfully"}


# ── Logout ───────────────────────────────────────────
@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    """Logout current user (client should discard tokens)."""
    # In a production setup, we'd blacklist the token in Redis
    return {"message": "Logged out successfully"}


# ── Me ───────────────────────────────────────────────
@router.get("/me", response_model=UserBrief)
async def get_me(user: User = Depends(get_current_user)):
    """Get current user profile."""
    return user


# ── Helpers ──────────────────────────────────────────
def _create_token_response(user: User) -> TokenResponse:
    """Generate token response for a user."""
    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role, "email": user.email},
    )
    refresh = create_refresh_token(subject=str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserBrief(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            role=user.role,
            is_verified=user.is_verified,
        ),
    )


async def _log_login(db: AsyncSession, user_id, request: Request, login_status: str, method: str):
    """Log a login attempt."""
    log = LoginHistory(
        user_id=user_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        status=login_status,
        auth_method=method,
    )
    db.add(log)
