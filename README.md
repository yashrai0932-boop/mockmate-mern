# 🎯 MockMate — AI-Powered Mock Interview Platform

<div align="center">

**Practice interviews with AI. Get instant feedback. Land your dream job.**

Built with Next.js 15 · FastAPI · NVIDIA NIM · TypeScript · TailwindCSS

</div>

---

## ✨ Features

- **🤖 AI-Powered Interviews** — Dynamic questions based on your resume, role, and previous answers
- **📄 Smart Resume Parsing** — Upload PDF/DOCX, AI extracts skills, projects, experience
- **🎭 5 AI Personalities** — Friendly Mentor, Strict FAANG, Startup Founder, Calm HR, Aggressive Tech
- **💬 ChatGPT-Style Interface** — Typing animations, streaming messages, instant feedback cards
- **📊 Instant Scoring** — Communication, Technical Depth, Relevance, Confidence after every answer
- **🎤 Voice Input** — Browser speech recognition with filler word detection
- **📈 Analytics Dashboard** — Score trends, weak topics, progress charts
- **📋 Final Reports** — Detailed scores, personalized roadmap, AI hiring recommendation
- **👔 Recruiter Mode** — Upload JD, match candidates, view interview summaries
- **🔐 JWT Authentication** — Signup/login with persistent sessions
- **🌙 Dark Mode** — Premium glassmorphism UI with animations

---

## 🏗️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, TypeScript, TailwindCSS, ShadCN UI, Framer Motion, Zustand, Recharts |
| **Backend** | FastAPI, Python, SQLAlchemy, SQLite, JWT Auth |
| **AI** | NVIDIA NIM API (meta/llama-3.1-70b-instruct) |
| **Embeddings** | ChromaDB |
| **Voice** | Browser SpeechRecognition API, Optional Whisper |

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **NVIDIA NIM API Key** — Get one free at [build.nvidia.com](https://build.nvidia.com)

### 1. Clone & Setup Environment

```bash
cd MockMate

# Copy environment file
cp .env.example backend/.env

# Edit backend/.env and add your NVIDIA NIM API key
```

### 2. Start Backend

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```

The API will be running at `http://localhost:8000`

### 3. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be running at `http://localhost:3000`

---

## 📁 Project Structure

```
MockMate/
├── backend/
│   ├── app/
│   │   ├── ai/                # NVIDIA NIM service, rate limiter, cache, prompts
│   │   ├── api/               # FastAPI route handlers
│   │   ├── database/          # SQLAlchemy connection & base
│   │   ├── models/            # Database models (User, Resume, Interview, etc.)
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic (interview, resume, report, etc.)
│   │   ├── utils/             # Dependencies, helpers
│   │   ├── config.py          # Settings from .env
│   │   └── main.py            # FastAPI app entry point
│   ├── uploads/               # Stored resume files
│   ├── .env                   # Environment variables
│   └── requirements.txt
│
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   └── dashboard/         # Protected dashboard pages
│   │       ├── page.tsx       # Main dashboard
│   │       ├── interview/     # Interview setup & chat
│   │       ├── report/        # Final report view
│   │       ├── analytics/     # Analytics dashboard
│   │       ├── resumes/       # Resume management
│   │       └── recruiter/     # Recruiter dashboard
│   ├── components/ui/         # ShadCN UI components
│   ├── services/              # API client & service layers
│   ├── store/                 # Zustand state stores
│   ├── types/                 # TypeScript type definitions
│   └── .env.local             # Frontend env vars
│
├── .env.example               # Environment template
└── README.md
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/resume/upload` | Upload & parse resume |
| GET | `/api/resume/list` | List resumes |
| GET | `/api/interview/personalities` | List AI personalities |
| POST | `/api/interview/start` | Start interview session |
| POST | `/api/interview/{id}/answer` | Submit answer, get feedback |
| POST | `/api/interview/{id}/complete` | End interview |
| GET | `/api/interview/history` | Interview history |
| GET | `/api/report/{session_id}` | Get/generate report |
| GET | `/api/analytics/dashboard` | Analytics data |
| POST | `/api/voice/transcribe` | Transcribe audio |
| POST | `/api/recruiter/job` | Create job posting |
| GET | `/api/recruiter/candidates/{id}` | Match candidates |

---

## ⚡ AI Optimization

The system is designed to minimize API calls while maximizing quality:

1. **Batch Question Generation** — Pre-generates 5 questions in ONE API call
2. **Single-Request Evaluation** — Each answer evaluation returns scores + feedback + next question in ONE call
3. **Context Compression** — Uses a 200-word candidate summary instead of full resume
4. **Response Caching** — LRU cache with 1-hour TTL for repeated queries
5. **Rate Limiting** — Token bucket algorithm staying under 35 RPM (free tier is 40 RPM)

**Budget per interview**: ~2 setup calls + 1 call per answer + 1 report = ~13 calls for 10 questions.

---

## 📄 License

MIT — Built for learning and interview preparation.
# Mockmate-mern
