# 🎯 Placement Guide — AI Career Coach

An AI-powered placement portal featuring **ATS Resume Scoring** and **AI Mock Interviews** powered by Google Gemini 2.5 Flash.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **ATS Resume Checker** | Upload your resume PDF + paste a job description → get an ATS score, matched/missing keywords, and improvement suggestions |
| 🎤 **AI Mock Interview** | Practice with a strict AI interviewer — 3 technical questions per round with evaluation and scoring |
| 🔑 **Gemini Key Rotation** | Round-robin across 3 API keys with automatic retry on rate limits |
| ⚡ **In-Memory Processing** | Resume PDFs are never saved to disk — parsed and scored entirely in RAM |
| 🚀 **Deploy-Ready** | Vercel (frontend) + Railway/Render (backend) |

---

## 📁 Project Structure

```
Placement_Guide_project/
├── backend/
│   ├── main.py                # FastAPI app entry point
│   ├── gemini_client.py       # Round-robin Gemini key rotator
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Environment variable template
│   ├── Procfile               # Railway/Render deployment
│   ├── railway.toml           # Railway config
│   ├── runtime.txt            # Python version
│   └── routers/
│       ├── test.py            # POST /api/test-gemini
│       ├── ats.py             # POST /api/ats/check-resume
│       └── interview.py       # POST /api/interview/chat-round
└── frontend/
    ├── src/app/
    │   ├── page.tsx           # Main page with tabs
    │   ├── layout.tsx         # Root layout + SEO
    │   ├── globals.css        # Design system
    │   └── components/
    │       ├── ATSChecker.tsx  # ATS Resume Checker UI
    │       └── MockInterview.tsx # Mock Interview UI
    ├── .env.local             # Local environment variables
    └── next.config.ts         # Next.js configuration
```

---

## 🚀 Getting Started

### Step 1 — Clone & Set Up Environment

```bash
git clone <your-repo-url>
cd Placement_Guide_project
```

### Step 2 — Backend Setup

```bash
cd backend

# Copy env template and add your API keys
cp .env.example .env
# Edit .env and fill in your 3 Gemini API keys

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

> API docs available at: **http://localhost:8000/docs**

### Step 3 — Frontend Setup

```bash
cd frontend

# Install dependencies (already done if you scaffolded)
npm install

# Start the dev server
npm run dev
```

> Frontend available at: **http://localhost:3000**

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
GEMINI_API_KEY_1=your_first_key
GEMINI_API_KEY_2=your_second_key
GEMINI_API_KEY_3=your_third_key

ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app
```

---

## 📡 API Reference

### `POST /api/test-gemini`
Test the Gemini key rotation.

```json
// Request
{ "prompt": "Hello, Gemini!" }

// Response
{ "response": "Hello! How can I help?", "status": "success" }
```

### `POST /api/ats/check-resume`
Score a resume against a job description.

```
Content-Type: multipart/form-data
Body:
  - resume: (PDF file)
  - job_description: (string)
```

```json
// Response
{
  "ats_score": 78.5,
  "keywords_matched": ["python", "fastapi", "rest api"],
  "keywords_missing": ["docker", "kubernetes"],
  "improvement_suggestions": ["Add Docker experience..."]
}
```

### `POST /api/interview/chat-round`
Conduct one round of mock interview.

```json
// Request (first round — leave user_answer empty)
{
  "job_role": "Backend Engineer",
  "user_answer": "",
  "chat_history": []
}

// Response
{
  "evaluation": "Welcome! Let's begin...",
  "score": 0,
  "next_questions": ["Q1?", "Q2?", "Q3?"],
  "round_number": 1
}
```

---

## 🌐 Deployment

### Backend → Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Set root directory to `backend/`
4. Add environment variables (GEMINI_API_KEY_1, _2, _3, ALLOWED_ORIGINS)
5. Railway auto-detects `Procfile` and deploys

### Frontend → Vercel

1. Import your repository on [Vercel](https://vercel.com)
2. Set root directory to `frontend/`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app`
4. Deploy

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, Uvicorn |
| AI | Google Gemini 2.5 Flash |
| PDF Parsing | pdfplumber |
| NLP Scoring | scikit-learn (TF-IDF + Cosine Similarity) |
| Frontend | Next.js 16, React 19 |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel + Railway |
