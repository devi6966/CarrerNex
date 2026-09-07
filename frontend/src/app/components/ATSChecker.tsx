"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { recordActivity } from "@/lib/userStore";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BulletRewrite {
  original: string;
  improved: string;
}

interface ATSResult {
  ats_score: number;
  formatting_score: number;
  keyword_score: number;
  section_score: number;
  impact_score: number;

  section_breakdown: Record<string, boolean>;

  keywords_matched: string[];
  keywords_partially_matched: string[];
  keywords_missing: string[];

  formatting_issues: string[];
  vague_language_issues: string[];

  improvement_suggestions: string[];
  top_three_fixes: string[];
  suggested_bullet_rewrites: BulletRewrite[];
  generated_jd?: string;
}

const PRESET_ROLES = [
  "Full Stack Developer",
  "Backend Developer",
  "Frontend Developer",
  "DevOps Engineer",
  "Data Scientist",
  "AI / ML Engineer",
  "Cloud Architect",
];

const SAMPLE_JDS: Record<string, string> = {
  "Full Stack Developer":
    "Seeking a Full Stack Developer proficient in React, Next.js, Node.js, TypeScript, and PostgreSQL. Responsibilities include building responsive user interfaces, designing RESTful APIs, and implementing CI/CD pipelines. Experience with Docker, AWS, and Git is strongly preferred. Must have solid knowledge of web performance optimization and clean code principles.",
  "DevOps Engineer":
    "Looking for a DevOps Engineer with hands-on expertise in Kubernetes, Docker, Terraform, CI/CD with GitHub Actions, and AWS cloud services. Candidate will automate deployment infrastructure, monitor system health using Prometheus/Grafana, and enforce security best practices across cloud environments.",
  "Backend Developer":
    "Seeking a Backend Developer skilled in Python (FastAPI/Django) or Node.js, distributed databases (PostgreSQL, Redis), and system architecture. The ideal candidate will build scalable microservices, optimize SQL queries, and integrate third-party APIs.",
  "Data Scientist":
    "Seeking a Data Scientist experienced in Python, Pandas, Scikit-learn, SQL, and machine learning model deployment. Responsibilities include building predictive algorithms, exploratory data analysis, and collaborating with engineering teams on data pipelines.",
  default:
    "We are seeking a talented software engineer with strong technical foundations in web development, data structures, algorithms, cloud platforms, and automated testing. You will collaborate in an agile environment to design, test, and ship high-quality features.",
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ATSChecker() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("Analyzing ATS Factors...");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copiedKw, setCopiedKw] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // Dynamic step rotation during loading
  useEffect(() => {
    if (!loading) return;
    const steps = [
      "📄 Parsing PDF & Text Extraction...",
      "🔍 Semantic Keyword Matching...",
      "⚖️ Section & Layout Audit...",
      "✨ Generating Tailored Suggestions...",
    ];
    let idx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setLoadingStep(steps[idx]);
    }, 1100);
    return () => clearInterval(interval);
  }, [loading]);

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  const onDragLeave = () => setDragActive(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKw(text);
    setTimeout(() => setCopiedKw(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTrySample = () => {
    const sample =
      SAMPLE_JDS[jobRole.trim()] ||
      SAMPLE_JDS["Full Stack Developer"] ||
      SAMPLE_JDS.default;
    setJobDescription(sample);
    if (!jobRole.trim()) {
      setJobRole("Full Stack Developer");
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload your resume PDF.");
      return;
    }
    if (!jobRole.trim() && !jobDescription.trim()) {
      setError("Please enter a target job role or paste a job description.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("resume", file);
    if (jobRole.trim()) {
      formData.append("job_role", jobRole.trim());
    }
    if (jobDescription.trim()) {
      formData.append("job_description", jobDescription.trim());
    }

    try {
      const res = await fetch(`${API_URL}/api/ats/check-resume`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error: ${res.status}`);
      }

      const data: ATSResult = await res.json();
      setResult(data);

      // Record to user's personalized activity log & readiness metrics
      if (session?.user?.email) {
        const score = Math.round(data.ats_score ?? 0);
        const targetLabel = jobRole.trim() || "Target Role";
        recordActivity(session.user.email, {
          type: "ATS Checker",
          detail: `Checked '${targetLabel}' Resume - Score: ${score}%`,
          score: score,
          metricUpdates: {
            atsOptimization: score,
          },
        });
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const scoreLabel = !result
    ? ""
    : result.ats_score >= 80
    ? "Good Match"
    : result.ats_score >= 65
    ? "Competitive Match"
    : result.ats_score >= 50
    ? "Needs Tailoring"
    : "Needs Immediate Revision";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", width: "100%", maxWidth: "1280px", margin: "0 auto" }}>
      
      {/* ── Top Breadcrumbs + "How it works?" Row ──────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.875rem", color: "#71717a" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#71717a", fontWeight: 500 }}>
            Dashboard
          </Link>
          <span style={{ color: "#d4d4d8" }}>›</span>
          <span style={{ color: "#09090b", fontWeight: 600 }}>ATS Checker</span>
        </div>

        <button
          type="button"
          onClick={() => setHowItWorksOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.4rem 0.85rem",
            borderRadius: "9999px",
            background: "#ffffff",
            border: "1px solid #e4e4e7",
            color: "#09090b",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          <span style={{ color: "#71717a", fontSize: "0.95rem" }}>❓</span>
          <span>How it works?</span>
        </button>
      </div>

      {/* ── Hero Header Row with Hand-drawn Doodle & 3D Cards Preview ────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "2rem",
          position: "relative",
        }}
      >
        {/* Left: Title & Subtitle */}
        <div style={{ maxWidth: "680px" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#09090b",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            ATS Resume Checker
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "#52525b",
              marginTop: "0.5rem",
              lineHeight: 1.55,
            }}
          >
            Upload your resume and select a target job role to get an in-depth ATS score,
            section-wise analysis, and actionable suggestions to improve.
          </p>
        </div>

        {/* Right: Hand-Drawn Doodle + 3D Tilted Card Illustration Stack */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            position: "relative",
          }}
          className="mobile-hide"
        >
          {/* Hand-drawn scribble doodle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              transform: "rotate(-4deg)",
              marginRight: "-0.5rem",
            }}
          >
            <div
              style={{
                fontFamily: "'Caveat', cursive, sans-serif",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#52525b",
                lineHeight: 1.15,
                textAlign: "right",
              }}
            >
              Optimize Today<br />Get Hired Tomorrow
            </div>
            <svg
              width="50"
              height="35"
              viewBox="0 0 50 35"
              fill="none"
              stroke="#52525b"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginTop: "0.25rem" }}
            >
              <path d="M 10 5 Q 35 8 38 24" />
              <path d="M 30 21 L 38 26 L 41 18" />
            </svg>
          </div>

          {/* 3D Tilted Card Preview */}
          <div style={{ position: "relative", width: "220px", height: "140px" }}>
            {/* Card 1: Resume Skeleton (Back card tilted -6deg) */}
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "0",
                width: "135px",
                height: "125px",
                background: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e4e4e7",
                padding: "0.75rem",
                transform: "rotate(-6deg)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#09090b" }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#09090b" }}>Your Resume</span>
              </div>
              <div style={{ height: "4px", width: "85%", background: "#e4e4e7", borderRadius: "2px", marginTop: "0.2rem" }} />
              <div style={{ height: "4px", width: "100%", background: "#f4f4f5", borderRadius: "2px" }} />
              <div style={{ height: "4px", width: "90%", background: "#f4f4f5", borderRadius: "2px" }} />
              <div style={{ height: "4px", width: "70%", background: "#f4f4f5", borderRadius: "2px" }} />
              <div style={{ height: "4px", width: "95%", background: "#f4f4f5", borderRadius: "2px" }} />
            </div>

            {/* Card 2: ATS Score Radial Ring (Front card tilted +4deg) */}
            <div
              style={{
                position: "absolute",
                top: "0",
                right: "0",
                width: "120px",
                height: "135px",
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e4e4e7",
                padding: "0.75rem 0.5rem",
                transform: "rotate(4deg)",
                boxShadow: "0 10px 24px -4px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                zIndex: 2,
              }}
            >
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ATS Score
              </div>

              {/* Radial Score Ring */}
              <div style={{ position: "relative", width: 62, height: 62, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="62" height="62" viewBox="0 0 62 62" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="31" cy="31" r="26" stroke="#f4f4f5" strokeWidth="4.5" fill="none" />
                  <circle
                    cx="31"
                    cy="31"
                    r="26"
                    stroke="#09090b"
                    strokeWidth="4.5"
                    fill="none"
                    strokeDasharray="163.36"
                    strokeDashoffset="24.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: "absolute", textAlign: "center", lineHeight: 1 }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#09090b" }}>85</span>
                  <span style={{ fontSize: "0.55rem", color: "#71717a", display: "block", marginTop: "1px" }}>/100</span>
                </div>
              </div>

              {/* Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  background: "#09090b",
                  color: "#ffffff",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "9999px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
              >
                <span style={{ color: "#22c55e" }}>✔</span>
                <span>Good Match</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* ── Main 2-Column Assessment Form ───────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          alignItems: "stretch",
        }}
        className="mobile-column-stack"
      >
        {/* Left Column: Drag & Drop Resume Upload Box */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e4e4e7",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Inner Dashed Upload Box */}
          <div
            className={`drop-zone ${dragActive ? "drag-active" : ""}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              minHeight: "260px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem 1.5rem",
              borderRadius: "14px",
              border: dragActive ? "2px dashed #09090b" : "2px dashed #e4e4e7",
              background: dragActive ? "#f4f4f5" : "#fafafa",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {/* Gray Circle with Cloud Upload Arrow */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#a1a1aa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>

            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#09090b", textAlign: "center" }}>
              Drag & drop your resume PDF here
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#71717a", marginTop: "0.25rem" }}>
              or click to browse
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.75rem",
                color: "#71717a",
                marginTop: "1rem",
                background: "#ffffff",
                padding: "0.35rem 0.75rem",
                borderRadius: "9999px",
                border: "1px solid #e4e4e7",
              }}
            >
              <span>🔒</span>
              <span>Supports PDF files only • Parsed securely in memory</span>
            </div>

            {/* Choose File Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              style={{
                marginTop: "1.25rem",
                padding: "0.55rem 1.25rem",
                borderRadius: "8px",
                background: "#09090b",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Choose File</span>
            </button>
          </div>

          {/* Uploaded File Preview Card (matching reference Spandan_Resume.pdf) */}
          {file && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    background: "#f4f4f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#09090b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
              </div>

              {/* Remove file button */}
              <button
                type="button"
                onClick={() => setFile(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#71717a",
                  padding: "0.35rem",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 0.15s",
                }}
                title="Remove resume"
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}

          {/* Privacy & Security note below upload box */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid #f4f4f5",
            }}
          >
            <div style={{ width: 20, height: 20, flexShrink: 0, marginTop: "1px", color: "#09090b" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#09090b" }}>
                Your data is safe with us.
              </div>
              <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>
                Files are processed in real-time and not stored permanently.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Target Job Role & Job Description Inputs */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e4e4e7",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            justifyContent: "space-between",
          }}
        >
          {/* 1. Target Job Role Field */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.875rem", fontWeight: 700, color: "#09090b" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Target Job Role</span>
              </label>

              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#71717a",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <span>✨</span>
                <span>{showSuggestions ? "Hide Suggestions" : "Show Suggestions"}</span>
              </button>
            </div>

            {/* Input with Magnifying Glass */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                background: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e4e4e7",
                padding: "0.65rem 0.9rem",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                id="role-input"
                type="text"
                placeholder="Search or enter job role (e.g. Full Stack Developer)"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "0.875rem",
                  width: "100%",
                  color: "#09090b",
                }}
              />
            </div>

            {/* Suggested Pills */}
            {showSuggestions && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.65rem" }}>
                {PRESET_ROLES.map((r) => {
                  const isSelected = jobRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setJobRole(r)}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "8px",
                        background: isSelected ? "#09090b" : "#f4f4f5",
                        border: isSelected ? "1px solid #09090b" : "1px solid #e4e4e7",
                        color: isSelected ? "#ffffff" : "#3f3f46",
                        fontSize: "0.75rem",
                        fontWeight: isSelected ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Job Description (Optional) Field */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.875rem", fontWeight: 700, color: "#09090b" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span>Job Description (Optional)</span>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem" }}>
                <span style={{ color: "#71717a" }}>Need a JD?</span>
                <button
                  type="button"
                  onClick={handleTrySample}
                  style={{
                    padding: "0.25rem 0.65rem",
                    borderRadius: "6px",
                    background: "#f4f4f5",
                    border: "1px solid #e4e4e7",
                    color: "#09090b",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Try Sample
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div style={{ position: "relative" }}>
              <textarea
                rows={5}
                placeholder="Paste the job description here to get more accurate results..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                maxLength={5000}
                style={{
                  width: "100%",
                  padding: "0.75rem 0.85rem",
                  paddingBottom: "1.75rem",
                  borderRadius: "10px",
                  border: "1px solid #e4e4e7",
                  background: "#ffffff",
                  fontSize: "0.85rem",
                  color: "#09090b",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  lineHeight: 1.45,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "12px",
                  fontSize: "0.7rem",
                  color: "#a1a1aa",
                }}
              >
                {jobDescription.length}/5000
              </span>
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: "0.8125rem",
                fontWeight: 500,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* 3. Analyze Resume PDF Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button
              id="ats-submit-btn"
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.85rem 1.65rem",
                borderRadius: "10px",
                background: "#09090b",
                color: "#ffffff",
                border: "none",
                fontSize: "0.9375rem",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.85 : 1,
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
                transition: "all 0.15s ease",
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin-slow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span>{loadingStep}</span>
                </>
              ) : (
                <>
                  <span>✦</span>
                  <span>Analyze Resume PDF →</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom 4 Feature Cards ──────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
        }}
        className="mobile-column-stack"
      >
        {/* Card 1 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e4e4e7",
            padding: "1.1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#f4f4f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            🎯
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#09090b" }}>
              Accurate ATS Analysis
            </div>
            <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>
              Industry-standard evaluation
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e4e4e7",
            padding: "1.1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#f4f4f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            📑
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#09090b" }}>
              Section-wise Feedback
            </div>
            <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>
              Find and fix weak points
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e4e4e7",
            padding: "1.1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#f4f4f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            💡
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#09090b" }}>
              Actionable Suggestions
            </div>
            <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>
              Get personalized tips
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e4e4e7",
            padding: "1.1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#f4f4f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            📊
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#09090b" }}>
              Better Opportunities
            </div>
            <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>
              Stand out and get noticed
            </div>
          </div>
        </div>
      </div>

      {/* ── Results Report Section ──────────────────────────────────────────── */}
      {result && (
        <div
          id="ats-results-report"
          className="animate-fade-up"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
            marginTop: "1rem",
          }}
        >
          {/* Header Action Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#09090b", letterSpacing: "-0.02em" }}>
                ATS Resume Audit Report
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#71717a" }}>
                Audited against: <strong style={{ color: "#09090b" }}>{jobRole || "Custom Job Description"}</strong>
              </p>
            </div>
            <button
              onClick={handlePrint}
              style={{
                padding: "0.55rem 1.25rem",
                borderRadius: "8px",
                background: "#f4f4f5",
                border: "1px solid #e4e4e7",
                color: "#09090b",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>🖨️</span>
              <span>Export Report</span>
            </button>
          </div>

          {/* Primary Score Overview Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
              gap: "1rem",
            }}
            className="mobile-column-stack"
          >
            {/* Overall Score Card */}
            <div
              style={{
                background: "#09090b",
                borderRadius: "14px",
                padding: "1.5rem",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 8px 24px -4px rgba(0,0,0,0.18)",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>
                Overall ATS Score
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", margin: "0.5rem 0" }}>
                <span style={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1 }}>{Math.round(result.ats_score)}</span>
                <span style={{ fontSize: "1rem", color: "#a1a1aa" }}>/100</span>
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(255, 255, 255, 0.12)",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  width: "fit-content",
                }}
              >
                <span style={{ color: "#22c55e" }}>●</span>
                <span>{scoreLabel}</span>
              </div>
            </div>

            {/* Keyword Match */}
            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#71717a" }}>Keywords</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#09090b", margin: "0.35rem 0" }}>
                {Math.round(result.keyword_score)}%
              </div>
              <div style={{ height: "4px", background: "#f4f4f5", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${result.keyword_score}%`, background: "#09090b" }} />
              </div>
            </div>

            {/* Formatting Score */}
            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#71717a" }}>Formatting</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#09090b", margin: "0.35rem 0" }}>
                {Math.round(result.formatting_score)}%
              </div>
              <div style={{ height: "4px", background: "#f4f4f5", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${result.formatting_score}%`, background: "#09090b" }} />
              </div>
            </div>

            {/* Section Score */}
            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#71717a" }}>Sections</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#09090b", margin: "0.35rem 0" }}>
                {Math.round(result.section_score)}%
              </div>
              <div style={{ height: "4px", background: "#f4f4f5", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${result.section_score}%`, background: "#09090b" }} />
              </div>
            </div>

            {/* Impact Score */}
            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#71717a" }}>Impact & Verbs</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#09090b", margin: "0.35rem 0" }}>
                {Math.round(result.impact_score)}%
              </div>
              <div style={{ height: "4px", background: "#f4f4f5", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${result.impact_score}%`, background: "#09090b" }} />
              </div>
            </div>
          </div>

          {/* Section Audit & Keyword Matches */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="mobile-column-stack">
            {/* Section Breakdown */}
            <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "1.5rem" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#09090b", marginBottom: "1rem" }}>
                Standard Sections Audit
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {Object.entries(result.section_breakdown).map(([sec, present]) => (
                  <div
                    key={sec}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      background: present ? "#f0fdf4" : "#fef2f2",
                      border: present ? "1px solid #bbf7d0" : "1px solid #fecaca",
                    }}
                  >
                    <span style={{ color: present ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                      {present ? "✔" : "✕"}
                    </span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#09090b", textTransform: "capitalize" }}>
                      {sec}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyword Analysis */}
            <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "1.5rem" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#09090b", marginBottom: "1rem" }}>
                Semantic Keyword Analysis
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16a34a", marginBottom: "0.35rem" }}>
                    Matched Keywords ({result.keywords_matched.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {result.keywords_matched.length > 0 ? (
                      result.keywords_matched.map((kw) => (
                        <span
                          key={kw}
                          style={{
                            padding: "0.25rem 0.55rem",
                            borderRadius: "6px",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#16a34a",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {kw}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "#71717a" }}>None explicitly matched.</span>
                    )}
                  </div>
                </div>

                {result.keywords_missing.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#dc2626", marginBottom: "0.35rem" }}>
                      Missing Keywords ({result.keywords_missing.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {result.keywords_missing.map((kw) => (
                        <span
                          key={kw}
                          style={{
                            padding: "0.25rem 0.55rem",
                            borderRadius: "6px",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Priority Fixes & Suggestions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="mobile-column-stack">
            {/* Top 3 Priority Fixes */}
            <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "1.5rem" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#09090b", marginBottom: "1rem" }}>
                Top 3 Priority Fixes
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {result.top_three_fixes.map((fix, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "0.6rem",
                      padding: "0.75rem 0.95rem",
                      borderRadius: "8px",
                      background: "#fafafa",
                      border: "1px solid #e4e4e7",
                      fontSize: "0.8125rem",
                      color: "#09090b",
                      lineHeight: 1.45,
                    }}
                  >
                    <span style={{ fontWeight: 800, color: "#09090b" }}>#{idx + 1}</span>
                    <span>{fix}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Improvement Tips */}
            <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "1.5rem" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#09090b", marginBottom: "1rem" }}>
                Actionable Optimization Tips
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {result.improvement_suggestions.map((sug, idx) => (
                  <li key={idx} style={{ fontSize: "0.8125rem", color: "#3f3f46", lineHeight: 1.45 }}>
                    {sug}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested Bullet Rewrites */}
          {result.suggested_bullet_rewrites && result.suggested_bullet_rewrites.length > 0 && (
            <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "1.5rem" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#09090b", marginBottom: "1rem" }}>
                High-Impact Bullet Point Rewrites
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {result.suggested_bullet_rewrites.map((rw, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "1rem",
                      borderRadius: "10px",
                      background: "#fafafa",
                      border: "1px solid #e4e4e7",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase" }}>Original (Weak/Vague):</span>
                      <div style={{ fontSize: "0.8125rem", color: "#71717a", marginTop: "2px", textDecoration: "line-through" }}>
                        {rw.original}
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>High-Impact Optimized Version:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(rw.improved)}
                          style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            background: copiedKw === rw.improved ? "#16a34a" : "#ffffff",
                            border: "1px solid #e4e4e7",
                            color: copiedKw === rw.improved ? "#ffffff" : "#09090b",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {copiedKw === rw.improved ? "Copied! ✔" : "Copy"}
                        </button>
                      </div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#09090b", marginTop: "2px", lineHeight: 1.45 }}>
                        {rw.improved}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── "How it works?" Modal ───────────────────────────────────────────── */}
      {howItWorksOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setHowItWorksOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#09090b" }}>
                How ATS Resume Checker Works
              </div>
              <button
                onClick={() => setHowItWorksOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  color: "#71717a",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.85rem", color: "#3f3f46", lineHeight: 1.5 }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>1️⃣</span>
                <div>
                  <strong style={{ color: "#09090b" }}>PDF Layout & Parsing:</strong> Extracts text and scans for multi-columns, complex tables, and non-standard fonts that cause legacy ATS parsers to scramble text.
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>2️⃣</span>
                <div>
                  <strong style={{ color: "#09090b" }}>Section Completeness Audit:</strong> Validates essential sections (Contact Info, Experience, Education, Technical Skills, Projects).
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>3️⃣</span>
                <div>
                  <strong style={{ color: "#09090b" }}>Semantic Keyword Matching:</strong> Uses Sentence-BERT and stemming NLP algorithms to calculate alignment beyond simple keyword stuffing.
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>4️⃣</span>
                <div>
                  <strong style={{ color: "#09090b" }}>Action Verbs & AI Rewrites:</strong> Identifies weak filler phrases and generates high-impact, quantified bullet point alternatives.
                </div>
              </div>
            </div>

            <button
              onClick={() => setHowItWorksOpen(false)}
              style={{
                marginTop: "0.5rem",
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                background: "#09090b",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
