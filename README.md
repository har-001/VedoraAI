# VedoraAI

> **Intelligence Behind Every Decision**

AI-Powered Market Intelligence, Prediction, Research, Education & Decision-Support Platform.

## 🏗️ Architecture

| Layer | Tech | Directory |
|-------|------|-----------|
| **Frontend** | Next.js 15 · React · TypeScript · Tailwind CSS | `web/` |
| **Backend** | Python · FastAPI · SQLAlchemy | `backend/` |
| **Mobile** | Flutter (Android + iOS) | `mobile/` |
| **Admin** | Next.js | `admin/` |
| **Infrastructure** | Docker · Kubernetes · AWS | `infra/` |
| **Database** | PostgreSQL 16 | — |
| **Cache** | Redis 7 | — |
| **Queue** | RabbitMQ | — |

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- [Python 3.12+](https://python.org/)

### 1. Clone & Configure

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start Infrastructure (PostgreSQL, Redis, RabbitMQ)

```bash
docker-compose -f infra/docker/docker-compose.dev.yml up -d postgres redis rabbitmq
```

### 3. Start Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Start Frontend

```bash
cd web
npm install
npm run dev
```

### 5. Open

- **Website:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **RabbitMQ UI:** http://localhost:15672 (vedora / vedora_secret)

## 📁 Project Structure

```
VedoraAI-1/
├── web/          → Next.js frontend
├── backend/      → FastAPI backend
├── mobile/       → Flutter mobile app
├── admin/        → Admin dashboard
├── infra/        → Docker, K8s, Terraform
├── docs/         → Documentation
└── .github/      → CI/CD workflows
```

## ⚠️ Disclaimer

VedoraAI is an AI-powered market intelligence platform. It does **NOT** execute trades,
manage funds, or guarantee returns. All predictions are probabilistic estimates for
educational and research purposes only. Always do your own research before making
investment decisions.

## 📄 License

Private & Proprietary
