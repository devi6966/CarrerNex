"""
routers/ats.py
---------------
Advanced Multi-Dimensional NLP-Powered ATS Resume Checker.
POST /api/ats/check-resume

Performs comprehensive evaluations:
1. Layout & Font Compatibility Check (tables, multi-columns, font subset analysis).
2. Section Completeness Audit (Contact, Experience, Education, Skills, Projects, Certifications).
3. Sentence-BERT + Synonym + Stemming Semantic Keyword Matching.
4. Action Verbs & Quantifiable Impact Analysis.
5. Gemini-Powered Tailored Bullet Rewrites & Top 3 Priority Fixes.
"""

import io
import os
import re
import json
from typing import Annotated, List, Dict, Set, Tuple, Optional

import pdfplumber
import spacy
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from gemini_client import generate_with_fallback

router = APIRouter(prefix="/api/ats", tags=["ATS Resume Checker"])

# ── Load NLP Models with safe fallbacks ───────────────────────────────────────
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = spacy.blank("en")
    if "sentencizer" not in nlp.pipe_names:
        nlp.add_pipe("sentencizer")

# Safe sentence embedding model
try:
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    embedder = None



# ── Dictionaries & Rules ──────────────────────────────────────────────────────
STANDARD_SECTIONS = {
    "contact": ["contact", "email", "phone", "linkedin", "github", "portfolio", "address"],
    "experience": ["experience", "work history", "employment", "professional history", "work experience", "employment history", "career history", "history"],
    "education": ["education", "academic history", "qualification", "qualifications", "education history", "academic background", "academic"],
    "skills": ["skills", "technical skills", "skills & expertise", "core competencies", "competencies", "key skills", "expertise", "technologies"],
    "projects": ["projects", "personal projects", "academic projects", "key projects", "technical projects"],
    "certifications": ["certifications", "licenses", "certificates", "credentials", "professional certifications", "awards", "achievements"]
}

SYNONYM_MAP = {
    "ml": ["machine learning", "deep learning", "neural networks"],
    "machine learning": ["ml", "deep learning"],
    "ai": ["artificial intelligence", "genai", "generative ai"],
    "artificial intelligence": ["ai", "genai"],
    "aws": ["amazon web services", "cloud"],
    "amazon web services": ["aws"],
    "gcp": ["google cloud", "google cloud platform"],
    "azure": ["microsoft azure"],
    "sql": ["database", "relational database", "mysql", "postgresql"],
    "js": ["javascript", "react", "node"],
    "ts": ["typescript"],
    "nlp": ["natural language processing", "text processing"],
    "ci/cd": ["continuous integration", "jenkins", "github actions", "gitlab", "devops"],
    "qa": ["testing", "quality assurance", "test automation"],
    "swe": ["software engineer", "software developer", "coder"],
    "api": ["rest api", "graphql", "fastapi", "endpoints", "backend"],
    "dsa": ["data structures", "algorithms", "problem solving", "leetcode"],
}

STANDARD_FONTS = {"arial", "times", "calibri", "garamond", "helvetica", "georgia", "cambria", "lato", "roboto", "optima", "serif", "sans", "geist", "dejavu"}

STRONG_ACTION_VERBS = {
    "spearheaded", "engineered", "architected", "developed", "deployed",
    "optimized", "accelerated", "implemented", "orchestrated", "automated",
    "designed", "reduced", "scaled", "boosted", "built", "mentored", "revamped"
}

VAGUE_WORDS = {"various", "multiple", "some", "approximately", "assisted", "helped", "responsible for", "etc", "etc.", "handled", "participated", "worked on"}

GENERIC_STOP_WORDS = {
    "the", "and", "for", "with", "that", "this", "from", "are", "was",
    "have", "will", "your", "our", "you", "can", "all", "any", "more",
    "also", "such", "each", "been", "not", "but", "into", "than",
    "they", "their", "its", "who", "what", "how", "use", "used",
    "using", "work", "working", "experience", "skills", "ability",
    "strong", "good", "knowledge", "understanding", "familiar", "role",
    "team", "company", "candidate", "responsibilities"
}

# ── Role JD Cache ────────────────────────────────────────────────────────────
_ROLE_JD_CACHE: Dict[str, str] = {}

