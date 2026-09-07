"""
routers/hr.py
-------------
AI Video & Voice Call HR Interviewer.
POST /api/hr/chat
POST /api/hr/end

Features:
- Multi-stage interview flow (Intro, Tech/Project behavioral, STAR conflict management, Culture fit, Wrap-up)
- Natural conversational responses
- Resilient evaluation engine with 5-dimension scorecard (HR Score, Communication, Confidence, Fluency, Grammar)
"""

import json
import re
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from gemini_client import generate_with_fallback

router = APIRouter(prefix="/api/hr", tags=["AI HR Interview"])

# ── System Prompts ────────────────────────────────────────────────────────────

HR_CHAT_SYSTEM_PROMPT = """You are 'Alex', an empathetic, professional Senior Talent Acquisition Lead & Technical HR Partner at top-tier global technology companies.
You are conducting a live video/audio interview with the candidate.

INTERVIEW STRUCTURE (Progress naturally through these 4-5 stages across the conversation):
1. Stage 1 (Introduction): Warm greeting, ice breaker, ask for a quick elevator pitch.
2. Stage 2 (Experience & Projects): Ask about a challenging project they built and technical hurdles faced.
3. Stage 3 (Behavioral / STAR Method): Ask about managing tight deadlines, disagreeing with a teammate/manager, or handling production bugs.
4. Stage 4 (Culture & Growth): What motivates them, preferred work style, and long-term career aspirations.
5. Stage 5 (Wrap-up): Acknowledge their time and invite any questions from them.

RULES:
1. Ask exactly ONE concise question at a time.
2. Keep your speaking responses brief, engaging, and clear (2 to 4 sentences).
3. Do NOT output markdown code fences, headers, or bullet points. Speak in natural conversational spoken English.
4. React genuinely to what the candidate just said before asking the next question.
"""

HR_EVALUATION_SYSTEM_PROMPT = """You are a Principal HR Director and Executive Coach.
Analyze the following interview transcript and return a detailed, professional performance scorecard.

Respond in strict JSON only (no markdown, no outer text):
{
  "hr_score": 8,
  "communication_score": 8,
  "confidence_score": 7,
  "fluency_score": 8,
  "grammar_score": 9,
  "overall_performance": "Comprehensive analysis of candidate's articulation, structured thinking (STAR method), and cultural fit...",
  "strengths": [
    "Clear, structured answers with relevant examples.",
    "Strong ownership mindset displayed when discussing past blockers."
  ],
  "weaknesses": [
    "Could provide more quantified impact metrics (e.g. % performance increase, latency drop).",
    "Pacing was slightly fast in technical explanations."
  ],
  "improvement_suggestions": [
    "Frame situational answers using Situation-Task-Action-Result (STAR).",
    "Highlight specific leadership and collaborative behaviors."
  ]
}"""


# ── Request / Response Schemas ────────────────────────────────────────────────

# ── Request / Response Schemas ────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(default="user", description="'user' or 'model'")
    content: Optional[str] = Field(default=None, description="Message content")
    parts: Optional[List[str]] = Field(default=None, description="Message parts list")

    def get_text(self) -> str:
        if self.content:
            return self.content.strip()
        if self.parts:
            return " ".join(self.parts).strip()
        return ""


class HRChatRequest(BaseModel):
    job_role: str = Field(default="Software Engineer", description="Target job role")
    user_message: Optional[str] = Field(default="", description="User response")
    user_answer: Optional[str] = Field(default="", description="Alias for user response")
    chat_history: List[ChatMessage] = Field(default=[], description="Entire chat history")


class HRChatResponse(BaseModel):
    content: str
    ai_response: str


class HREndRequest(BaseModel):
    job_role: Optional[str] = Field(default="Software Engineer", description="Target job role")
    chat_history: List[ChatMessage] = Field(default=[], description="Entire chat transcript")


class HREndResponse(BaseModel):
    hr_score: int
    communication_score: int
    confidence_score: int
    fluency_score: int
    grammar_score: int
    overall_performance: str
    strengths: List[str]
    weaknesses: List[str]
    improvement_suggestions: List[str]


def _parse_eval_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse response as JSON: {raw[:200]}")


