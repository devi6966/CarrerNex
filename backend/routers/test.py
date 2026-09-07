"""
routers/test.py
----------------
Step 1 — Test endpoint to verify Gemini key rotation is working.
POST /api/test-gemini
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from gemini_client import generate_with_fallback

router = APIRouter(prefix="/api", tags=["Test"])


class PromptRequest(BaseModel):
    prompt: str


class GeminiResponse(BaseModel):
    response: str
    status: str = "success"


@router.post("/test-gemini", response_model=GeminiResponse)
async def test_gemini(request: PromptRequest) -> GeminiResponse:
    """
    Test endpoint that sends a prompt to Gemini and returns the response.
    Uses the active round-robin key rotation system.
    """
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    try:
        text = generate_with_fallback(prompt=request.prompt)
        return GeminiResponse(response=text)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