REVIEW_SYSTEM_PROMPT = """You are an elite recruitment architect and ATS optimization engine.
Analyze candidate resume text against target job requirements and return STRICT valid JSON only.
PERFORMANCE RULE: Keep improvements and fixes punchy and concise (maximum 3 suggestions, 3 fixes, 2 bullet rewrites). Do not write essays.

JSON SCHEMA:
{
  "ats_score": 82.5, // float 0-100 reflecting overall alignment
  "improvement_suggestions": [
    "Add measurable percentage or user metrics to project descriptions.",
    "Explicitly mention required framework X."
  ],
  "top_three_fixes": [
    "Fix #1: Include cloud deployment technologies.",
    "Fix #2: Replace weak verbs with strong action verbs.",
    "Fix #3: Add standard Skills header."
  ],
  "suggested_bullet_rewrites": [
    {
      "original": "Worked on web application development using React.",
      "improved": "Architected high-performance React web application, reducing page load time by 35% across 50K+ users."
    }
  ]
}"""


def _parse_gemini_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse response as JSON: {raw[:200]}")


# ── Response Schema ───────────────────────────────────────────────────────────
class BulletRewrite(BaseModel):
    original: str
    improved: str


class ATSResponse(BaseModel):
    ats_score: float
    formatting_score: float
    keyword_score: float
    section_score: float
    impact_score: float

    # Section Analysis
    section_breakdown: Dict[str, bool]

    # Keyword analysis
    keywords_matched: List[str]
    keywords_partially_matched: List[str]
    keywords_missing: List[str]

    # Structural issues
    formatting_issues: List[str]
    vague_language_issues: List[str]

    # NLP suggestions
    improvement_suggestions: List[str]
    top_three_fixes: List[str]
    suggested_bullet_rewrites: List[BulletRewrite] = []
    generated_jd: Optional[str] = None


# ── Helper: PDF Parsers & Layout ──────────────────────────────────────────────
def _check_pdf_formatting(file_bytes: bytes) -> Tuple[str, List[str], float]:
    """Extracts text and performs structural checks on the PDF layout."""
    text_parts: List[str] = []
    formatting_issues: List[str] = []
    has_tables = False
    has_multi_column = False
    fonts_found: Set[str] = set()

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page_index, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

            # 1. Table Detection
            if len(page.find_tables()) > 0:
                has_tables = True

            # 2. Font subsets
            for char in page.chars:
                fontname = char.get("fontname")
                if fontname:
                    fonts_found.add(fontname)

            # 3. Multi-Column Detection
            words = page.extract_words()
            lines: Dict[int, List[dict]] = {}
            for w in words:
                top = round(w["top"], 1)
                found = False
                for t in lines:
                    if abs(t - top) < 3:
                        lines[t].append(w)
                        found = True
                        break
                if not found:
                    lines[top] = [w]

            for line_words in lines.values():
                if len(line_words) > 2:
                    line_words.sort(key=lambda x: x["x0"])
                    for i in range(len(line_words) - 1):
                        gap = line_words[i+1]["x0"] - line_words[i]["x1"]
                        if gap > 140:
                            has_multi_column = True
                            break

    if has_tables:
        formatting_issues.append("Detected tables inside resume structure (ATS parsers may miss cell contents).")
    if has_multi_column:
        formatting_issues.append("Detected multi-column text layout (often parsed out of order by legacy ATS).")

    unprofessional_fonts = []
    for f in fonts_found:
        name = f.lower()
        clean_name = re.sub(r"^[a-z0-9\+]+", "", name)
        clean_name = re.sub(r"[^a-z]", "", clean_name)
        if not any(sf in clean_name for sf in STANDARD_FONTS) and len(clean_name) > 2:
            unprofessional_fonts.append(f)

    if unprofessional_fonts:
        formatting_issues.append(f"Contains non-standard fonts: {', '.join(list(set(unprofessional_fonts))[:3])}.")

    formatting_deductions = len(formatting_issues) * 12
    formatting_score = max(45.0, 100.0 - formatting_deductions)

    return "\n".join(text_parts), formatting_issues, formatting_score


