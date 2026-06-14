# VedoraAI — Project Status Checkpoint
> Last updated: 2026-06-14
> Purpose: Quick reference for any AI agent to understand project state without re-analyzing everything.

---

## Project Overview
- **Name**: VedoraAI — "Intelligence Behind Every Decision"
- **Type**: AI Market Intelligence Platform (NOT a trading/execution platform)
- **Stack**: FastAPI (Python) backend + Next.js (React/TypeScript) frontend
- **Database**: SQLite (dev) via SQLAlchemy 2.0 + aiosqlite
- **Auth**: JWT tokens stored in localStorage (`vedora_token`)
- **Market Data**: Yahoo Finance (free API)

## Architecture

```
VedoraAI-1/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── ai/            # AI engines (Phase 3)
│   │   │   ├── prediction/engine.py   # XGBoost + technical indicators
│   │   │   ├── sentiment/engine.py    # Financial lexicon NLP
│   │   │   ├── coach/engine.py        # Gemini API integration
│   │   │   └── scanner/engine.py      # Technical pattern detection
│   │   ├── api/v1/        # REST API routes
│   │   │   ├── auth.py, users.py, market.py
│   │   │   ├── watchlist.py, portfolio.py
│   │   │   ├── predictions.py, news.py, coach.py  # Phase 3
│   │   ├── core/          # config.py, database.py, security.py
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── services/      # market_data.py (Yahoo Finance)
│   │   └── main.py        # FastAPI app factory
│   ├── .env               # Environment config
│   └── requirements.txt   # Python dependencies
├── web/                   # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── auth/      # Login/Register/Forgot pages
│       │   └── dashboard/ # All dashboard pages
│       │       ├── page.tsx          # Overview dashboard
│       │       ├── markets/          # Stock tables
│       │       ├── predictions/      # AI predictions (live)
│       │       ├── news/             # News + sentiment
│       │       ├── coach/            # AI chatbot (Gemini)
│       │       ├── watchlist/        # User watchlists
│       │       ├── portfolio/        # Portfolio tracker
│       │       ├── learn/            # Learning hub
│       │       └── settings/         # User preferences
│       └── lib/
│           ├── api.ts     # Centralized API client
│           └── tokens.ts  # Design tokens
└── infra/                 # Docker/deployment configs
```

## Phase Completion Status

### Phase 1: Auth & Landing ✅ COMPLETE
- Landing page with hero, features, testimonials
- Login/Register/Forgot password pages
- JWT authentication (access + refresh tokens)
- OTP verification endpoints

### Phase 2: Dashboard & Market Data ✅ COMPLETE
- Live market overview (NIFTY, SENSEX, BANKNIFTY)
- Real-time stock quotes via Yahoo Finance
- WebSocket price streaming (`/market/ws/prices`)
- Watchlist CRUD + Portfolio CRUD with P&L
- Sector performance, stock search (Ctrl+K)
- Settings page (theme toggle)

### Phase 3: AI Engine ✅ COMPLETE
- **Prediction Engine**: XGBoost classifier with 30+ technical indicators (RSI, MACD, ADX, Bollinger, ATR, etc.)
- **Sentiment Engine**: Financial news from RSS feeds + Yahoo Finance, scored with Loughran-McDonald inspired lexicon
- **AI Coach**: Google Gemini integration with financial-expert system prompt, fallback built-in knowledge base
- **Technical Scanner**: Pattern detection (Golden Cross, Death Cross, RSI extremes, MACD crossover, Bollinger breakout, Volume surge)
- **API Routes**: /predictions, /news, /coach/chat, /market/scan
- **Frontend**: All pages connected to live APIs with loading states, error handling, auto-refresh. Integrated AI Scanner tab on Markets page.


### Phase 4: PENDING
- Strategy backtester
- Learning hub content
- Community features
- Notifications system
- Mobile app (React Native)

## Key Configuration
- **Backend port**: 8000 (uvicorn)
- **Frontend port**: 3000 (Next.js)
- **CORS Origins**: localhost:3000, localhost:3001, 127.0.0.1:3000, 127.0.0.1:3001
- **GEMINI_API_KEY**: Must be set in backend/.env for AI Coach
- **Database**: SQLite at backend/vedoraai.db

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
3. Gemini coach works in fallback mode if API key is not set (responds to common topics)
4. SQLAlchemy uses `UUID` and `JSON` types compatible with both SQLite and PostgreSQL
