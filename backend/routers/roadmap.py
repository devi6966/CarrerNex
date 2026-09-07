"""
routers/roadmap.py
------------------
AI-powered customized Career Roadmap Generator.
POST /api/roadmap/generate
"""

import json
import re
from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from gemini_client import generate_with_fallback

router = APIRouter(prefix="/api/roadmap", tags=["Career Roadmap"])

ROADMAP_SYSTEM_PROMPT = """You are an elite career counselor and technical roadmap architect.
Your goal is to generate a highly customized, extremely actionable, step-by-step career path roadmap based on the user's career goals, educational qualifications, existing skills, experience level, and daily study time.

RULES YOU MUST FOLLOW:
1. Always respond in valid JSON only — no markdown, no extra text outside the JSON block.
2. The roadmap must NOT be generic. It must be specifically personalized to bridge the gap between the user's current qualifications/skills and their target role.
3. Keep the content extremely detailed, professional, and practical.
4. For learning resources, recommend real, useful platforms, youtube channels, or books.

RESPONSE SCHEMA (Strict JSON):
{
  "current_position_analysis": "A detailed assessment of where the candidate stands based on their education, experience level, and skills, explaining the gap to the target role.",
  "missing_skills": ["Skill 1", "Skill 2", ...],
  "learning_sequence": ["Phase 1: Basic concept details", "Phase 2: Core technologies details", ...],
  "projects_to_build": [
    {
      "title": "Project Title",
      "description": "Comprehensive explanation of what the user should build to showcase this skill.",
      "tech_stack": ["React", "Node.js", ...]
    }
  ],
  "certifications": ["Recommended certification name 1", "Recommended certification name 2"],
  "interview_preparation": "Specific topics, coding challenge patterns, and behavioral preparation strategies tailored to the target role.",
  "resume_preparation": "Tailoring advice for resume formatting, key metrics, and projects highlighting for this target role.",
  "portfolio_checklist": ["Build personal site", "Clean up GitHub projects", ...],
  "job_application_strategy": "Actionable strategy for applying to this specific role (e.g. networking focus, cold emailing, platform preferences).",
  "free_resources": ["Udemy free tier courses", "Official documentation", ...],
  "recommended_youtube_channels": ["Channel Name 1", "Channel Name 2"],
  "practice_platforms": ["LeetCode", "HackerRank", ...],
  "expected_timeline": "Estimated overall duration to become job-ready (e.g. '4 Months').",
  "milestones": [
    {
      "title": "Milestone Title (e.g. Week 1-2: Advanced Python Basics)",
      "description": "Specific focus area and topics to cover.",
      "estimated_time": "Duration (e.g. '2 weeks')",
      "resources": ["Resource Title or Link 1", "Resource Title or Link 2"]
    }
  ],
  "final_placement_checklist": ["Complete mock interviews", "Optimize LinkedIn profile", ...]
}"""

class Project(BaseModel):
    title: str
    description: str
    tech_stack: List[str]

class Milestone(BaseModel):
    title: str
    description: str
    estimated_time: str
    resources: List[str]

class RoadmapRequest(BaseModel):
    target_role: str = Field(..., description=" Dream career or target job role")
    highest_qualification: str = Field(..., description="Highest educational qualification")
    current_skills: List[str] = Field(..., description="Skills the user already possesses")
    experience_level: str = Field(..., description="Experience level: Beginner, Intermediate, or Advanced")
    study_hours: str = Field(..., description="Available daily study time")

class RoadmapResponse(BaseModel):
    current_position_analysis: str
    missing_skills: List[str]
    learning_sequence: List[str]
    projects_to_build: List[Project]
    certifications: List[str]
    interview_preparation: str
    resume_preparation: str
    portfolio_checklist: List[str]
    job_application_strategy: str
    free_resources: List[str]
    recommended_youtube_channels: List[str]
    practice_platforms: List[str]
    expected_timeline: str
    milestones: List[Milestone]
    final_placement_checklist: List[str]

