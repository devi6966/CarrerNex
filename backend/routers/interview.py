"""
routers/interview.py
---------------------
Large Placement Assessment & Technical Skill Quiz Generator.
POST /api/interview/generate-quiz

Supports:
- Large quiz counts (10, 20, 30 questions)
- Domain tracks (DSA, Full Stack, Backend, Cloud/DevOps, Database, Aptitude)
- Realistic timing parameters
- Zero-fail offline curated question fallback
"""

import json
import re
from typing import List, Dict, Optional, Any


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from gemini_client import generate_with_fallback

router = APIRouter(prefix="/api/interview", tags=["Placement Quizzes"])

import time

# ── In-Memory Fast Quiz Cache ────────────────────────────────────────────────
_QUIZ_CACHE: Dict[str, Any] = {}
CACHE_TTL_SECONDS = 1800  # 30 minutes

# ── System prompt ─────────────────────────────────────────────────────────────
LARGE_QUIZ_PROMPT = """You are an elite placement assessment architect for top tech companies (Google, Microsoft, Amazon, TCS, Infosys).
Generate a set of technical Multiple Choice Questions (MCQs) for the specified role, topic, difficulty, and question count.

RULES:
1. Output valid JSON only — no markdown backticks, no outer conversational text.
2. Maintain strict question quality:
   - Level-1: Conceptual, syntax correctness, core terminology, time complexities.
   - Level-2: Code snippet output analysis, debugging, design patterns, framework internals.
   - Level-3: Distributed systems, tricky memory/concurrency edge cases, complex algorithmic logic.
3. Each question must have EXACTLY 4 options (A, B, C, D) and a clear, educational explanation.
4. PERFORMANCE CRITICAL: Keep questions concise, options clear, and explanations strictly 1-2 brief sentences. Avoid verbose essays.

JSON SCHEMA:
{
  "questions": [
    {
      "id": 1,
      "topic": "Data Structures",
      "question": "What is the worst-case time complexity of searching in an unbalanced Binary Search Tree?",
      "options": [
        "A) O(log n)",
        "B) O(n)",
        "C) O(1)",
        "D) O(n log n)"
      ],
      "correct_answer": "B",
      "explanation": "In an unbalanced BST (skewed tree), the search degrades to linked-list traversal, resulting in O(n) worst-case time."
    }
  ]
}"""


class MCQQuestion(BaseModel):
    id: int
    topic: Optional[str] = "Technical"
    question: str
    options: List[str]
    correct_answer: str = Field(..., description="A, B, C, or D")
    explanation: str


class QuizRequest(BaseModel):
    job_role: str = Field(..., description="Target Job Role or Domain (e.g. 'Full Stack Developer', 'Data Structures')")
    difficulty: str = Field(default="Level-2", description="'Level-1', 'Level-2', or 'Level-3'")
    question_count: int = Field(default=10, description="10 (Quick), 20 (Placement Round), 30 (Full Mock)")
    topic_category: Optional[str] = Field(default="General Tech", description="Optional topic specialization")


class QuizResponse(BaseModel):
    job_role: str
    difficulty: str
    topic_category: str
    total_questions: int
    time_limit_minutes: int
    questions: List[MCQQuestion]


def _parse_gemini_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse response as JSON: {raw[:200]}")