# ── Helper: Section Audit ─────────────────────────────────────────────────────
def _validate_sections(text: str) -> Tuple[Dict[str, bool], List[str], float]:
    """Audits core sections and contact information."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    text_lower = text.lower()

    breakdown: Dict[str, bool] = {
        "contact": False,
        "experience": False,
        "education": False,
        "skills": False,
        "projects": False,
        "certifications": False
    }

    # Contact check (email, phone, linkedin)
    if re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text) or re.search(r"\b\d{10}\b|\b\d{3}[-\.\s]\d{3}[-\.\s]\d{4}\b", text):
        breakdown["contact"] = True

    # Scan headings
    for line in lines:
        line_lower = line.lower().strip(":-#*• ")
        for sec_name, keywords in STANDARD_SECTIONS.items():
            if sec_name == "contact":
                continue
            for kw in keywords:
                if kw in line_lower and len(line_lower) < 40:
                    breakdown[sec_name] = True
                    break

    # Also fallback check content keywords
    if not breakdown["skills"] and ("programming" in text_lower or "technologies" in text_lower or "tools" in text_lower):
        breakdown["skills"] = True
    if not breakdown["projects"] and ("project" in text_lower or "built" in text_lower or "application" in text_lower):
        breakdown["projects"] = True

    missing_warnings = []
    if not breakdown["contact"]:
        missing_warnings.append("Missing clear email or phone number in contact header.")
    if not breakdown["experience"]:
        missing_warnings.append("Missing dedicated 'Experience / Work History' section.")
    if not breakdown["education"]:
        missing_warnings.append("Missing dedicated 'Education' section.")
    if not breakdown["skills"]:
        missing_warnings.append("Missing dedicated 'Skills / Technical Expertise' section.")

    present_count = sum(1 for v in breakdown.values() if v)
    section_score = round((present_count / len(breakdown)) * 100.0, 2)

    return breakdown, missing_warnings, section_score


# ── Helper: Impact & Action Verbs ─────────────────────────────────────────────
def _analyze_action_impact(text: str) -> Tuple[float, List[str], List[str]]:
    """Calculates action verbs and quantifiable metric score."""
    words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
    found_action_verbs = set(words).intersection(STRONG_ACTION_VERBS)
    
    # Quantifiable metrics (percentages, numbers with +, dollars, metrics)
    metrics_found = re.findall(r"\b\d+%\b|\b\d+\+\b|\$\d+|\b\d+x\b|\b\d+k\b|\b\d+ms\b", text.lower())

    vague_phrases = []
    for w in words:
        if w in VAGUE_WORDS:
            vague_phrases.append(f"Vague filler word '{w}' used (replace with specific metrics or active verbs).")

    # Personal pronouns check
    pronouns = re.findall(r"\b(i|me|my|we|our)\b", text.lower())
    if pronouns:
        vague_phrases.append(f"Found personal pronouns ('{pronouns[0]}') — resumes should use action-first phrasing.")

    # Calculate impact score
    verb_points = min(50.0, len(found_action_verbs) * 10.0)
    metric_points = min(50.0, len(metrics_found) * 12.5)
    impact_score = round(max(30.0, verb_points + metric_points), 2)

    return impact_score, list(set(vague_phrases))[:5], list(found_action_verbs)


# ── Helper: Semantic Keyword Matcher ──────────────────────────────────────────
def _extract_jd_skills(jd_text: str) -> List[str]:
    """Extracts high-value skill terms and requirements from JD text."""
    jd_doc = nlp(jd_text)

    words = [t.text.strip().lower() for t in jd_doc if t.is_alpha and not t.is_stop]
    clean_words = [w for w in words if w not in GENERIC_STOP_WORDS and len(w) > 2]

    if len(clean_words) <= 6:
        return sorted(list(set(clean_words)))

    keywords: Set[str] = set()
    if hasattr(jd_doc, "noun_chunks"):
        try:
            for chunk in jd_doc.noun_chunks:
                text = chunk.text.strip().lower()
                cleaned_words = [w for w in text.split() if w not in GENERIC_STOP_WORDS and not w.isdigit()]
                if cleaned_words:
                    keywords.add(" ".join(cleaned_words))
        except Exception:
            pass

    for token in jd_doc:
        if token.pos_ in {"PROPN", "NOUN"} if hasattr(token, "pos_") else True:
            val = token.text.lower().strip()
            if len(val) > 2 and val not in GENERIC_STOP_WORDS:
                keywords.add(val)

    return sorted(list(keywords))[:25]


def _compute_semantic_matching(resume_text: str, jd_skills: List[str]) -> Tuple[List[str], List[str], List[str], float]:
    """Hybrid (exact + synonym + stem + S-BERT) skill alignment."""
    if not jd_skills:
        return [], [], [], 0.0

    resume_text_lower = resume_text.lower()
    resume_words = set(re.findall(r"\b\w+\b", resume_text_lower))

    resume_sentences = [l.strip() for l in resume_text.split("\n") if len(l.strip()) > 8]

    jd_embeddings = None
    resume_embeddings = None
    if embedder is not None and resume_sentences:
        try:
            jd_embeddings = embedder.encode(jd_skills)
            resume_embeddings = embedder.encode(resume_sentences)
        except Exception:
            jd_embeddings = None

    matched = []
    partially_matched = []
    missing = []

    for idx, skill in enumerate(jd_skills):
        skill_clean = skill.strip().lower()

        # 1. Exact regex match
        if re.search(rf"\b{re.escape(skill_clean)}\b", resume_text_lower):
            matched.append(skill)
            continue

        # 2. Synonym map match
        has_synonym = False
        if skill_clean in SYNONYM_MAP:
            for syn in SYNONYM_MAP[skill_clean]:
                if re.search(rf"\b{re.escape(syn)}\b", resume_text_lower):
                    matched.append(skill)
                    has_synonym = True
                    break
        if has_synonym:
            continue

        # Reverse synonym match
        for std, syns in SYNONYM_MAP.items():
            if skill_clean == std or skill_clean in syns:
                if any(re.search(rf"\b{re.escape(opt)}\b", resume_text_lower) for opt in [std] + syns):
                    matched.append(skill)
                    has_synonym = True
                    break
        if has_synonym:
            continue

        # 3. Stem matching (developer / developed / development)
        if len(skill_clean) >= 4:
            stem = skill_clean[:4]
            if any(w.startswith(stem) for w in resume_words if len(w) >= 4):
                matched.append(skill)
                continue

        # 4. S-BERT cosine similarity
        if jd_embeddings is not None and resume_embeddings is not None:
            skill_emb = jd_embeddings[idx]
            similarities = np.dot(resume_embeddings, skill_emb) / (
                np.linalg.norm(resume_embeddings, axis=1) * np.linalg.norm(skill_emb) + 1e-9
            )
            max_sim = float(np.max(similarities))
            if max_sim >= 0.50:
                matched.append(skill)
            elif max_sim >= 0.35:
                partially_matched.append(skill)
            else:
                missing.append(skill)
        else:
            missing.append(skill)

    keyword_score = ((len(matched) * 1.0 + len(partially_matched) * 0.5) / len(jd_skills)) * 100.0
    return matched, partially_matched, missing, round(keyword_score, 2)


# ── Endpoint ──────────────────────────────────────────────────────────────────
@router.post("/check-resume", response_model=ATSResponse)
async def check_resume(
    resume: Annotated[UploadFile, File(description="Resume PDF file")],
    job_description: Annotated[Optional[str], Form(description="Job description text")] = None,
    job_role: Annotated[Optional[str], Form(description="Job role text")] = None,
) -> ATSResponse:
    """
    Evaluates resume PDF against target criteria with full section breakdown,
    action verb scores, semantic keyword gap analysis, and tailored AI rewrites.
    """
    if not job_description and not job_role:
        raise HTTPException(status_code=400, detail="Either job_description or job_role must be provided.")

    if resume.content_type not in ("application/pdf", "application/octet-stream"):
        if not (resume.filename or "").lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted for the resume.")

    # Auto-generate JD if role provided
    generated_jd_text = None
    if job_role and (not job_description or not job_description.strip()):
        role_key = job_role.strip().lower()
        if role_key in _ROLE_JD_CACHE:
            generated_jd_text = _ROLE_JD_CACHE[role_key]
            job_description = generated_jd_text
        else:
            prompt = f"Generate a concise 5-bullet job requirement for: '{job_role}'. Focus strictly on required technical skills, frameworks, and tools. Under 100 words. Return ONLY the JD text."
            try:
                generated_jd_text = generate_with_fallback(prompt, system_instruction="You are a professional HR recruiter.")
                _ROLE_JD_CACHE[role_key] = generated_jd_text
                job_description = generated_jd_text
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"Failed to generate JD for role '{job_role}': {e}")

    if not job_description or not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    try:
        pdf_bytes = await resume.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    # 1. Formatting & Layout check
    try:
        resume_text, layout_warnings, formatting_score = _check_pdf_formatting(pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse PDF content: {e}")

    # Safe local log
    try:
        log_path = os.path.join(os.path.dirname(__file__), "..", "debug_ats.log")
        with open(log_path, "w", encoding="utf-8") as f_debug:
            f_debug.write(f"Filename: {resume.filename}\nLength: {len(resume_text)}\nPreview:\n{resume_text[:500]}\n")
    except Exception:
        pass

    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="The PDF appears empty or is a non-searchable image scan.")

    # 2. Section Completeness Audit
    section_breakdown, section_warnings, section_score = _validate_sections(resume_text)
    formatting_issues = layout_warnings + section_warnings

    # 3. Action Verbs & Metric Impact
    impact_score, vague_issues, found_verbs = _analyze_action_impact(resume_text)

    # 4. Keyword Matching
    jd_skills = _extract_jd_skills(job_description)
    matched_kws, partial_kws, missing_kws, keyword_score = _compute_semantic_matching(resume_text, jd_skills)

    # 5. Local suggestions fallback
    local_suggestions = []
    if missing_kws:
        local_suggestions.append(f"Incorporate missing target keywords: {', '.join(missing_kws[:4])}.")
    if vague_issues:
        local_suggestions.append("Quantify achievements with numbers ($X, Y%, Z users) and replace vague filler verbs.")
    if section_warnings:
        local_suggestions.append("Ensure all standard resume sections (Contact, Experience, Education, Skills) are explicitly labeled.")
    if not local_suggestions:
        local_suggestions.append("Maintain clear, single-column formatting with standard headings.")

    local_top_three_fixes = [
        f"Add key missing tools: {', '.join(missing_kws[:3]) if missing_kws else 'Cloud & Deployment tools'}."
    ]
    if section_warnings:
        local_top_three_fixes.append(section_warnings[0])
    else:
        local_top_three_fixes.append("Quantify project accomplishments using measurable metrics and action verbs.")
    local_top_three_fixes.append("Ensure single-column layout without complex tables or non-standard fonts.")

    local_rewrites = [
        BulletRewrite(
            original="Worked on system features and handled bugs.",
            improved=f"Architected core modules for {job_role or 'the application'}, resolving 40+ critical issues and accelerating performance by 25%."
        )
    ]

    # Weighted baseline score (Keywords: 40%, Formatting: 20%, Sections: 20%, Impact: 20%)
    baseline_ats_score = (
        (keyword_score * 0.40) +
        (formatting_score * 0.20) +
        (section_score * 0.20) +
        (impact_score * 0.20)
    )

    ats_score = baseline_ats_score
    suggestions = local_suggestions
    top_three_fixes = local_top_three_fixes
    bullet_rewrites = local_rewrites

    # Gemini AI enhancement
    truncated_resume = resume_text[:3500] if len(resume_text) > 3500 else resume_text
    gemini_prompt = f"""