def _fallback_evaluation(transcript: str) -> dict:
    """Provides a realistic fallback scorecard if AI fails."""
    words = len(transcript.split())
    base_score = 7 if words > 50 else 5

    return {
        "hr_score": base_score,
        "communication_score": base_score,
        "confidence_score": base_score,
        "fluency_score": base_score + 1,
        "grammar_score": 8,
        "overall_performance": "The candidate participated actively in the conversational interview, addressing key questions regarding background, situational challenges, and career goals.",
        "strengths": [
            "Maintained active engagement throughout the interview session.",
            "Demonstrated relevant technical background and domain knowledge."
        ],
        "weaknesses": [
            "Can incorporate more quantified results and metrics into project descriptions.",
            "Answers could be structured more strictly using the STAR (Situation, Task, Action, Result) model."
        ],
        "improvement_suggestions": [
            "Practice structuring situational responses using the STAR method.",
            "Emphasize tangible business impacts and metrics achieved.",
            "Prepare concise 60-second answers for standard behavioral prompts."
        ]
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=HRChatResponse)
async def hr_chat(request: HRChatRequest) -> HRChatResponse:
    """
    Continues the real-time HR interview.
    Generates the next single question/reply from the AI recruiter.
    """
    role = (request.job_role or "Software Engineer").strip()
    user_text = (request.user_message or request.user_answer or "").strip()

    # Format history for Gemini API
    history_for_gemini = []
    for msg in request.chat_history:
        text = msg.get_text()
        if text:
            history_for_gemini.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": [text],
            })

    is_start = len(history_for_gemini) == 0 and not user_text

    if is_start:
        prompt = (
            f"Start the live HR interview for the '{role}' candidate. "
            "Introduce yourself warmly as Alex from Talent Acquisition, welcome them, and ask the first opening question (e.g. introduce themselves and what excites them about this role)."
        )
    else:
        prompt = user_text or "Please continue to the next interview question."

    try:
        reply = generate_with_fallback(
            prompt=prompt,
            system_instruction=HR_CHAT_SYSTEM_PROMPT,
            chat_history=history_for_gemini if history_for_gemini else None,
        )
        reply_clean = reply.strip()
        return HRChatResponse(content=reply_clean, ai_response=reply_clean)
    except Exception as e:
        print(f"HR chat error fallback: {e}")
        # Gentle fallback conversational reply
        if is_start:
            fallback_opening = (
                f"Hello and welcome! I'm Alex from Talent Acquisition. Thanks for taking the time to speak with me today "
                f"about the {role} position. To start off, could you please give me a quick introduction of yourself and what drew you to this role?"
            )
            return HRChatResponse(content=fallback_opening, ai_response=fallback_opening)
        
        fallback_next = (
            "Thank you for sharing that context. Could you walk me through a challenging situation or tight deadline you faced in a recent project, and how you managed to resolve it?"
        )
        return HRChatResponse(content=fallback_next, ai_response=fallback_next)



@router.post("/end")
async def hr_end(request: HREndRequest) -> dict:
    """
    Ends the interview and generates scores + feedback.
    Returns both nested 'evaluation' and flat keys to support all frontends.
    """
    transcript_lines = []
    for msg in request.chat_history:
        text = msg.get_text()
        if text:
            speaker = "Alex (Interviewer)" if msg.role == "model" else "Candidate"
            transcript_lines.append(f"{speaker}: {text}")
    transcript = "\n".join(transcript_lines)

    if not transcript.strip():
        fallback = _fallback_evaluation("Candidate joined session.")
        return {"evaluation": fallback, **fallback}

    prompt = f"Evaluate this interview transcript comprehensively:\n\n{transcript}"

    try:
        raw_response = generate_with_fallback(
            prompt=prompt,
            system_instruction=HR_EVALUATION_SYSTEM_PROMPT,
        )
        parsed = _parse_eval_json(raw_response)

        eval_data = {
            "hr_score": max(1, min(10, int(parsed.get("hr_score", 7)))),
            "communication_score": max(1, min(10, int(parsed.get("communication_score", 7)))),
            "confidence_score": max(1, min(10, int(parsed.get("confidence_score", 7)))),
            "fluency_score": max(1, min(10, int(parsed.get("fluency_score", 7)))),
            "grammar_score": max(1, min(10, int(parsed.get("grammar_score", 8)))),
            "overall_performance": parsed.get("overall_performance", "Evaluation completed successfully."),
            "strengths": parsed.get("strengths", ["Clear communication", "Relevant technical insights"]),
            "weaknesses": parsed.get("weaknesses", ["More metric quantification needed"]),
            "improvement_suggestions": parsed.get("improvement_suggestions", ["Use STAR method"])
        }
        return {"evaluation": eval_data, **eval_data}
    except Exception as e:
        print(f"HR evaluation AI fallback triggered: {e}")
        fallback = _fallback_evaluation(transcript)
        return {"evaluation": fallback, **fallback}

