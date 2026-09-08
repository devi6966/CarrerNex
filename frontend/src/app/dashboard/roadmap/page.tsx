"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { recordActivity } from "@/lib/userStore";

interface Project {
  title: string;
  description: string;
  tech_stack: string[];
}

interface Milestone {
  title: string;
  description: string;
  estimated_time: string;
  resources: string[];
}

interface RoadmapData {
  current_position_analysis: string;
  missing_skills: string[];
  learning_sequence: string[];
  projects_to_build: Project[];
  certifications: string[];
  interview_preparation: string;
  resume_preparation: string;
  portfolio_checklist: string[];
  job_application_strategy: string;
  free_resources: string[];
  recommended_youtube_channels: string[];
  practice_platforms: string[];
  expected_timeline: string;
  milestones: Milestone[];
  final_placement_checklist: string[];
}

export default function RoadmapPage() {
  const { data: session } = useSession();
  const userKey = session?.user?.email ? encodeURIComponent(session.user.email.toLowerCase()) : "guest_user";
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://carrernex.onrender.com";

  // Form State
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState("");
  const [highestQualification, setHighestQualification] = useState("B.Tech");
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Beginner");
  const [studyHours, setStudyHours] = useState("2 hours");

  // App / API State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<number[]>([]);

  // Pre-defined values matching reference
  const suggestedRoles = [
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "AI Engineer",
    "DevOps Engineer",
    "Data Scientist",
    "Cloud Engineer",
    "UI/UX Designer",
    "Product Manager",
  ];

  const suggestedSkills = [
    "Python",
    "Java",
    "C++",
    "Linux",
    "AWS",
    "Docker",
    "Git",
    "React",
    "SQL",
    "Communication",
    "Problem Solving",
  ];

  const qualifications = [
    "10th",
    "12th",
    "Diploma",
    "ITI",
    "B.Tech",
    "BCA",
    "MCA",
    "MBA",
    "M.Tech",
    "Graduate",
    "Post Graduate",
    "Other",
  ];

  // Load existing roadmap from localStorage on mount or session change
  useEffect(() => {
    const savedRoadmap = localStorage.getItem(`careernex_roadmap_data_${userKey}`);
    const savedProgress = localStorage.getItem(`careernex_roadmap_progress_${userKey}`);

    if (savedRoadmap) {
      try {
        setRoadmap(JSON.parse(savedRoadmap));
      } catch (e) {
        console.error("Error parsing saved roadmap:", e);
        setRoadmap(null);
      }
    } else {
      setRoadmap(null);
    }

    if (savedProgress) {
      try {
        setCompletedMilestones(JSON.parse(savedProgress));
      } catch (e) {
        console.error("Error parsing saved progress:", e);
        setCompletedMilestones([]);
      }
    } else {
      setCompletedMilestones([]);
    }
  }, [userKey]);

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !currentSkills.includes(customSkill.trim())) {
      setCurrentSkills([...currentSkills, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const handleToggleSkill = (skill: string) => {
    if (currentSkills.includes(skill)) {
      setCurrentSkills(currentSkills.filter((s) => s !== skill));
    } else {
      setCurrentSkills([...currentSkills, skill]);
    }
  };

  const handleGenerateRoadmap = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/roadmap/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_role: targetRole,
          highest_qualification: highestQualification,
          current_skills: currentSkills,
          experience_level: experienceLevel,
          study_hours: studyHours,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate career roadmap.");
      }

      const data: RoadmapData = await response.json();
      setRoadmap(data);
      setCompletedMilestones([]); // Reset progress on new generation

      // Save to user-scoped localStorage
      localStorage.setItem(`careernex_roadmap_data_${userKey}`, JSON.stringify(data));
      localStorage.setItem(`careernex_roadmap_progress_${userKey}`, JSON.stringify([]));

      // Record activity to personal profile
      if (session?.user?.email) {
        recordActivity(session.user.email, {
          type: "Career Roadmap",
          detail: `Generated custom roadmap for '${targetRole || "Target Role"}'`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMilestone = (index: number) => {
    let updated: number[];
    if (completedMilestones.includes(index)) {
      updated = completedMilestones.filter((i) => i !== index);
    } else {
      updated = [...completedMilestones, index];
    }
    setCompletedMilestones(updated);
    localStorage.setItem(`careernex_roadmap_progress_${userKey}`, JSON.stringify(updated));
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to delete the current roadmap and build a new one?")) {
      setRoadmap(null);
      setCompletedMilestones([]);
      setStep(1);
      localStorage.removeItem(`careernex_roadmap_data_${userKey}`);
      localStorage.removeItem(`careernex_roadmap_progress_${userKey}`);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const progressPercentage = roadmap?.milestones?.length
    ? Math.round((completedMilestones.length / roadmap.milestones.length) * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1160px", margin: "0 auto" }}>
      
      {/* ── Breadcrumb Navigation ────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
        <Link
          href="/dashboard"
          style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#09090b")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
        >
          Dashboard
        </Link>
        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>&gt;</span>
        <span style={{ color: "#09090b", fontWeight: 700 }}>Career Roadmap</span>
      </div>

      {/* ── Page Header / Illustrative Roadmap Banner ─────────────────────── */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "2rem",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Title & Subtitle */}
        <div style={{ flex: 1, minWidth: "280px" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#09090b", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            Career Roadmap Builder
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9375rem", marginTop: "0.45rem", lineHeight: 1.55, maxWidth: "520px" }}>
            Generate highly customized step-by-step career path milestones dynamically using AI.
          </p>
        </div>

        {/* Right side: Action buttons if roadmap exists, OR Illustrative Banner Preview if configuring */}
        {roadmap ? (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleReset}
              className="btn-pop"
              style={{
                padding: "0.6rem 1.15rem",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                color: "#09090b",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
              }}
            >
              🔄 New Roadmap
            </button>
            <button
              onClick={handleDownloadPDF}
              className="btn-pop"
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "10px",
                background: "#09090b",
                border: "none",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
              }}
            >
              📥 Download PDF
            </button>
          </div>
        ) : (
          /* Illustrative Preview Banner Widget (Matching Suggested Reference) */
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "1rem 1.35rem",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              width: "100%",
              maxWidth: "470px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
            }}
            className="mobile-hide"
          >
            {/* Top Row: "Plan Today Build Tomorrow" + Hand-drawn Arrow */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <div
                style={{
                  fontFamily: "'Caveat', cursive, sans-serif",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#18181b",
                  lineHeight: 1.15,
                  transform: "rotate(-3deg)",
                }}
              >
                <div>Plan Today</div>
                <div>Build Tomorrow</div>
              </div>
              {/* Curved Arrow pointing toward Skills */}
              <svg width="34" height="28" viewBox="0 0 34 28" fill="none" style={{ marginTop: "0.35rem", marginLeft: "0.2rem" }}>
                <path d="M4 4 C 15 6, 18 16, 26 22" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                <path d="M19 22 L 27 22 L 26 15" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>

            {/* Middle: 5 Connected Milestone Cards with Dashed Curved Path */}
            <div style={{ position: "relative", padding: "0.35rem 0 0.65rem" }}>
              {/* Dashed Connecting Line SVG behind cards */}
              <svg
                width="100%"
                height="44"
                viewBox="0 0 420 44"
                fill="none"
                style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 0, width: "100%", height: "44px", pointerEvents: "none", zIndex: 0 }}
                preserveAspectRatio="none"
              >
                <path
                  d="M 38 26 C 75 10, 105 34, 140 18 C 175 4, 210 32, 250 16 C 290 6, 320 28, 380 14"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  fill="none"
                />
              </svg>

              {/* 5 Milestone Cards */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 1,
                  gap: "0.4rem",
                }}
              >
                {/* 1. Skills */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0.5rem 0.65rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.2rem",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.04)",
                    minWidth: "58px",
                    transform: "translateY(5px)",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>📖</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#18181b" }}>Skills</span>
                </div>

                {/* 2. Projects */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0.5rem 0.65rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.2rem",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.04)",
                    minWidth: "60px",
                    transform: "translateY(-4px)",
                  }}
                >
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#09090b", fontFamily: "monospace" }}>&lt;/&gt;</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#18181b" }}>Projects</span>
                </div>

                {/* 3. Experience */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0.5rem 0.65rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.2rem",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.04)",
                    minWidth: "64px",
                    transform: "translateY(3px)",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>💼</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#18181b" }}>Experience</span>
                </div>

                {/* 4. Interview */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0.5rem 0.65rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.2rem",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.04)",
                    minWidth: "60px",
                    transform: "translateY(-2px)",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>👥</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#18181b" }}>Interview</span>
                </div>

                {/* 5. Placement */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0.5rem 0.65rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.2rem",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.04)",
                    minWidth: "62px",
                    transform: "translateY(-5px)",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>🏆</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#18181b" }}>Placement</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: "Your Journey. Our Guidance." */}
            <div
              style={{
                fontFamily: "'Caveat', cursive, sans-serif",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "#71717a",
                textAlign: "right",
                lineHeight: 1.15,
                transform: "rotate(-2deg)",
              }}
            >
              <div>Your Journey.</div>
              <div>Our Guidance.</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Loading Overlay ──────────────────────────────────────────────── */}
      {loading && (
        <div
          style={{
            padding: "3.5rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            background: "#ffffff",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          }}
          className="animate-smooth-in"
        >
          <div className="speaking-wave" style={{ gap: "6px" }}>
            <span style={{ animationDelay: "0.1s", background: "#09090b" }}></span>
            <span style={{ animationDelay: "0.2s", background: "#3f3f46" }}></span>
            <span style={{ animationDelay: "0.3s", background: "#09090b" }}></span>
            <span style={{ animationDelay: "0.4s", background: "#3f3f46" }}></span>
          </div>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#09090b" }}>Analyzing Career Gaps...</h3>
            <p style={{ color: "#52525b", fontSize: "0.9375rem", marginTop: "0.5rem", maxWidth: "480px", lineHeight: 1.6 }}>
              CareerNex AI is evaluating your qualification, indexing missing skill sets, mapping projects, and building weekly milestones. Please wait a moment.
            </p>
          </div>
        </div>
      )}

      {/* ── Error Notification ───────────────────────────────────────────── */}
      {error && !loading && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            color: "#dc2626",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ── PART 1: Multi-Step Configuration Form (Exact Target UI) ──────── */}
      {!roadmap && !loading && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "18px",
            padding: "2rem 2.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
            boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
          }}
          className="animate-smooth-in"
        >
          {/* Step Progress Line */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#09090b" }}>Career Roadmap Setup</span>
              <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#09090b" }}>Step {step} of 5</span>
            </div>
            {/* Minimalist Progress Track matching Reference */}
            <div style={{ width: "100%", height: "3.5px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(step / 5) * 100}%`,
                  background: "#09090b",
                  borderRadius: "999px",
                  transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              ></div>
            </div>
          </div>

          {/* Form Step Slots */}
          <div style={{ minHeight: "220px" }}>
            
            {/* Step 1: Target Career (Matching Image 1 Reference) */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>🎯</span>
                    <span>What is your dream career or target job role?</span>
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Type your specific role or select from popular roles below.
                  </p>
                </div>

                {/* Input with Magnifying Glass Icon inside */}
                <div style={{ position: "relative", width: "100%" }}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#71717a"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: "absolute", left: "1.15rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    placeholder="e.g. Full Stack Developer, DevOps Engineer, Data Scientist, UI/UX..."
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.9rem 1.25rem 0.9rem 3.1rem",
                      background: "#ffffff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "12px",
                      color: "#09090b",
                      fontSize: "0.9375rem",
                      outline: "none",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#09090b";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(9, 9, 11, 0.06)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e4e4e7";
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.02)";
                    }}
                  />
                </div>

                {/* Suggested Popular Roles Chips */}
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                  {suggestedRoles.map((role) => {
                    const isSelected = targetRole.trim().toLowerCase() === role.toLowerCase();
                    return (
                      <button
                        key={role}
                        onClick={() => setTargetRole(role)}
                        className="pill-pop"
                        style={{
                          padding: "0.55rem 1.15rem",
                          borderRadius: "8px",
                          background: isSelected ? "#09090b" : "#ffffff",
                          border: isSelected ? "1px solid #09090b" : "1px solid #e4e4e7",
                          color: isSelected ? "#ffffff" : "#334155",
                          fontSize: "0.85rem",
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                          boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                        }}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Education */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>🎓</span>
                    <span>What is your highest educational qualification?</span>
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                    This helps customize prerequisite math, coding fundamentals, and timeline duration.
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem" }}>
                  {qualifications.map((qual) => {
                    const isSelected = highestQualification === qual;
                    return (
                      <button
                        key={qual}
                        onClick={() => setHighestQualification(qual)}
                        className="pill-pop"
                        style={{
                          padding: "0.85rem 0.75rem",
                          borderRadius: "10px",
                          background: isSelected ? "#09090b" : "#ffffff",
                          border: isSelected ? "1px solid #09090b" : "1px solid #e4e4e7",
                          color: isSelected ? "#ffffff" : "#334155",
                          fontSize: "0.875rem",
                          fontWeight: isSelected ? 700 : 600,
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.18s ease",
                          boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                        }}
                      >
                        {qual}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Current Skills */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>⚙️</span>
                    <span>What skills do you already have?</span>
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Select existing skills so the roadmap skips basics you already master.
                  </p>
                </div>

                {/* Predefined skill toggle list */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {suggestedSkills.map((skill) => {
                    const hasSkill = currentSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => handleToggleSkill(skill)}
                        className="pill-pop"
                        style={{
                          padding: "0.45rem 0.95rem",
                          borderRadius: "8px",
                          background: hasSkill ? "#09090b" : "#ffffff",
                          border: hasSkill ? "1px solid #09090b" : "1px solid #e4e4e7",
                          color: hasSkill ? "#ffffff" : "#334155",
                          fontSize: "0.8125rem",
                          fontWeight: hasSkill ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                        }}
                      >
                        {skill} {hasSkill ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>

                {/* Manual skill adder inputs */}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <input
                    type="text"
                    placeholder="Type custom skill and press Enter..."
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomSkill())}
                    style={{
                      flex: 1,
                      background: "#ffffff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "10px",
                      padding: "0.75rem 1rem",
                      color: "#09090b",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#09090b")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e4e4e7")}
                  />
                  <button
                    onClick={handleAddCustomSkill}
                    className="btn-pop"
                    style={{
                      padding: "0.75rem 1.4rem",
                      borderRadius: "10px",
                      background: "#09090b",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add Skill
                  </button>
                </div>

                {/* Render current skills list */}
                {currentSkills.length > 0 && (
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.875rem" }}>
                    <div style={{ fontSize: "0.8125rem", color: "#64748b", fontWeight: 600, marginBottom: "0.5rem" }}>
                      Selected ({currentSkills.length}):
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {currentSkills.map((s) => (
                        <span
                          key={s}
                          style={{
                            background: "#f4f4f5",
                            border: "1px solid #e4e4e7",
                            color: "#18181b",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            borderRadius: "6px",
                            padding: "0.3rem 0.65rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          {s}
                          <button
                            onClick={() => handleToggleSkill(s)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#71717a",
                              cursor: "pointer",
                              padding: 0,
                              fontWeight: 700,
                              fontSize: "0.875rem",
                            }}
                            title="Remove"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Experience Level */}
            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>⚡</span>
                    <span>Select your current experience level:</span>
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                    We calibrate roadmap difficulty and milestones according to your real experience.
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                  {[
                    { level: "Beginner", desc: "No coding or background experience in this role." },
                    { level: "Intermediate", desc: "Understand core syntax and basic concepts, built a few simple scripts." },
                    { level: "Advanced", desc: "Good systems grasp, code debug capacities, and project portfolios." },
                  ].map((exp) => {
                    const isSelected = experienceLevel === exp.level;
                    return (
                      <button
                        key={exp.level}
                        onClick={() => setExperienceLevel(exp.level)}
                        className="box-pop"
                        style={{
                          padding: "1.25rem",
                          borderRadius: "12px",
                          background: isSelected ? "#09090b" : "#ffffff",
                          border: isSelected ? "1px solid #09090b" : "1px solid #e4e4e7",
                          color: isSelected ? "#ffffff" : "#0f172a",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem",
                          boxShadow: isSelected ? "0 4px 14px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.02)",
                          transition: "all 0.18s ease",
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: "1rem", color: isSelected ? "#ffffff" : "#09090b" }}>
                          {exp.level}
                        </span>
                        <span style={{ fontSize: "0.8125rem", color: isSelected ? "#d4d4d8" : "#64748b", lineHeight: 1.5 }}>
                          {exp.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Daily Study Time */}
            {step === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>⏰</span>
                    <span>How much time can you study every day?</span>
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Your total duration (e.g. 3 months vs 6 months) depends on daily dedicated hours.
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
                  {["1 hour", "2 hours", "3 hours", "4+ hours"].map((t) => {
                    const isSelected = studyHours === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setStudyHours(t)}
                        className="pill-pop"
                        style={{
                          padding: "1rem",
                          borderRadius: "10px",
                          background: isSelected ? "#09090b" : "#ffffff",
                          border: isSelected ? "1px solid #09090b" : "1px solid #e4e4e7",
                          color: isSelected ? "#ffffff" : "#334155",
                          fontSize: "0.9375rem",
                          fontWeight: isSelected ? 700 : 600,
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.18s ease",
                          boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Info Summary card */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "1.15rem 1.25rem",
                    fontSize: "0.875rem",
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  📝 <strong style={{ color: "#09090b" }}>Summary of details:</strong> Target: <strong style={{ color: "#09090b" }}>{targetRole || "Not specified"}</strong>, Qualification: <strong style={{ color: "#09090b" }}>{highestQualification}</strong>, Skills: <strong style={{ color: "#09090b" }}>{currentSkills.length} selected</strong>, Level: <strong style={{ color: "#09090b" }}>{experienceLevel}</strong>. Click &apos;Generate Roadmap&apos; to build your plan.
                </div>
              </div>
            )}

          </div>

          {/* Form Actions Footer (Matching Image 1 Reference) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className="btn-pop"
              style={{
                padding: "0.65rem 1.45rem",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                color: step === 1 ? "#a1a1aa" : "#09090b",
                cursor: step === 1 ? "not-allowed" : "pointer",
                opacity: step === 1 ? 0.6 : 1,
                fontSize: "0.875rem",
                fontWeight: 600,
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
              }}
            >
              ← Back
            </button>

            {step < 5 ? (
              <button
                onClick={() => {
                  if (step === 1 && !targetRole.trim()) {
                    alert("Please enter or select a dream job role to proceed.");
                    return;
                  }
                  setStep(step + 1);
                }}
                style={{
                  padding: "0.7rem 1.85rem",
                  borderRadius: "10px",
                  background: "#09090b",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#27272a";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#09090b";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleGenerateRoadmap}
                style={{
                  padding: "0.75rem 2.25rem",
                  borderRadius: "10px",
                  background: "#09090b",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.22)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#27272a";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#09090b";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Generate Roadmap ⚡
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── PART 2: Custom Roadmap Interactive Dashboard (When Generated) ──── */}
      {roadmap && !loading && (
        <div className="animate-smooth-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Progress Header widget */}
          <div
            style={{
              padding: "1.75rem 2rem",
              background: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "18px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#09090b" }}>
                Target: {targetRole} ({roadmap.expected_timeline})
              </h3>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#09090b" }}>
                Progress: {progressPercentage}% Complete ({completedMilestones.length} / {roadmap.milestones.length})
              </span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${progressPercentage}%`,
                  height: "100%",
                  background: "#09090b",
                  borderRadius: "999px",
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div>
          </div>

          {/* Current Position Analysis Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "18px",
              padding: "2rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#09090b", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>📊</span>
              <span>Current Position Analysis</span>
            </h3>
            <p style={{ color: "#334155", fontSize: "0.9375rem", lineHeight: 1.7 }}>
              {roadmap.current_position_analysis}
            </p>
          </div>

          {/* Double Column layout */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "2rem" }} className="mobile-column-stack">
            
            {/* Left Column: Learning Sequence Milestones Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#09090b" }}>
                🗺️ Learning Sequence & Milestones
              </h3>

              <div style={{ position: "relative", paddingLeft: "1.75rem", borderLeft: "2px solid #e2e8f0" }}>
                {roadmap.milestones.map((m, idx) => {
                  const isChecked = completedMilestones.includes(idx);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "1.5rem",
                        marginBottom: "1.5rem",
                        position: "relative",
                        background: isChecked ? "#f8fafc" : "#ffffff",
                        border: isChecked ? "1px solid #cbd5e1" : "1px solid #e4e4e7",
                        borderRadius: "14px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        opacity: isChecked ? 0.85 : 1,
                        transition: "all 0.2s ease",
                      }}
                      className="animate-smooth-in"
                    >
                      {/* Timeline dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: "-2.1875rem",
                          top: "1.75rem",
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          background: isChecked ? "#10b981" : "#09090b",
                          boxShadow: isChecked ? "0 0 10px rgba(16, 185, 129, 0.5)" : "0 0 8px rgba(9, 9, 11, 0.3)",
                          border: "2px solid #ffffff",
                          zIndex: 5,
                        }}
                      />

                      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMilestone(idx)}
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "6px",
                            borderColor: "#cbd5e1",
                            accentColor: "#09090b",
                            cursor: "pointer",
                            flexShrink: 0,
                            marginTop: "0.2rem",
                          }}
                        />

                        {/* Contents */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", alignItems: "baseline" }}>
                            <h4
                              style={{
                                fontSize: "1.0625rem",
                                fontWeight: 700,
                                color: isChecked ? "#94a3b8" : "#09090b",
                                textDecoration: isChecked ? "line-through" : "none",
                              }}
                            >
                              {m.title}
                            </h4>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#09090b",
                                fontWeight: 700,
                                background: "#f4f4f5",
                                border: "1px solid #e4e4e7",
                                borderRadius: "6px",
                                padding: "0.2rem 0.55rem",
                              }}
                            >
                              ⏱️ {m.estimated_time}
                            </span>
                          </div>
                          
                          <p style={{ fontSize: "0.875rem", color: "#475569", marginTop: "0.5rem", lineHeight: 1.6 }}>
                            {m.description}
                          </p>

                          {/* Milestone learning resources list */}
                          {m.resources && m.resources.length > 0 && (
                            <div style={{ marginTop: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#71717a" }}>Milestone Resources:</span>
                              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
                                {m.resources.map((res, rIdx) => (
                                  <span
                                    key={rIdx}
                                    style={{
                                      fontSize: "0.75rem",
                                      background: "#f4f4f5",
                                      border: "1px solid #e4e4e7",
                                      borderRadius: "6px",
                                      padding: "0.25rem 0.6rem",
                                      color: "#18181b",
                                      fontWeight: 600,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                    }}
                                  >
                                    📖 {res}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Projects, Tools & Preparation Strategy */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Missing Skills Card */}
              {roadmap.missing_skills && roadmap.missing_skills.length > 0 && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e4e4e7",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  }}
                >
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#09090b", marginBottom: "0.75rem" }}>
                    🎯 Missing Skills to Acquire
                  </h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {roadmap.missing_skills.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.8125rem",
                          background: "#f4f4f5",
                          border: "1px solid #e4e4e7",
                          color: "#18181b",
                          fontWeight: 600,
                          borderRadius: "6px",
                          padding: "0.3rem 0.75rem",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects to Build */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#09090b", marginBottom: "0.75rem" }}>
                  💻 Recommended Projects to Build
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {roadmap.projects_to_build.map((p, idx) => (
                    <div key={idx} style={{ borderBottom: idx < roadmap.projects_to_build.length - 1 ? "1px solid #f1f5f9" : "none", paddingBottom: "0.75rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#09090b" }}>{p.title}</div>
                      <div style={{ fontSize: "0.8125rem", color: "#52525b", marginTop: "0.25rem", lineHeight: 1.5 }}>
                        {p.description}
                      </div>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                        {p.tech_stack.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            style={{
                              fontSize: "0.7rem",
                              background: "#f4f4f5",
                              border: "1px solid #e4e4e7",
                              color: "#3f3f46",
                              borderRadius: "4px",
                              padding: "0.15rem 0.45rem",
                              fontWeight: 600,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interview & Resume Prep Strategy */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#09090b", marginBottom: "0.5rem" }}>
                  📋 Interview & Resume Strategy
                </h3>
                <div style={{ fontSize: "0.8125rem", color: "#475569", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                  <strong style={{ color: "#09090b" }}>Interview Focus:</strong> {roadmap.interview_preparation}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#475569", lineHeight: 1.6 }}>
                  <strong style={{ color: "#09090b" }}>Resume Focus:</strong> {roadmap.resume_preparation}
                </div>
              </div>

              {/* Free Learning Resources & Platforms */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#09090b", marginBottom: "0.75rem" }}>
                  🌐 Practice Platforms & YouTube
                </h3>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {[...roadmap.practice_platforms, ...roadmap.recommended_youtube_channels].map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.75rem",
                        background: "#f4f4f5",
                        border: "1px solid #e4e4e7",
                        color: "#18181b",
                        borderRadius: "6px",
                        padding: "0.25rem 0.6rem",
                        fontWeight: 600,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