# ── Offline Curated Fallback Bank ─────────────────────────────────────────────
CURATED_FALLBACK_BANK: List[Dict[str, Any]] = [
    {
        "id": 1,
        "topic": "Core Fundamentals",
        "question": "Which HTTP status code signifies that a resource has been permanently moved to a new URI?",
        "options": ["A) 301 Moved Permanently", "B) 302 Found", "C) 307 Temporary Redirect", "D) 404 Not Found"],
        "correct_answer": "A",
        "explanation": "301 indicates permanent redirection, passing SEO link equity to the new target URI."
    },
    {
        "id": 2,
        "topic": "Data Structures",
        "question": "Which data structure is fundamentally used to implement Breadth-First Search (BFS) on a graph?",
        "options": ["A) Stack", "B) Queue", "C) Priority Queue", "D) Doubly Linked List"],
        "correct_answer": "B",
        "explanation": "BFS explores vertices level-by-level in FIFO order, requiring a Queue data structure."
    },
    {
        "id": 3,
        "topic": "Databases & SQL",
        "question": "What is the primary difference between Clustered and Non-Clustered Indexes in relational databases?",
        "options": [
            "A) Clustered index physically alters table row storage order; non-clustered creates a separate lookup pointer table.",
            "B) A table can have multiple clustered indexes, but only one non-clustered index.",
            "C) Clustered index cannot be created on primary key columns.",
            "D) Non-clustered indexes are always faster for full table range scans."
        ],
        "correct_answer": "A",
        "explanation": "Clustered indexes dictate the physical sort order of data pages on disk, so only one can exist per table."
    },
    {
        "id": 4,
        "topic": "Backend & Concurrency",
        "question": "In Python, what is the primary limitation imposed by the Global Interpreter Lock (GIL)?",
        "options": [
            "A) Prevents multi-process parallel execution across CPU cores.",
            "B) Restricts execution of multiple native threads to one CPU core at a time for bytecode execution.",
            "C) Disables asynchronous I/O loops in asyncio.",
            "D) Automatically deletes idle variables from heap memory."
        ],
        "correct_answer": "B",
        "explanation": "The GIL ensures thread safety in CPython by allowing only one native thread to hold the interpreter lock at once."
    },
    {
        "id": 5,
        "topic": "System Design",
        "question": "Which caching strategy writes data directly to both cache and underlying database simultaneously before acknowledging completion?",
        "options": ["A) Cache-Aside", "B) Write-Through", "C) Write-Behind (Write-Back)", "D) Refresh-Ahead"],
        "correct_answer": "B",
        "explanation": "Write-Through updates cache and database synchronously, ensuring strong cache consistency at write time."
    },
    {
        "id": 6,
        "topic": "JavaScript & Web",
        "question": "What will `console.log(typeof null)` output in standard JavaScript?",
        "options": ["A) 'null'", "B) 'object'", "C) 'undefined'", "D) 'number'"],
        "correct_answer": "B",
        "explanation": "In JavaScript, `typeof null === 'object'` is a legacy historical artifact from the original JS type tagging implementation."
    },
    {
        "id": 7,
        "topic": "Algorithms",
        "question": "What is the average and worst-case time complexity of QuickSort?",
        "options": [
            "A) Average: O(n log n), Worst-case: O(n^2)",
            "B) Average: O(n log n), Worst-case: O(n log n)",
            "C) Average: O(n), Worst-case: O(n log n)",
            "D) Average: O(n^2), Worst-case: O(n^2)"
        ],
        "correct_answer": "A",
        "explanation": "When pivot selection partitions unevenly (e.g. already sorted array with naive pivot), QuickSort degrades to O(n^2)."
    },
    {
        "id": 8,
        "topic": "DevOps & Cloud",
        "question": "What does a Docker image layer represent?",
        "options": [
            "A) A read-only filesystem diff created by an instruction in the Dockerfile.",
            "B) A separate running virtual kernel process instance.",
            "C) A transient swap partition for container RAM.",
            "D) A network routing table for container bridge networking."
        ],
        "correct_answer": "A",
        "explanation": "Each Dockerfile command generates an immutable read-only layer using union filesystems (Overlay2)."
    },
    {
        "id": 9,
        "topic": "Web Security",
        "question": "How does a Cross-Site Request Forgery (CSRF) token protect an application?",
        "options": [
            "A) Encrypts HTTPS payload traffic against MITM sniffing.",
            "B) Ensures state-changing requests contain an unpredictable server-generated secret that third-party sites cannot read or forge.",
            "C) Hashes candidate passwords using BCrypt.",
            "D) Sanitizes HTML tags against reflected XSS script injection."
        ],
        "correct_answer": "B",
        "explanation": "CSRF tokens validate request origin authenticity because cross-origin attackers cannot read the same-origin token."
    },
    {
        "id": 10,
        "topic": "Logical Aptitude",
        "question": "A pipeline processes 120 jobs in 4 hours using 3 parallel workers. How many hours will 6 parallel workers take to process 360 jobs at the same rate?",
        "options": ["A) 6 Hours", "B) 8 Hours", "C) 12 Hours", "D) 4 Hours"],
        "correct_answer": "A",
        "explanation": "3 workers do 120 jobs in 4h -> 1 worker does 10 jobs/hour. 6 workers do 60 jobs/hour. 360 jobs / 60 jobs/hour = 6 hours."
    }
]


