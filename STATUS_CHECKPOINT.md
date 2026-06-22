# VedoraAI — Project Status Checkpoint
> Last updated: 2026-06-22
> Status: **PROJECT COMPLETE** — All 6 phases finished and verified

---

## Project Overview
- **Name**: VedoraAI — "Intelligence Behind Every Decision"
- **Type**: AI Market Intelligence Platform (NOT a trading/execution platform)
- **Stack**: FastAPI (Python) backend + Next.js (React/TypeScript) frontend
- **Database**: SQLite (dev) via SQLAlchemy 2.0 + aiosqlite
- **Auth**: JWT tokens stored in localStorage (`vedora_token`)
- **Market Data**: Yahoo Finance (free API via yfinance)

## Architecture

```
VedoraAI-1/
├── backend/               # FastAPI backend (port 8000)
│   ├── app/
│   │   ├── ai/            # AI engines
│   │   │   ├── prediction/engine.py   # XGBoost + 30 technical indicators
│   │   │   ├── sentiment/engine.py    # Financial lexicon NLP
│   │   │   ├── coach/engine.py        # Gemini API integration
│   │   │   └── scanner/engine.py      # Technical pattern detection
│   │   ├── api/v1/        # REST API routes (15 modules)
│   │   │   ├── auth.py, users.py      # Authentication & user management
│   │   │   ├── market.py              # Quotes, search, sector data
│   │   │   ├── stock_detail.py        # Detailed stock fundamentals
│   │   │   ├── watchlist.py           # Watchlist CRUD
│   │   │   ├── portfolio.py           # Portfolio CRUD
│   │   │   ├── portfolio_analytics.py # Advanced analytics
│   │   │   ├── predictions.py         # AI predictions
│   │   │   ├── news.py                # Financial news
│   │   │   ├── coach.py               # AI chat assistant
│   │   │   ├── backtest.py            # Strategy simulation
│   │   │   ├── community.py           # Forum / social
│   │   │   ├── alerts.py              # Price & pattern alerts
│   │   │   └── notifications.py       # In-app notifications
│   │   ├── core/          # config.py, database.py, security.py
│   │   ├── models/        # SQLAlchemy ORM models
│   │   └── services/      # market_data.py (Yahoo Finance)
│   ├── requirements.txt
│   └── .env
├── web/                   # Next.js frontend (port 3000)
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Landing page
│       │   ├── auth/                  # Login / Register / Forgot
│       │   └── dashboard/             # 15 dashboard pages
│       │       ├── page.tsx           # Overview (heatmap, insights)
│       │       ├── markets/           # Stock tables + scanner
│       │       ├── stock/[symbol]/    # Stock detail page
│       │       ├── predictions/       # AI predictions
│       │       ├── news/              # News + sentiment
│       │       ├── coach/             # AI chatbot
│       │       ├── watchlist/         # Watchlists
│       │       ├── portfolio/         # Portfolio analytics
│       │       ├── backtest/          # Strategy lab
│       │       ├── community/         # Community forum
│       │       ├── learn/             # Learning hub
│       │       ├── settings/          # Preferences
│       │       └── upgrade/           # Subscription
│       └── lib/
│           ├── api.ts     # Centralized API client
│           └── tokens.ts  # Design tokens
└── infra/                 # Docker configs
```

## Phase Completion Status

### Phase 1: Auth & Landing — COMPLETE
- Landing page with hero, features, testimonials
- Login / Register / Forgot Password pages
- JWT authentication (access + refresh tokens)
- OTP verification endpoints

### Phase 2: Dashboard & Market Data — COMPLETE
- Live market overview (NIFTY, SENSEX, BANKNIFTY)
- Real-time stock quotes via Yahoo Finance
- WebSocket price streaming (`/market/ws/prices`)
- Watchlist CRUD + Portfolio CRUD with P&L
- Sector performance, stock search (Ctrl+K)
- Settings page (theme toggle)

### Phase 3: AI Engine — COMPLETE
- **Prediction Engine**: XGBoost classifier with 30+ technical indicators
- **Sentiment Engine**: Financial news NLP with Loughran-McDonald lexicon
- **AI Coach**: Google Gemini integration with financial-expert system prompt
- **Technical Scanner**: Pattern detection (Golden Cross, Death Cross, RSI, MACD, Bollinger, Volume)
- All pages connected with loading states, error handling, auto-refresh

### Phase 4: Strategy Lab & Community — COMPLETE
- Strategy simulation engine (SMA Crossover, RSI Mean Reversion, MACD Momentum)
- Visual simulation results with equity curves and trade logs
- Community forum with post sharing and backtest attachments

### Phase 5: Education & Alerts — COMPLETE
- Learning Hub with curated courses, lessons, and interactive quizzes
- Real-time Price & Pattern Alerts engine

### Phase 6: Advanced Trading Intelligence & Premium UX — COMPLETE
- Advanced Portfolio Analytics (SVG donut, risk score, CSV export)
- Real-time Notification Center (bell icon, unread badges, mark-read)
- Interactive Stock Detail Page (multi-timeframe chart, fundamentals, AI outlook)
- Dashboard Home Revamp (market heatmap, portfolio snapshot, AI Insight of the Day)

## Key Configuration
- **Backend port**: 8000 (uvicorn)
- **Frontend port**: 3000 (Next.js)
- **CORS Origins**: localhost:3000, localhost:3001, 127.0.0.1:3000, 127.0.0.1:3001
- **GEMINI_API_KEY**: Must be set in backend/.env for AI Coach (optional — fallback mode works without it)
- **Database**: SQLite at `backend/vedoraai.db`
- **Test credentials**: `test@test.com` / `password`

## Running the Project
```bash
# Backend
cd backend
.venv\Scripts\activate      # Windows
uvicorn app.main:app --reload --port 8000

# Frontend
cd web
npm run dev
```

## Known Issues / Gotchas
1. Emojis in `print()` cause `UnicodeEncodeError` on Windows consoles
2. Yahoo Finance API is rate-limited — prediction engine batches requests with delays
3. Gemini coach works in fallback mode if API key is not set
4. SQLAlchemy uses `UUID` and `JSON` types compatible with both SQLite and PostgreSQL
5. The `redis` module import in `core/redis.py` may fail if not installed — safe to ignore for SQLite dev setup