def _parse_gemini_json(raw: str) -> dict:
    """Safely parse JSON response from Gemini, removing markdown wrapper block quotes."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse Gemini response as JSON: {raw[:200]}")

def _generate_fallback_roadmap(request: RoadmapRequest) -> RoadmapResponse:
    """Generates a high-quality simulated roadmap when Gemini API rate limits/quota blocks occur."""
    role = request.target_role.strip()
    qual = request.highest_qualification
    skills_str = ", ".join(request.current_skills) if request.current_skills else "None"
    
    return RoadmapResponse(
      current_position_analysis=(
          f"⚠️ [DEMO MODE - Gemini API Rate Limit Fallback] You are aiming for a '{role}' role. "
          f"Given your education background in '{qual}' and existing skills ({skills_str}), "
          f"we have mapped out the crucial milestones to help you transition into this role. "
          f"Focus heavily on building projects to bridge your current experience gap."
      ),
      missing_skills=[
          f"Advanced concepts in {role}",
          "System Architecture & Scalability Design",
          "Production deployment & CI/CD automation pipelines"
      ],
      learning_sequence=[
          f"Phase 1: Foundation of {role} and setup",
          f"Phase 2: Building full-stack projects",
          f"Phase 3: Production deployment and mock interview preparation"
      ],
      projects_to_build=[
          Project(
              title=f"Custom {role} Capstone Application",
              description="Build a production-grade application featuring secure user management, data storage, and automated deployment.",
              tech_stack=["React", "Node.js", "Docker", "Git"]
          )
      ],
      certifications=[
          f"AWS Certified Solutions Architect",
          f"Professional certification in {role} engineering"
      ],
      interview_preparation=(
          f"Focus on Data Structures, algorithms, and system design questions. "
          f"Practice mock interviews specifically for the {role} role."
      ),
      resume_preparation=(
          f"Add your {role} capstone project to your resume. Highlight key metrics "
          f"like load times, search efficiency, or system uptime."
      ),
      portfolio_checklist=[
          "Host your projects on GitHub with clean README documentation",
          "Build a personal portfolio website",
          "Update your LinkedIn profile with your target role title"
      ],
      job_application_strategy=(
          f"Connect with engineering managers in the {role} field. "
          f"Contribute to open source projects and apply via niche tech job boards."
      ),
      free_resources=[
          "Official tech documentation & quickstart tutorials",
          "freeCodeCamp curriculum guides",
          "GitHub student developer pack tools"
      ],
      recommended_youtube_channels=[
          "TechWithTim",
          "Traversy Media",
          "fireship"
      ],
      practice_platforms=[
          "LeetCode",
          "HackerRank",
          "Frontend Mentor"
      ],
      expected_timeline="3 - 4 Months",
      milestones=[
          Milestone(
              title=f"Milestone 1: foundational tools & setup for {role}",
              description="Set up your developer environment, read documentation, and write basic configurations.",
              estimated_time="Week 1-3",
              resources=["YouTube introductory tutorials", "Getting Started guide docs"]
          ),
          Milestone(
              title="Milestone 2: Core implementation & API integrations",
              description="Develop key application layers, connect database instances, and structure system interfaces.",
              estimated_time="Week 4-8",
              resources=["Free coding tutorials", "GitHub sample templates"]
          ),
          Milestone(
              title="Milestone 3: Deployment, resume polish & placement prep",
              description="Optimize system code, containerize tools, build a placement resume, and practice logic quizzes.",
              estimated_time="Week 9-12",
              resources=["Leetcode practice trackers", "CareerNex ATS checker tool"]
          )
      ],
      final_placement_checklist=[
          "Verify all project links are live",
          "Complete 3 mock voice interviews on CareerNex",
          "Submit resume to 10 active job roles daily"
      ]
    )

@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap(request: RoadmapRequest) -> RoadmapResponse:
    """
    POST /api/roadmap/generate
    Dynamically generates a customized career roadmap based on target goal, education, skills, and timeline parameters.
    Fallback matches locally if Gemini APIs throw rate-limits.
    """
    if not request.target_role.strip():
        raise HTTPException(status_code=400, detail="Target job role cannot be empty.")

    prompt = (
        f"Generate a customized, step-by-step career roadmap for a user whose details are as follows:\n"
        f"- Target Job Role: {request.target_role}\n"
        f"- Highest Qualification: {request.highest_qualification}\n"
        f"- Current Skills: {', '.join(request.current_skills) if request.current_skills else 'None'}\n"
        f"- Experience Level: {request.experience_level}\n"
        f"- Daily Available Study Time: {request.study_hours}\n"
    )

    try:
        raw_response = generate_with_fallback(
            prompt, system_instruction=ROADMAP_SYSTEM_PROMPT
        )
        parsed = _parse_gemini_json(raw_response)

        return RoadmapResponse(
            current_position_analysis=str(parsed.get("current_position_analysis", "No analysis provided.")),
            missing_skills=list(parsed.get("missing_skills", [])),
            learning_sequence=list(parsed.get("learning_sequence", [])),
            projects_to_build=[
                Project(
                    title=str(p.get("title", "Project Title")),
                    description=str(p.get("description", "Description")),
                    tech_stack=list(p.get("tech_stack", []))
                ) for p in parsed.get("projects_to_build", [])
            ],
            certifications=list(parsed.get("certifications", [])),
            interview_preparation=str(parsed.get("interview_preparation", "No interview preparation info provided.")),
            resume_preparation=str(parsed.get("resume_preparation", "No resume prep info provided.")),
            portfolio_checklist=list(parsed.get("portfolio_checklist", [])),
            job_application_strategy=str(parsed.get("job_application_strategy", "No strategy provided.")),
            free_resources=list(parsed.get("free_resources", parsed.get("free_learning_resources", []))),
            recommended_youtube_channels=list(parsed.get("recommended_youtube_channels", [])),
            practice_platforms=list(parsed.get("practice_platforms", [])),
            expected_timeline=str(parsed.get("expected_timeline", "Flexible")),
            milestones=[
                Milestone(
                    title=str(m.get("title", "Milestone Step")),
                    description=str(m.get("description", "Description")),
                    estimated_time=str(m.get("estimated_time", "Varies")),
                    resources=list(m.get("resources", []))
                ) for m in parsed.get("milestones", [])
            ],
            final_placement_checklist=list(parsed.get("final_placement_checklist", []))
        )
    except Exception as e:
        # Fallback to local roadmap generation if rate-limit/connection error occurs
        print(f"Gemini API rate limited or failed ({e}). Returning high-quality local fallback.")
        return _generate_fallback_roadmap(request)
