# VedoraAI — Complete Project Guide & Reference

> **"Intelligence Behind Every Decision"**
> VedoraAI ek AI-powered market intelligence, research, aur educational decision-support platform hai. (Yeh trading execution platform nahi hai—funds manage ya trades directly run nahi karta).

---

## 🏗️ Project Architecture & Structure

VedoraAI ek Modern Full-Stack web application hai jo 2 key systems mein divided hai:
1. **Backend (FastAPI)**: Python-based high-performance API server. Database operations, calculations, aur AI logic handling ispar hoti hai.
2. **Frontend (Next.js)**: React & TypeScript-based fast web UI. Clean Design Tokens, responsive layouts, aur charts serve karta hai.
3. **Mobile Client (Flutter)**: Cross-platform mobile app codebase standard libraries ke sath.

### Project Directory Layout
```
VedoraAI-1/
├── web/                          # Next.js Frontend App
│   ├── src/app/                  # Application Routes (Pages)
│   │   ├── auth/                 # Login, Register, Forgot Password pages
│   │   └── dashboard/            # Platform Dashboard Pages
│   │       ├── admin/            # Platform Administration Console
│   │       ├── backtest/         # Strategy Lab (SMA, RSI, MACD backtesting)
│   │       ├── coach/            # Gemini AI chatbot advisor
│   │       ├── community/        # Community Forum
│   │       ├── learn/            # Education Hub (lessons & interactive quizzes)
│   │       ├── markets/          # Market table & technical scanner
│   │       ├── news/             # Financial News & Sentiment NLP Scoring
│   │       ├── portfolio/        # Portfolio analytics (Risk metrics, CSV export)
│   │       ├── predictions/      # XGBoost price direction prediction model
│   │       ├── settings/         # Theme toggles & user profiles
│   │       ├── stock/[symbol]/   # Custom stock details (interactive charts)
│   │       └── watchlist/        # Watchlist tracker with price triggers
│   └── src/lib/api.ts            # Centralized API HTTP Client
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── ai/                   # AI Brain Engine
│   │   │   ├── prediction/       # XGBoost classifier model (30+ indicators)
│   │   │   ├── sentiment/        # News Lexicon polarity engine
│   │   │   ├── coach/            # Gemini API integration wrapper
│   │   │   └── scanner/          # Pattern scanner (Golden cross, RSI extremes)
│   │   ├── api/v1/               # API Router endpoints (16 routers)
│   │   ├── models/               # Database ORM models (SQLite/Postgres)
│   │   └── services/             # Yahoo Finance market data parser
│   └── requirements.txt          # Python dependencies list
├── mobile/                       # Flutter Cross-Platform codebase
└── infra/docker/                 # Docker Compose development & production setups
```

---

## 🧠 AI Brain & Features Guide

### 1. Market Heatmap & Live Indices
Overview Page par top-performing NSE stocks ka live color-coded Grid (Heatmap) hai. Green range strength ko aur Red fall intensity ko batati hai. Live index values (NIFTY, SENSEX, BANKNIFTY) dynamically fetch hote hain.

### 2. XGBoost Price Predictor
Iska backend asset metrics aur 30+ technical indicators (RSI, Bollinger Bands, MACD, ATR, ADX) process karta hai, aur machine learning parameters ke through next periods (intraday, 1D, 7D) ka directional forecast model compute karta hai.

### 3. News Sentiment NLP Engine
Yahoo Finance RSS aur news feed posts index karta hai. Custom Loughran-McDonald terminology dictionary apply karke polarity logic runs calculate karta hai: Neutral, Bullish, or Bearish sentiment impact values derive karne ke liye.

### 4. Technical Scanner
Custom scanner market list analyze karta hai:
- **Golden Cross / Death Cross** (50 DMA crossovers 200 DMA)
- **RSI Overbought / Oversold** (levels 30 & 70 limits)
- **Bollinger Breakthrough** (upper/lower band breakout triggers)
- **Volume Surge** (10-day volume average exceeding averages)

### 5. Gemini AI Coach
Advanced Google Gemini model connection. Dynamic history storage support karta hai taaki conversation memory bani rahe. System parameter inputs financial analysis advisory model context maintain karte hain.

### 6. Strategy Simulation Lab
Simulate baseline parameters on historical candles:
- Crossovers, limits, triggers choose karo.
- Output metrics dynamically check karo (Win Rate, Profit Factor, Max Drawdown).
- Trade logs examine karo aur outputs community board par directly single-click publish karo.

### 7. Interactive Custom Charts
Pure custom SVG vectors visual elements serve karte hain bina external charting plugin downloads ke. Crosshair points trace details dynamically highlight karte hain window parameters resize options ke sath.

---

## 🛡️ Administrative Console

Only roles marked as `admin` have access to `/dashboard/admin`:
- **Diagnostic charts**: Membership tier proportions dynamically plotted in SVG.
- **Access switches**: Upgrade users, change roles, or suspend specific email profiles.
- **Engine configs**: Confidence filters, indicators weights adjustment.
- **Manual override**: Triggers an instant technical scanning daemon to recalculate patterns across active symbols.
