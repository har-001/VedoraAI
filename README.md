# VedoraAI

> **Intelligence Behind Every Decision**

AI-Powered Market Intelligence, Prediction, Research, Education & Decision-Support Platform built with Next.js and FastAPI.

---

## Features

### Market Intelligence
- **Live Market Data** — Real-time stock quotes via Yahoo Finance (NIFTY, SENSEX, BANKNIFTY)
- **Interactive Stock Detail Pages** — Multi-timeframe SVG charts, fundamentals grid, AI outlook
- **Market Heatmap** — Color-coded grid of top stocks by performance
- **Stock Search** — Instant search with `Ctrl+K` shortcut

### AI-Powered Analysis
- **Price Predictions** — XGBoost classifier with 30+ technical indicators (RSI, MACD, ADX, Bollinger, ATR)
- **Sentiment Analysis** — Financial news NLP scoring with Loughran-McDonald inspired lexicon
- **AI Coach** — Google Gemini-powered chat assistant with financial expertise
- **Technical Scanner** — Automated pattern detection (Golden Cross, Death Cross, RSI extremes, MACD crossover, Bollinger breakout, Volume surge)

### Portfolio & Watchlist
- **Portfolio Tracker** — CRUD with real-time P&L calculations
- **Advanced Analytics** — SVG donut allocation chart, risk metrics, sector concentration, CSV export
- **Watchlists** — Create and manage multiple watchlists with live price updates

### Strategy Lab
- **Backtesting Engine** — Simulate strategies (SMA Crossover, RSI Mean Reversion, MACD Momentum)
- **Equity Curves** — Visual simulation results with trade logs
- **Community Forum** — Share strategies and backtest results

### Education & Alerts
- **Learning Hub** — Curated courses with lessons and interactive quizzes
- **Price Alerts** — Real-time notifications when price targets or patterns trigger
- **Notification Center** — In-app bell with unread badges, mark-read, and clear actions

### Internationalization
- **Multi-language Support** — UI translations for 10+ languages
- **Currency Conversion** — Display prices in preferred currency

---

## Architecture

| Layer | Tech | Directory |
|-------|------|-----------|
| **Frontend** | Next.js 15 · React 19 · TypeScript | `web/` |
| **Backend** | Python · FastAPI · SQLAlchemy 2.0 | `backend/` |
| **Database** | SQLite (dev) / PostgreSQL (prod) | `backend/vedoraai.db` |
| **AI Engines** | XGBoost · NLP · Google Gemini | `backend/app/ai/` |
| **Market Data** | Yahoo Finance (yfinance) | `backend/app/services/` |

```
VedoraAI-1/
├── web/                          # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── auth/             # Login / Register / Forgot Password
│       │   └── dashboard/        # All dashboard pages
│       │       ├── page.tsx          # Overview (heatmap, AI insights)
│       │       ├── markets/          # Stock tables & scanner
│       │       ├── stock/[symbol]/   # Interactive stock detail
│       │       ├── predictions/      # AI predictions
│       │       ├── news/             # News & sentiment
│       │       ├── coach/            # AI chatbot
│       │       ├── watchlist/        # User watchlists
│       │       ├── portfolio/        # Portfolio analytics
│       │       ├── backtest/         # Strategy simulation
│       │       ├── community/        # Community forum
│       │       ├── learn/            # Learning hub
│       │       ├── settings/         # User preferences
│       │       └── upgrade/          # Subscription plans
│       └── lib/
│           ├── api.ts            # Centralized API client
│           └── tokens.ts         # Design tokens
├── backend/
│   ├── app/
│   │   ├── ai/                   # AI engines
│   │   │   ├── prediction/       # XGBoost price prediction
│   │   │   ├── sentiment/        # NLP sentiment scoring
│   │   │   ├── coach/            # Gemini AI assistant
│   │   │   └── scanner/          # Technical pattern detection
│   │   ├── api/v1/               # REST API routes (15 modules)
│   │   ├── core/                 # Config, database, security
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── services/             # Market data service
│   │   └── main.py               # FastAPI app factory
│   └── requirements.txt
└── infra/                        # Docker configs
```

---

## Quick Start

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Python 3.12+](https://python.org/)

### 1. Clone & Configure

```bash
git clone https://github.com/YOUR_USERNAME/VedoraAI-1.git
cd VedoraAI-1
cp .env.example backend/.env
# Edit backend/.env with your API keys
```

### 2. Start Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start Frontend

```bash
cd web
npm install
npm run dev
```

### 4. Open

| Service | URL |
|---------|-----|
| Website | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| API Health | http://localhost:8000/health |

### Default Test Credentials

```
Email:    test@test.com
Password: password
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Application secret key |
| `JWT_SECRET_KEY` | Yes | JWT signing key |
| `GEMINI_API_KEY` | No | Google Gemini API key (AI Coach feature) |
| `DATABASE_URL` | No | Defaults to SQLite (`vedoraai.db`) |

---

## API Endpoints

All endpoints are prefixed with `/api/v1/`.

| Group | Key Routes |
|-------|------------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| **Users** | `GET /users/me`, `PUT /users/me` |
| **Market** | `GET /market/quotes`, `GET /market/search`, `GET /market/scan` |
| **Stock Detail** | `GET /market/detail/{symbol}` |
| **Watchlists** | `GET/POST/DELETE /watchlists` |
| **Portfolios** | `GET/POST /portfolios`, `GET /portfolios/{id}/analytics` |
| **Predictions** | `POST /predictions/predict` |
| **News** | `GET /news` |
| **Coach** | `POST /coach/chat` |
| **Backtesting** | `POST /backtest/simulate` |
| **Community** | `GET/POST /community/posts` |
| **Alerts** | `GET/POST/DELETE /alerts` |
| **Notifications** | `GET /notifications`, `PUT /notifications/read` |

---

## Tech Stack Details

- **Frontend**: Next.js 15 App Router with vanilla CSS (custom design system)
- **Backend**: FastAPI with async SQLAlchemy 2.0 + aiosqlite
- **Auth**: JWT access + refresh tokens stored in localStorage
- **AI**: XGBoost for predictions, custom NLP for sentiment, Google Gemini for chat
- **Charts**: Pure SVG (no charting library dependencies)
- **Market Data**: Yahoo Finance via `yfinance` Python package

---

## Disclaimer

VedoraAI is an AI-powered market intelligence platform for **educational and research purposes only**. It does **NOT** execute trades, manage funds, or guarantee returns. All predictions are probabilistic estimates generated by machine learning models. Always do your own research before making investment decisions.

---

## License

Private & Proprietary
