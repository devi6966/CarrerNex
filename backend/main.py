"""
main.py
--------
AI-Powered Placement Portal — FastAPI Backend

Endpoints:
  POST /api/test-gemini          → Step 1: Test Gemini key rotation
  POST /api/ats/check-resume     → Step 2: ATS Resume Checker
  POST /api/interview/chat-round → Step 3: AI Mock Interview
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import ats, hr, interview, test, roadmap, payment

# ── Load environment ──────────────────────────────────────────────────────────
load_dotenv()

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Placement Portal API",
    description=(
        "Backend for an AI-powered placement guide featuring "
        "ATS Resume Checking and AI Mock Interviews powered by Google Gemini 2.5 Flash."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
allowed_origins: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ──────────────────────────────────────────────────────────
app.include_router(test.router)
app.include_router(ats.router)
app.include_router(interview.router)
app.include_router(hr.router)
app.include_router(roadmap.router)
app.include_router(payment.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root() -> dict:
    """Health check endpoint."""
    return {
        "status": "online",
        "message": "AI Placement Portal API is running.",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health() -> dict:
    """Detailed health check."""
    return {"status": "healthy", "version": "1.0.0"}
