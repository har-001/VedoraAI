"""
VedoraAI — Alert API Routes
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.alert import Alert
from app.models.user import User
from app.services.market_data import market_data
from app.ai.scanner.engine import scanner_engine

router = APIRouter(prefix="/alerts", tags=["Alerts"])


# ── Schemas ──────────────────────────────────────────
class AlertCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    alert_type: str = Field(..., description="price_above, price_below, technical_pattern")
    target_value: Optional[float] = Field(None, description="Target price for price alerts")
    pattern_name: Optional[str] = Field(None, description="Pattern name for technical pattern alerts")


class AlertResponse(BaseModel):
    id: UUID
    user_id: UUID
    symbol: str
    alert_type: str
    target_value: Optional[float]
    pattern_name: Optional[str]
    is_triggered: bool
    created_at: datetime
    triggered_at: Optional[datetime]

    class Config:
        from_attributes = True


class CheckAlertsResponse(BaseModel):
    triggered: list[AlertResponse]
    all_alerts: list[AlertResponse]


# ── Routes ───────────────────────────────────────────
@router.get("/", response_model=list[AlertResponse])
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get all alerts for the current user (active and triggered)."""
    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == user.id)
        .order_by(Alert.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    body: AlertCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new price or technical indicator alert."""
    # Normalize inputs
    symbol = body.symbol.upper().strip()
    
    # Validation based on alert type
    if body.alert_type in ("price_above", "price_below"):
        if body.target_value is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="target_value is required for price alerts",
            )
    elif body.alert_type == "technical_pattern":
        if not body.pattern_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="pattern_name is required for technical pattern alerts",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid alert_type: {body.alert_type}",
        )

    alert = Alert(
        user_id=user.id,
        symbol=symbol,
        alert_type=body.alert_type,
        target_value=body.target_value,
        pattern_name=body.pattern_name,
        is_triggered=False,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an alert by ID."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    await db.delete(alert)
    await db.commit()
    return


@router.post("/check", response_model=CheckAlertsResponse)
async def check_alerts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check all active alerts for this user.
    Evaluates price targets against live Yahoo Finance prices,
    and technical indicators against scanner results.
    """
    # Fetch active alerts
    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == user.id, Alert.is_triggered == False)
    )
    active_alerts = result.scalars().all()

    if not active_alerts:
        # No active alerts, get all alerts to return
        all_res = await db.execute(
            select(Alert)
            .where(Alert.user_id == user.id)
            .order_by(Alert.created_at.desc())
        )
        return {"triggered": [], "all_alerts": all_res.scalars().all()}

    # Separate price alerts and pattern alerts
    price_alerts = [a for a in active_alerts if a.alert_type in ("price_above", "price_below")]
    pattern_alerts = [a for a in active_alerts if a.alert_type == "technical_pattern"]

    triggered_alerts = []

    # 1. Evaluate Price Alerts
    if price_alerts:
        unique_symbols = list(set(a.symbol for a in price_alerts))
        # Normalize symbols for Yahoo Finance
        normalized_symbols = []
        symbol_map = {}  # maps normalized -> original symbol
        for sym in unique_symbols:
            norm_sym = sym
            if "." not in sym and "^" not in sym:
                norm_sym = f"{sym}.NS"
            normalized_symbols.append(norm_sym)
            symbol_map[norm_sym] = sym

        # Fetch quotes
        quotes = await market_data.get_multiple_quotes(normalized_symbols)
        prices = {}
        for q in quotes:
            if "error" not in q and "current_price" in q:
                raw_sym = q.get("raw_symbol", "")
                orig_sym = symbol_map.get(raw_sym, raw_sym.replace(".NS", ""))
                prices[orig_sym] = q["current_price"]

        for alert in price_alerts:
            current_p = prices.get(alert.symbol)
            if current_p is not None:
                is_triggered = False
                if alert.alert_type == "price_above" and current_p >= alert.target_value:
                    is_triggered = True
                elif alert.alert_type == "price_below" and current_p <= alert.target_value:
                    is_triggered = True

                if is_triggered:
                    alert.is_triggered = True
                    alert.triggered_at = datetime.now(timezone.utc)
                    triggered_alerts.append(alert)

    # 2. Evaluate Pattern Alerts
    if pattern_alerts:
        # Run or fetch cached scanner results
        scan_data = await scanner_engine.scan_all(force=False)
        results = scan_data.get("results", [])
        
        # Map clean symbol -> list of patterns detected
        detected_patterns = {}
        for res in results:
            sym = res["symbol"].upper()
            patterns = [sig["pattern"].lower() for sig in res.get("signals", [])]
            detected_patterns[sym] = patterns

        for alert in pattern_alerts:
            sym = alert.symbol.upper()
            patterns = detected_patterns.get(sym, [])
            target_pat = alert.pattern_name.lower()
            if target_pat in patterns:
                alert.is_triggered = True
                alert.triggered_at = datetime.now(timezone.utc)
                triggered_alerts.append(alert)

    # Save changes if any alerts were triggered
    if triggered_alerts:
        await db.commit()

    # Retrieve all user alerts for returning state
    all_res = await db.execute(
        select(Alert)
        .where(Alert.user_id == user.id)
        .order_by(Alert.created_at.desc())
    )
    all_alerts = all_res.scalars().all()

    return {
        "triggered": triggered_alerts,
        "all_alerts": all_alerts,
    }
