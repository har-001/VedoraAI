"""
VedoraAI — Database Initialization Script
Imports all SQLAlchemy models and creates tables in the configured database.
"""

import asyncio
import sys
import os

# Add the current directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine
from app.core.config import get_settings

# Import all models to register them on Base.metadata
from app.models.user import User, Device, LoginHistory, OTPCode
from app.models.market import (
    Asset,
    PriceHistory,
    Watchlist,
    WatchlistItem,
    Portfolio,
    PortfolioHolding,
    Prediction,
)
from app.models.community import CommunityPost
from app.models.alert import Alert
from app.models.notification import Notification

settings = get_settings()

async def init_models():
    print(f"Initializing database tables for {settings.app_name}...")
    print(f"Database URL: {settings.database_url}")
    
    try:
        async with engine.begin() as conn:
            # Create all tables if they don't exist
            await conn.run_sync(Base.metadata.create_all)
            
            # Simple migration for existing database
            try:
                from sqlalchemy import text
                await conn.execute(text("ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free'"))
                print("Migration: Added subscription_tier column to users table.")
            except Exception:
                # Column likely already exists
                pass
        print("Database tables initialized successfully!")
    except Exception as e:
        print(f"Failed to initialize database: {e}", file=sys.stderr)

if __name__ == "__main__":
    asyncio.run(init_models())