def _build_fallback_quiz(job_role: str, difficulty: str, count: int, topic: str) -> List[MCQQuestion]:
    """Expands fallback bank to required question count."""
    questions: List[MCQQuestion] = []
    for i in range(count):
        base = CURATED_FALLBACK_BANK[i % len(CURATED_FALLBACK_BANK)]
        q_topic = str(base.get("topic", topic))
        raw_q = str(base.get("question", ""))
        q_text = f"[{job_role}] {raw_q}" if i >= len(CURATED_FALLBACK_BANK) else raw_q
        q_options = [str(opt) for opt in base.get("options", [])]
        q_correct = str(base.get("correct_answer", "A"))
        q_expl = str(base.get("explanation", ""))

        questions.append(
            MCQQuestion(
                id=i + 1,
                topic=q_topic,
                question=q_text,
                options=q_options,
                correct_answer=q_correct,
                explanation=q_expl
            )
        )
    return questions



# ── Endpoint ──────────────────────────────────────────────────────────────────
@router.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest) -> QuizResponse:
    """
    Generates placement assessment MCQs (10, 20, 30 questions) with topic categories,
    difficulty level tuning, and automatic fallback.
    """
    job_role = request.job_role.strip()
    if not job_role:
        raise HTTPException(status_code=400, detail="Job role or assessment topic cannot be empty.")

    difficulty = request.difficulty.strip()
    if difficulty not in ("Level-1", "Level-2", "Level-3"):
        raise HTTPException(status_code=400, detail="Difficulty must be 'Level-1', 'Level-2', or 'Level-3'.")

    # Clamp question count between 5 and 30
    count = max(5, min(30, request.question_count))
    topic = request.topic_category or "Technical Concepts"
    time_limit = count  # 1 minute per question default

    cache_key = f"{job_role.lower()}_{difficulty}_{count}_{topic.lower()}"
    now = time.time()
    if cache_key in _QUIZ_CACHE:
        cached_time, cached_res = _QUIZ_CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            return cached_res

    prompt = (
        f"Generate EXACTLY {count} challenging technical Multiple Choice Questions (MCQs) "
        f"for a '{job_role}' placement assessment. Specialization Topic: '{topic}', Difficulty: '{difficulty}'."
    )

    try:
        raw_response = generate_with_fallback(prompt, system_instruction=LARGE_QUIZ_PROMPT)
        parsed = _parse_gemini_json(raw_response)
        q_list = parsed.get("questions", [])

        if len(q_list) < (count // 2):
            raise ValueError("Returned too few questions from AI model.")

        formatted_questions: List[MCQQuestion] = []
        for idx, q in enumerate(q_list[:count]):
            q_id = idx + 1
            q_text = str(q.get("question", f"Question {q_id} text"))
            q_topic = str(q.get("topic", topic))
            q_opts = list(q.get("options", []))

            # Guarantee 4 options
            while len(q_opts) < 4:
                q_opts.append(f"{chr(65 + len(q_opts))}) Option placeholder")

            q_correct = str(q.get("correct_answer", "A")).upper().strip(" )")
            if q_correct not in ("A", "B", "C", "D"):
                q_correct = "A"

            q_expl = str(q.get("explanation", "Standard technical logic explanation."))

            formatted_questions.append(
                MCQQuestion(
                    id=q_id,
                    topic=q_topic,
                    question=q_text,
                    options=q_opts[:4],
                    correct_answer=q_correct,
                    explanation=q_expl
                )
            )

        # Pad with fallback if slightly less than requested count
        if len(formatted_questions) < count:
            fallbacks = _build_fallback_quiz(job_role, difficulty, count, topic)
            while len(formatted_questions) < count:
                missing_idx = len(formatted_questions)
                fb = fallbacks[missing_idx]
                fb.id = missing_idx + 1
                formatted_questions.append(fb)

        result = QuizResponse(
            job_role=job_role,
            difficulty=difficulty,
            topic_category=topic,
            total_questions=len(formatted_questions),
            time_limit_minutes=time_limit,
            questions=formatted_questions
        )
        _QUIZ_CACHE[cache_key] = (now, result)
        return result

    except Exception as e:
        print(f"Quiz generation AI fallback triggered: {e}")
        fallback_questions = _build_fallback_quiz(job_role, difficulty, count, topic)
        return QuizResponse(
            job_role=job_role,
            difficulty=difficulty,
            topic_category=topic,
            total_questions=len(fallback_questions),
            time_limit_minutes=time_limit,
            questions=fallback_questions
        )