Resume Text:
{truncated_resume}

Target Job: {job_role or 'Target Role'}
Job Description Requirements:
{job_description[:800]}

Computed Baseline Scores:
- Keyword Match Score: {keyword_score}%
- Formatting Score: {formatting_score}%
- Section Completeness: {section_score}%
- Impact & Action Verbs: {impact_score}%
- Matched Keywords: {matched_kws[:10]}
- Missing Keywords: {missing_kws[:10]}
"""
    try:
        raw_review = generate_with_fallback(gemini_prompt, system_instruction=REVIEW_SYSTEM_PROMPT)
        parsed = _parse_gemini_json(raw_review)
        ats_score = float(parsed.get("ats_score", baseline_ats_score))
        suggestions = list(parsed.get("improvement_suggestions", local_suggestions))
        top_three_fixes = list(parsed.get("top_three_fixes", local_top_three_fixes))
        raw_rewrites = parsed.get("suggested_bullet_rewrites", [])
        if raw_rewrites:
            bullet_rewrites = [
                BulletRewrite(
                    original=str(r.get("original", "")),
                    improved=str(r.get("improved", ""))
                )
                for r in raw_rewrites if r.get("original") and r.get("improved")
            ]
    except Exception as e:
        print(f"Gemini ATS review fallback: {e}")

    ats_score = max(10.0, min(99.0, ats_score))

    return ATSResponse(
        ats_score=round(ats_score, 1),
        formatting_score=round(formatting_score, 1),
        keyword_score=round(keyword_score, 1),
        section_score=round(section_score, 1),
        impact_score=round(impact_score, 1),
        section_breakdown=section_breakdown,
        keywords_matched=matched_kws,
        keywords_partially_matched=partial_kws,
        keywords_missing=missing_kws,
        formatting_issues=formatting_issues,
        vague_language_issues=vague_issues,
        improvement_suggestions=suggestions[:5],
        top_three_fixes=top_three_fixes[:3],
        suggested_bullet_rewrites=bullet_rewrites[:3],
        generated_jd=generated_jd_text
    )
