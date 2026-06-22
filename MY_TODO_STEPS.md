# VedoraAI — Aapke liye Tasks aur Guide (Hinglish)

Yeh file aapko guide karegi ki aapko ab kya karna hai, local machine par project kaise chalana hai, aur deployment kaise karni hai.

---

## 🔑 1. Kahan Kya Milega? (Resources & Links)

### Source Code Location:
- **GitHub Repository**: [https://github.com/har-001/VedoraAI](https://github.com/har-001/VedoraAI)
- **Local Workspace Path**: `c:\Users\harsh_2pgm3oe\OneDrive\Documents\Coding\Project\Trading Platform\VedoraAI-1`

### Default Login Credentials (For Testing):
- **Email**: `test@test.com`
- **Password**: `password`
- *(Aap platform register page se nayi IDs bhi bana sakte hain)*

---

## 💻 2. Local Machine Par Project Kaise Chalayein? (Step-by-Step)

Project chalane ke liye 2 terminal tabs open karein:

### Step A: Backend Start Karein
1. Terminal open karein aur backend directory mein jayein:
   ```bash
   cd "c:\Users\harsh_2pgm3oe\OneDrive\Documents\Coding\Project\Trading Platform\VedoraAI-1\backend"
   ```
2. Virtual environment activate karein:
   ```bash
   .venv\Scripts\activate
   ```
3. Backend server run karein:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *Ab aapka Backend server [http://localhost:8000](http://localhost:8000) par chalu ho jayega.*
   *Backend interactive API documentation dekhne ke liye check karein: [http://localhost:8000/docs](http://localhost:8000/docs)*

---

### Step B: Frontend Start Karein
1. Naya Terminal window open karein aur frontend directory mein jayein:
   ```bash
   cd "c:\Users\harsh_2pgm3oe\OneDrive\Documents\Coding\Project\Trading Platform\VedoraAI-1\web"
   ```
2. Next.js dev server run karein:
   ```bash
   npm run dev
   ```
   *Ab aapki website [http://localhost:3000](http://localhost:3000) par chalne lagegi.*
   *Browser mein ye URL open karke design check karein.*

---

## 🤖 3. AI Coach Kaise Active Karein? (Gemini Setup)

AI Coach ke chat feature ko complete response calculate karne ke liye Google Gemini API Key ki zaroorat hoti hai.

1. **Free Key Banayein**: Google AI Studio par jayein: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Apne Google account se sign in karein aur **"Create API Key"** button par click karke key copy karein.
3. **Key Config Karein**: Apne project folder ke backend folder mein jayein.
4. `.env` file ko open karein aur is line par apni key copy paste karein:
   ```env
   GEMINI_API_KEY=yahan_apni_gemini_key_daalein
   ```
5. File ko Save karein aur backend restart karein. AI Coach active ho jayega!

---

## 🌐 4. Public Web Par Live Kaise Karein? (Public Deployment)

Agar aap chahte hain ki is website ko koi bhi online open kar sake, toh aap in methods ka use kar sakte hain:

### Method A: Vercel (Frontend) + Railway (Backend) — *Sabse Easy*

#### 1. Frontend Deploy (Vercel):
- [Vercel](https://vercel.com) par free register karein (apne GitHub se link karein).
- "New Project" select karein aur repository `VedoraAI` choose karein.
- **Root Directory** settings mein `web` configure karein.
- **Environment Variables** section mein add karein:
  - `NEXT_PUBLIC_API_URL` = (Aapke backend server ka link)
- Deploy par click karein! Vercel aapko ek free website URL (jaise `vedoraai.vercel.app`) de dega.

#### 2. Backend Deploy (Railway):
- [Railway](https://railway.app) par account banayein (GitHub se join karein).
- "New Service" choose karein → Deploy from GitHub → `VedoraAI` repo select karein.
- **Root Directory**: `backend` configure karein.
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set variables (copy from `.env.example` file).
- Deploy par click karein. Railway aapko ek active API URL dega (e.g. `your-backend.up.railway.app`), jise aap upar Vercel ke environment variables mein save karenge.

---

### Method B: VPS Deploy (Docker Compose) — *Professional Control*

Humne complete production setup configurations ready ki hain:
- `web/Dockerfile` Next.js frontend code compile karta hai.
- `backend/Dockerfile` python FastAPI resources deploy karta hai.
- `infra/docker/docker-compose.prod.yml` auto PostgreSQL database container initiate karta hai.

Agar aapke paas server (DigitalOcean droplet / AWS instance) hai:
1. Docker aur Docker Compose install karein.
2. Code clone karein: `git clone https://github.com/har-001/VedoraAI.git`
3. Production command trigger karein:
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml up -d --build
   ```
   Dono apps automatically launch ho jayengi.
