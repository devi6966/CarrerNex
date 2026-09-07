"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ReviewItem {
  id?: string;
  author: string;
  role: string;
  rating?: number;
  tag?: string;
  quote: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      id: "fb-1",
      author: "Devi Prasad",
      role: "React Developer Intern",
      rating: 5,
      tag: "ATS Resume Scorer",
      quote: "The ATS scorer's phrase weakness feedback is spot on! It helped me fix vague sentences and tailor my project descriptions to pass top screening rounds.",
    },
    {
      id: "fb-2",
      author: "Ananya Rao",
      role: "Cloud Architect Associate",
      rating: 5,
      tag: "HR Voice Interview",
      quote: "HR voice mode felt exactly like speaking to a real interviewer over Zoom. The instant transcriptions and 5-dimension scorecard were super insightful.",
    },
    {
      id: "fb-3",
      author: "Rohan Das",
      role: "Backend Engineer",
      rating: 5,
      tag: "Technical Skill Quizzes",
      quote: "The MCQ quizzes have really challenging questions with clear explanations. It is a fantastic tool to test logic depth before placement rounds.",
    },
    {
      id: "fb-4",
      author: "Priya Sharma",
      role: "B.Tech CSE, Final Year",
      rating: 5,
      tag: "Career Roadmap",
      quote: "The Career Roadmap broke down my entire prep into bite-sized milestones. Recommended projects and resources gave me a massive head start!",
    },
  ]);
  const [feedbackStats, setFeedbackStats] = useState({ average: 4.9, total: 4 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/feedback")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.feedbacks && data.feedbacks.length > 0) {
          setReviews(data.feedbacks);
          if (data.stats) {
            setFeedbackStats(data.stats);
          }
        }
      })
      .catch((err) => console.error("Error loading reviews:", err));
  }, []);

  return (
    <div className="bg-animated" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", color: "#0f172a" }}>
      
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav
        style={{
          borderBottom: "1px solid rgba(226, 232, 240, 0.9)",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand Logo matching reference */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "10px",
                background: "#f4f4f5",
                border: "1px solid #e4e4e7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}
            >
              🎓
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.3rem", color: "#09090b", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                CareerNex
              </div>
              <div style={{ fontSize: "0.625rem", color: "#71717a", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginTop: "0.15rem" }}>
                PLACEMENT GUIDE
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }} className="mobile-hide">
            {["Features", "Testimonials", "Pricing"].map((section) => (
              <a
                href={`#${section.toLowerCase()}`}
                key={section}
                style={{
                  color: "#475569",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
              >
                {section}
              </a>
            ))}
            <Link
              href="/feedback"
              style={{
                color: "#09090b",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>★</span>
              <span>Reviews</span>
            </Link>
          </div>

          {/* Right Actions matching reference */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {session?.user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }} className="mobile-hide">
                  Hi, {session.user.name?.split(" ")[0] || "User"} 👋
                </span>
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                  <button className="btn-gradient" style={{ padding: "0.55rem 1.35rem", fontSize: "0.875rem", borderRadius: "0.625rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>Dashboard</span>
                    <span>→</span>
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      padding: "0.45rem 1rem",
                      borderRadius: "0.625rem",
                      background: "transparent",
                      border: "none",
                      color: "#475569",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Sign In
                  </button>
                </Link>
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                  <button className="btn-gradient" style={{ padding: "0.55rem 1.35rem", fontSize: "0.875rem", borderRadius: "0.625rem" }}>
                    Dashboard →
                  </button>
                </Link>
              </>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-show"
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "0.5rem",
                padding: "0.4rem 0.65rem",
                fontSize: "1.2rem",
                color: "#0f172a",
                cursor: "pointer",
                display: "none",
                lineHeight: 1,
              }}
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Dropdown */}
        {mobileMenuOpen && (
          <div
            className="animate-fadeIn"
            style={{
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              borderBottom: "1px solid #e2e8f0",
              padding: "1.25rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: "#334155", fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none" }}
              >
                ⚡ Features Overview
              </a>
              <a
                href="#testimonials"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: "#334155", fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none" }}
              >
                💬 Candidate Testimonials
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: "#334155", fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none" }}
              >
                💳 Pricing Plans
              </a>
              <Link
                href="/feedback"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none" }}
              >
                ⭐ Give Rating & Feedback
              </Link>
            </div>

            <div style={{ height: "1px", background: "#e2e8f0" }}></div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>AI Modules</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <Link href="/dashboard/ats" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: "none", fontSize: "0.8125rem", color: "#334155", background: "#f8fafc", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                  📄 ATS Scorer
                </Link>
                <Link href="/dashboard/quiz" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: "none", fontSize: "0.8125rem", color: "#334155", background: "#f8fafc", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                  🧠 Skill Quiz
                </Link>
                <Link href="/dashboard/interview" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: "none", fontSize: "0.8125rem", color: "#334155", background: "#f8fafc", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                  🎙️ HR Voice
                </Link>
                <Link href="/dashboard/roadmap" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: "none", fontSize: "0.8125rem", color: "#334155", background: "#f8fafc", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                  🗺️ Roadmap
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section matching reference picture ───────────────────── */}
      <section
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "4.5rem 1.5rem 4rem",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          alignItems: "center",
          gap: "3.5rem",
        }}
        className="mobile-column-stack hero-responsive"
      >
        {/* Left Column: Copy & Actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
          {/* Pill Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#f4f4f5",
              border: "1px solid #e4e4e7",
              borderRadius: "9999px",
              padding: "0.35rem 1rem",
              fontSize: "0.8125rem",
              color: "#18181b",
              fontWeight: 600,
              marginBottom: "1.75rem",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34, 197, 94, 0.8)", display: "inline-block" }} />
            <span>💼</span>
            <span>Your Next Career Starts Here</span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: "clamp(2.5rem, 4.5vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.12,
              marginBottom: "1.35rem",
              color: "#000000",
              letterSpacing: "-0.035em",
            }}
          >
            Get Your Resume<br />
            Verified for<br />
            Placement Success
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color: "#52525b",
              maxWidth: "520px",
              margin: "0 0 2.25rem",
              fontSize: "1.0625rem",
              lineHeight: 1.6,
            }}
          >
            Upload your resume and get AI-powered analysis based on real job descriptions. Know what&apos;s working, what to improve, and get personalized suggestions to stand out.
          </p>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "3rem" }}>
            <Link href="/dashboard/ats" style={{ textDecoration: "none" }}>
              <button
                className="btn-gradient btn-pop"
                style={{
                  padding: "0.85rem 1.85rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  minWidth: "180px",
                  cursor: "pointer",
                  borderRadius: "0.625rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                }}
              >
                <span>Verify My Resume</span>
                <span className="arrow-slide">→</span>
              </button>
            </Link>
            <a href="#features" style={{ textDecoration: "none" }}>
              <button
                className="btn-ghost btn-pop"
                style={{
                  padding: "0.85rem 1.85rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  minWidth: "165px",
                  cursor: "pointer",
                  borderRadius: "0.625rem",
                }}
              >
                Explore Features
              </button>
            </a>
          </div>

          {/* 3 Mini Features Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.25rem",
              width: "100%",
              paddingTop: "1.75rem",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            {/* Feature 1 */}
            <div>
              <div style={{ fontSize: "1.25rem", marginBottom: "0.4rem", color: "#09090b" }}>⚡</div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#09090b", marginBottom: "0.2rem" }}>
                Instant Analysis
              </div>
              <div style={{ fontSize: "0.75rem", color: "#71717a", lineHeight: 1.45 }}>
                Get detailed feedback in seconds
              </div>
            </div>

            {/* Feature 2 */}
            <div>
              <div style={{ fontSize: "1.25rem", marginBottom: "0.4rem", color: "#09090b" }}>🎯</div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#09090b", marginBottom: "0.2rem" }}>
                Job-Specific Insights
              </div>
              <div style={{ fontSize: "0.75rem", color: "#71717a", lineHeight: 1.45 }}>
                Matched with real company requirements
              </div>
            </div>

            {/* Feature 3 */}
            <div>
              <div style={{ fontSize: "1.25rem", marginBottom: "0.4rem", color: "#09090b" }}>📊</div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#09090b", marginBottom: "0.2rem" }}>
                Actionable Suggestions
              </div>
              <div style={{ fontSize: "0.75rem", color: "#71717a", lineHeight: 1.45 }}>
                Improve and increase your chances
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Visual Resume Mockup & Floating Cards */}
        <div className="hero-mockup-wrapper">
          {/* Base Document: Resume Sheet (tilted counter-clockwise ~ -2.5deg) */}
          <div
            style={{
              width: "370px",
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e4e4e7",
              boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.02)",
              padding: "1.5rem",
              transform: "rotate(-2.5deg)",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* PDF Tab Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "#f4f4f5",
                  padding: "0.3rem 0.75rem",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#18181b",
                }}
              >
                <span>📄</span>
                <span>Your Resume.pdf</span>
              </div>
              {/* Curved connecting doodle arrow */}
              <svg width="34" height="20" viewBox="0 0 34 20" fill="none" style={{ opacity: 0.7 }}>
                <path d="M2 18 C 12 4, 22 4, 30 10" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="3 3" />
                <path d="M26 11 L 30 10 L 29 6" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>

            {/* Candidate Info */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b", letterSpacing: "-0.02em" }}>
                {session?.user?.name || "Narendar Modi"}
              </div>
              <div style={{ fontSize: "0.625rem", color: "#71717a", marginTop: "0.25rem", display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                <span>✉ {session?.user?.email || "meloni@modu.com"}</span>
                <span>|</span>
                <span>📞 +91 98765 43210</span>
                <span>|</span>
                <span>🔗 LinkedIn</span>
              </div>
            </div>

            {/* Section: EDUCATION */}
            <div style={{ marginBottom: "1.1rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                EDUCATION
              </div>
              <div style={{ height: "6px", width: "85%", background: "#e4e4e7", borderRadius: "999px", marginBottom: "0.35rem" }}></div>
              <div style={{ height: "6px", width: "65%", background: "#f4f4f5", borderRadius: "999px" }}></div>
            </div>

            {/* Section: PROJECTS */}
            <div style={{ marginBottom: "1.1rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                PROJECTS
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#71717a" }}></div>
                <div style={{ height: "6px", width: "90%", background: "#e4e4e7", borderRadius: "999px" }}></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#71717a" }}></div>
                <div style={{ height: "6px", width: "75%", background: "#e4e4e7", borderRadius: "999px" }}></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#71717a" }}></div>
                <div style={{ height: "6px", width: "82%", background: "#e4e4e7", borderRadius: "999px" }}></div>
              </div>
            </div>

            {/* Section: SKILLS */}
            <div style={{ marginBottom: "1.1rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                SKILLS
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {["Python", "SQL", "Machine Learning", "AWS"].map((skill) => (
                  <span
                    key={skill}
                    style={{
                      background: "#f4f4f5",
                      border: "1px solid #e4e4e7",
                      borderRadius: "6px",
                      padding: "0.2rem 0.55rem",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: "#27272a",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Section: EXPERIENCE */}
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                EXPERIENCE
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#71717a" }}></div>
                <div style={{ height: "6px", width: "88%", background: "#e4e4e7", borderRadius: "999px" }}></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#71717a" }}></div>
                <div style={{ height: "6px", width: "70%", background: "#f4f4f5", borderRadius: "999px" }}></div>
              </div>
            </div>
          </div>

          {/* Floating Card 1: Resume Score (Top-Right) */}
          <div
            className="anim-float"
            style={{
              position: "absolute",
              top: "-15px",
              right: "-15px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "1.25rem 1.35rem",
              border: "1px solid #e4e4e7",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)",
              width: "285px",
              zIndex: 10,
            }}
          >
            {/* Decorative Rays at Top Right */}
            <div style={{ position: "absolute", top: "-18px", right: "20px" }}>
              <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
                <line x1="6" y1="18" x2="2" y2="4" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
                <line x1="14" y1="18" x2="14" y2="2" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
                <line x1="22" y1="18" x2="26" y2="4" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Score Donut Row */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
              {/* Circular Gauge */}
              <div style={{ position: "relative", width: "68px", height: "68px", flexShrink: 0 }}>
                <svg width="68" height="68" viewBox="0 0 68 68">
                  {/* Background track circle */}
                  <circle
                    cx="34"
                    cy="34"
                    r="27"
                    fill="none"
                    stroke="#f4f4f5"
                    strokeWidth="6.5"
                  />
                  {/* Score 85% stroke: circumference = 2 * PI * 27 = 169.64 */}
                  {/* 85% filled => offset = 169.64 * (1 - 0.85) = 25.45 */}
                  <circle
                    cx="34"
                    cy="34"
                    r="27"
                    fill="none"
                    stroke="#09090b"
                    strokeWidth="6.5"
                    strokeDasharray="169.64"
                    strokeDashoffset="25.45"
                    strokeLinecap="round"
                    transform="rotate(-90 34 34)"
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#09090b" }}>85</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#71717a", marginTop: "2px" }}>/100</span>
                </div>
              </div>

              {/* Score Text */}
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#09090b" }}>Resume Score</div>
                <div style={{ fontSize: "0.75rem", color: "#52525b", marginTop: "0.2rem", lineHeight: 1.35 }}>
                  Good match for Software Developer roles.
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.45rem", borderTop: "1px solid #f4f4f5", paddingTop: "0.75rem" }}>
              {[
                { text: "Strong skills match", icon: "✓", type: "check" },
                { text: "Relevant projects found", icon: "✓", type: "check" },
                { text: "Good structure", icon: "✓", type: "check" },
                { text: "Consider adding more impact points", icon: "!", type: "alert" },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: item.type === "alert" ? "#3f3f46" : "#f4f4f5",
                      color: item.type === "alert" ? "#ffffff" : "#09090b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span style={{ color: "#27272a", fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Card 2: Suggestions (Bottom-Right) */}
          <div
            className="anim-float-rev"
            style={{
              position: "absolute",
              bottom: "-25px",
              right: "-5px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "1.15rem 1.35rem",
              border: "1px solid #e4e4e7",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)",
              width: "275px",
              zIndex: 15,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1rem" }}>💡</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#09090b" }}>Suggestions</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {[
                "Use quantifiable achievements",
                "Add relevant keywords from the job description",
                "Highlight impactful projects",
                "Improve your summary section",
              ].map((sug, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.75rem" }}>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: "#f4f4f5",
                      color: "#09090b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    ✓
                  </div>
                  <span style={{ color: "#27272a", fontWeight: 500, lineHeight: 1.35 }}>{sug}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Doodle: Curved arrow and handwritten cursive text */}
          <div
            style={{
              position: "absolute",
              bottom: "-75px",
              right: "20px",
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              zIndex: 5,
            }}
            className="mobile-hide"
          >
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
              <path
                d="M8 36 C 2 22, 14 5, 35 10"
                stroke="#27272a"
                strokeWidth="1.75"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M27 6 L 36 10 L 32 17"
                stroke="#27272a"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#27272a",
                transform: "rotate(-3deg)",
                lineHeight: 1.15,
                whiteSpace: "nowrap",
              }}
            >
              Turn your resume<br />into opportunities
            </span>
          </div>
        </div>
      </section>

      {/* ── Features Section matching reference image 2 ──────────────────── */}
      <section
        id="features"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "5rem 1.5rem",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          {/* Pill Badge matching reference 2 */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#f4f4f5",
              border: "1px solid #e4e4e7",
              borderRadius: "9999px",
              padding: "0.35rem 1rem",
              fontSize: "0.8125rem",
              color: "#18181b",
              fontWeight: 600,
              marginBottom: "1.25rem",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>Your Next Career Starts Here</span>
          </div>

          <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, color: "#000000", letterSpacing: "-0.03em" }}>
            Engineered for Top Placement Success
          </h2>
          <p style={{ color: "#52525b", fontSize: "1.0625rem", marginTop: "0.6rem" }}>
            Everything you need to stand out, prepare, and land top roles at high-growth companies.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="features-grid-4">
          {/* ── Card 1: ATS Resume Scorer ─────────────────────────────────── */}
          <div
            className="glass-card box-pop"
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1.25rem",
              width: "100%",
              borderRadius: "1.25rem",
              background: "#ffffff",
              border: "1px solid #e4e4e7",
            }}
          >
            <div>
              {/* Top Visual Illustration: Resume + ATS Score Donut */}
              <div
                style={{
                  height: "170px",
                  background: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                {/* Decorative sparkles */}
                <span style={{ position: "absolute", top: "12px", left: "14px", color: "#94a3b8", fontSize: "0.85rem", opacity: 0.7 }}>✦</span>
                <span style={{ position: "absolute", top: "14px", right: "18px", color: "#94a3b8", fontSize: "0.7rem", opacity: 0.6 }}>✦</span>

                {/* Left: Tilted Resume Sheet */}
                <div
                  style={{
                    width: "115px",
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 6px 16px -4px rgba(15, 23, 42, 0.08)",
                    padding: "0.55rem",
                    transform: "rotate(-4deg) translateX(-10px)",
                    zIndex: 1,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Animated laser scanner line */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: "linear-gradient(90deg, transparent, #2563eb, transparent)",
                      boxShadow: "0 0 8px #2563eb",
                      animation: "scanBeam 2.5s ease-in-out infinite",
                      zIndex: 3,
                    }}
                  />
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      background: "#f4f4f5",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                      fontSize: "0.55rem",
                      fontWeight: 700,
                      color: "#18181b",
                      marginBottom: "0.45rem",
                    }}
                  >
                    <span>📄</span>
                    <span>Resume.pdf</span>
                  </div>
                  <div style={{ height: "4px", width: "85%", background: "#09090b", borderRadius: "999px", marginBottom: "0.3rem" }}></div>
                  <div style={{ height: "3px", width: "70%", background: "#cbd5e1", borderRadius: "999px", marginBottom: "0.25rem" }}></div>
                  <div style={{ height: "3px", width: "90%", background: "#e2e8f0", borderRadius: "999px", marginBottom: "0.25rem" }}></div>
                  <div style={{ height: "3px", width: "60%", background: "#e2e8f0", borderRadius: "999px", marginBottom: "0.25rem" }}></div>
                  <div style={{ height: "3px", width: "75%", background: "#e2e8f0", borderRadius: "999px" }}></div>
                </div>

                {/* Right: Floating Score Card */}
                <div
                  className="anim-float"
                  style={{
                    width: "98px",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 10px 22px -4px rgba(15, 23, 42, 0.12)",
                    padding: "0.5rem 0.4rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transform: "translateX(10px)",
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#09090b", marginBottom: "0.25rem" }}>
                    ATS Score
                  </div>
                  {/* Donut Gauge for 92 */}
                  <div style={{ position: "relative", width: "50px", height: "50px", marginBottom: "0.3rem" }}>
                    <svg width="50" height="50" viewBox="0 0 50 50">
                      <circle cx="25" cy="25" r="20" fill="none" stroke="#f4f4f5" strokeWidth="4.5" />
                      <circle
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="#09090b"
                        strokeWidth="4.5"
                        strokeDasharray="125.66"
                        strokeDashoffset="10.05"
                        strokeLinecap="round"
                        transform="rotate(-90 25 25)"
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#09090b" }}>92</span>
                      <span style={{ fontSize: "0.45rem", fontWeight: 600, color: "#71717a" }}>/100</span>
                    </div>
                  </div>
                  {/* Status pill: Good Match */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.2rem",
                      background: "#ecfdf5",
                      border: "1px solid #bbf7d0",
                      borderRadius: "999px",
                      padding: "0.15rem 0.4rem",
                      fontSize: "0.525rem",
                      fontWeight: 700,
                      color: "#15803d",
                    }}
                  >
                    <span>✓</span>
                    <span>Good Match</span>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b", marginTop: "0", marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
                ATS Resume Scorer
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#52525b", lineHeight: 1.55 }}>
                Deep multidimensional analysis of resume layout, font subsets, action verbs, and Sentence-BERT semantic keyword matching against any JD.
              </p>
            </div>

            {/* Bottom Button (Solid Black) */}
            <Link href="/dashboard/ats" style={{ textDecoration: "none", width: "100%" }}>
              <button
                className="btn-gradient btn-pop"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "0.625rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                }}
              >
                <span>Analyze Resume</span>
                <span className="arrow-slide">→</span>
              </button>
            </Link>
          </div>

          {/* ── Card 2: Technical Skill Quizzes ───────────────────────────── */}
          <div
            className="glass-card box-pop"
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1.25rem",
              width: "100%",
              borderRadius: "1.25rem",
              background: "#ffffff",
              border: "1px solid #e4e4e7",
            }}
          >
            <div>
              {/* Top Visual Illustration: Code Editor + MCQ Options */}
              <div
                style={{
                  height: "170px",
                  background: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                {/* Floating Lightbulb */}
                <div
                  className="anim-float"
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "12px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    zIndex: 3,
                  }}
                >
                  💡
                </div>

                {/* Left: Dark Code Editor Window */}
                <div
                  style={{
                    width: "110px",
                    background: "#18181b",
                    borderRadius: "8px",
                    padding: "0.5rem 0.55rem",
                    boxShadow: "0 6px 16px -4px rgba(0, 0, 0, 0.2)",
                    transform: "translateX(-8px)",
                    zIndex: 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.45rem" }}>
                    <span style={{ fontSize: "0.55rem", fontFamily: "monospace", color: "#a1a1aa", fontWeight: 700 }}>&lt;/&gt;</span>
                    <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#71717a" }}></div>
                  </div>
                  <div style={{ height: "3px", width: "45%", background: "#60a5fa", borderRadius: "999px", marginBottom: "0.25rem" }}></div>
                  <div style={{ height: "3px", width: "80%", background: "#3f3f46", borderRadius: "999px", marginBottom: "0.25rem" }}></div>
                  <div style={{ height: "3px", width: "65%", background: "#3f3f46", borderRadius: "999px", marginBottom: "0.25rem" }}></div>
                  <div style={{ height: "3px", width: "90%", background: "#52525b", borderRadius: "999px", marginBottom: "0.25rem" }}></div>
                  <div style={{ height: "3px", width: "50%", background: "#3f3f46", borderRadius: "999px" }}></div>
                </div>

                {/* Right: MCQ Option Card */}
                <div
                  style={{
                    width: "115px",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 10px 22px -4px rgba(15, 23, 42, 0.12)",
                    padding: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                    transform: "translateX(8px)",
                    zIndex: 2,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.15rem 0.25rem", borderRadius: "4px", background: "#f8fafc" }}>
                    <div style={{ width: "13px", height: "13px", borderRadius: "50%", background: "#e4e4e7", color: "#52525b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.45rem", fontWeight: 700 }}>A</div>
                    <div style={{ height: "3px", width: "70%", background: "#cbd5e1", borderRadius: "999px" }}></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.15rem 0.25rem", borderRadius: "4px", background: "#f4f4f5", border: "1px solid #e4e4e7" }}>
                    <div style={{ width: "13px", height: "13px", borderRadius: "50%", background: "#09090b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.45rem", fontWeight: 700 }}>B</div>
                    <div style={{ height: "3px", width: "85%", background: "#09090b", borderRadius: "999px" }}></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.15rem 0.25rem", borderRadius: "4px", background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                    <div style={{ width: "13px", height: "13px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.45rem", fontWeight: 700 }}>✓</div>
                    <div style={{ height: "3px", width: "60%", background: "#059669", borderRadius: "999px" }}></div>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b", marginTop: "0", marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
                Technical Skill Quizzes
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#52525b", lineHeight: 1.55 }}>
                Dynamic, multi-difficulty technical MCQs customized for backend, frontend, cloud, or DSA roles with educational explanations.
              </p>
            </div>

            {/* Bottom Button (Ghost White) */}
            <Link href="/dashboard/quiz" style={{ textDecoration: "none", width: "100%" }}>
              <button
                className="btn-ghost btn-pop"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "0.625rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                }}
              >
                <span>Take Practice Quiz</span>
                <span className="arrow-slide">→</span>
              </button>
            </Link>
          </div>

          {/* ── Card 3: HR Voice Interview ────────────────────────────────── */}
          <div
            className="glass-card box-pop"
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1.25rem",
              width: "100%",
              borderRadius: "1.25rem",
              background: "#ffffff",
              border: "1px solid #e4e4e7",
            }}
          >
            <div>
              {/* Top Visual Illustration: 3D Robot + Dynamic Soundwaves + Speech Bubble */}
              <div
                style={{
                  height: "170px",
                  background: "linear-gradient(145deg, #f8fafc 0%, #eff6ff 100%)",
                  borderRadius: "14px",
                  border: "1px solid #dbeafe",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                {/* Speech Bubble with Subtle Pulse */}
                <div
                  className="anim-pulse-subtle"
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "10px",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #bfdbfe",
                    boxShadow: "0 6px 14px rgba(37, 99, 235, 0.12)",
                    padding: "0.3rem 0.55rem",
                    fontSize: "0.575rem",
                    fontWeight: 700,
                    color: "#2563eb",
                    lineHeight: 1.25,
                    zIndex: 4,
                  }}
                >
                  "Let's begin<br />your interview..."
                </div>

                {/* Left Soundwaves with Real Equalizer Bounce */}
                <div style={{ display: "flex", alignItems: "center", gap: "3.5px", marginRight: "10px" }}>
                  <div style={{ width: "3.5px", height: "16px", background: "#93c5fd", borderRadius: "999px", animation: "equalizerBounce 1.1s ease-in-out infinite", animationDelay: "0.1s" }}></div>
                  <div style={{ width: "3.5px", height: "28px", background: "#60a5fa", borderRadius: "999px", animation: "equalizerBounce 1.1s ease-in-out infinite", animationDelay: "0.3s" }}></div>
                  <div style={{ width: "3.5px", height: "18px", background: "#3b82f6", borderRadius: "999px", animation: "equalizerBounce 1.1s ease-in-out infinite", animationDelay: "0.5s" }}></div>
                  <div style={{ width: "3.5px", height: "36px", background: "#2563eb", borderRadius: "999px", animation: "equalizerBounce 1.1s ease-in-out infinite", animationDelay: "0.2s" }}></div>
                  <div style={{ width: "3.5px", height: "22px", background: "#60a5fa", borderRadius: "999px", animation: "equalizerBounce 1.1s ease-in-out infinite", animationDelay: "0.4s" }}></div>
                </div>

                {/* Center 3D AI Interviewer Mascot */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, position: "relative" }}>
                  <img
                    src="/images/robot-interviewer.png"
                    alt="AI Recruiter Alex"
                    style={{
                      width: "84px",
                      height: "84px",
                      objectFit: "contain",
                      filter: "drop-shadow(0 10px 18px rgba(37, 99, 235, 0.28))",
                      animation: "floatSlow 3.4s ease-in-out infinite",
                    }}
                  />
                </div>

                {/* Right Soundwaves with Real Equalizer Bounce */}
                <div style={{ display: "flex", alignItems: "center", gap: "3.5px", marginLeft: "10px" }}>
                  <div style={{ width: "3.5px", height: "22px", background: "#60a5fa", borderRadius: "999px", animation: "equalizerBounce 1.1s ease-in-out infinite", animationDelay: "0.4s" }}></div>
                  <div style={{ width: "3.5px", height: "36px", background: "#2563eb", borderRadius: "999px", animation: "equalizerBounce 1.1s ease-in-out infinite", animationDelay: "0.2s" }}></div>
                  <div style={{ width: "3.5px", height: "18px", background: "#3b82f6", borderRadius: "999px", animation: "equalizerBounce 1.1s ease-in-out infinite", animationDelay: "0.5s" }}></div>
                  <div style={{ width: "3.5px", height: "28px", background: "#60a5fa", borderRadius: "999px", animation: "equalizerBounce 1.1s ease-in-out infinite", animationDelay: "0.3s" }}></div>
                  <div style={{ width: "3.5px", height: "16px", background: "#93c5fd", borderRadius: "999px", animation: "equalizerBounce 1.1s ease-in-out infinite", animationDelay: "0.1s" }}></div>
                </div>
              </div>

              {/* Title & Description */}
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b", marginTop: "0", marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
                HR Voice Interview
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#52525b", lineHeight: 1.55 }}>
                Real-time voice conversation with AI recruiter Alex. Receive instant spoken questions and a 5-dimension competency scorecard.
              </p>
            </div>

            {/* Bottom Button (Solid Black) */}
            <Link href="/dashboard/interview" style={{ textDecoration: "none", width: "100%" }}>
              <button
                className="btn-gradient btn-pop"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "0.625rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                }}
              >
                <span>Start Voice Session</span>
                <span className="arrow-slide">→</span>
              </button>
            </Link>
          </div>

          {/* ── Card 4: Career Roadmap ───────────────────────────────────── */}
          <div
            className="glass-card box-pop"
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1.25rem",
              width: "100%",
              borderRadius: "1.25rem",
              background: "#ffffff",
              border: "1px solid #e4e4e7",
            }}
          >
            <div>
              {/* Top Visual Illustration: Winding Path + Roadmap Pins + Finish Flag */}
              <div
                style={{
                  height: "170px",
                  background: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.5rem",
                  marginBottom: "1.25rem",
                }}
              >
                {/* Winding Road SVG */}
                <svg width="250" height="150" viewBox="0 0 250 150" fill="none" style={{ position: "absolute", inset: 0 }}>
                  <path
                    d="M -10 150 C 40 130, 90 145, 140 100 C 180 65, 200 45, 240 25"
                    stroke="#e2e8f0"
                    strokeWidth="28"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M -10 150 C 40 130, 90 145, 140 100 C 180 65, 200 45, 240 25"
                    stroke="#ffffff"
                    strokeWidth="22"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M -10 150 C 40 130, 90 145, 140 100 C 180 65, 200 45, 240 25"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    fill="none"
                  />
                </svg>

                {/* Milestone Pin 1 */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "26px",
                    left: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    background: "#ffffff",
                    borderRadius: "999px",
                    padding: "0.18rem 0.45rem",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
                    zIndex: 2,
                  }}
                >
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#09090b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.45rem" }}>📍</div>
                  <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#18181b", whiteSpace: "nowrap" }}>Gain Experience</span>
                </div>

                {/* Milestone Pin 2 */}
                <div
                  style={{
                    position: "absolute",
                    top: "30px",
                    left: "55px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    background: "#ffffff",
                    borderRadius: "999px",
                    padding: "0.18rem 0.45rem",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
                    zIndex: 2,
                  }}
                >
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#09090b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.45rem" }}>📍</div>
                  <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#18181b", whiteSpace: "nowrap" }}>Create Portfolio</span>
                </div>

                {/* Milestone Pin 3 */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "32px",
                    right: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    background: "#ffffff",
                    borderRadius: "999px",
                    padding: "0.18rem 0.45rem",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
                    zIndex: 2,
                  }}
                >
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#09090b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.45rem" }}>📍</div>
                  <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#18181b", whiteSpace: "nowrap" }}>Build Portfolio</span>
                </div>

                {/* Finish Flag */}
                <div
                  className="anim-pulse-subtle"
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    background: "#09090b",
                    color: "#ffffff",
                    borderRadius: "999px",
                    padding: "0.25rem 0.55rem",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.18)",
                    zIndex: 3,
                  }}
                >
                  <span style={{ fontSize: "0.6rem" }}>🚩</span>
                  <span style={{ fontSize: "0.55rem", fontWeight: 700, whiteSpace: "nowrap" }}>Dream Job Ahead</span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b", marginTop: "0", marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
                Career Roadmap
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#52525b", lineHeight: 1.55 }}>
                Generate highly customized step-by-step career path milestones, missing skill gaps, and curated project portfolios dynamically.
              </p>
            </div>

            {/* Bottom Button (Ghost White) */}
            <Link href="/dashboard/roadmap" style={{ textDecoration: "none", width: "100%" }}>
              <button
                className="btn-ghost btn-pop"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "0.625rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                }}
              >
                <span>Build Career Roadmap</span>
                <span className="arrow-slide">→</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials Section matching reference image 2 ────────────── */}
      <section
        id="testimonials"
        style={{
          borderTop: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
          background: "transparent",
          padding: "5.5rem 1.5rem 4.5rem",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          {/* Header Area with Left Handwritten Note & Right 10K+ Card */}
          <div style={{ position: "relative", textAlign: "center", marginBottom: "3.5rem" }}>
            {/* Left Annotation (Handwritten text + curved arrow) */}
            <div
              style={{
                position: "absolute",
                left: "15px",
                top: "-15px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                zIndex: 5,
              }}
              className="tablet-hide"
            >
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#27272a",
                  transform: "rotate(-10deg)",
                  lineHeight: 1.15,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                Thousands<br />of learners<br />trust CareerNex
              </span>
              <svg width="46" height="42" viewBox="0 0 46 42" fill="none" style={{ marginTop: "4px", marginRight: "-8px" }}>
                <path d="M6 8 C 12 28, 26 36, 38 28" stroke="#27272a" strokeWidth="1.75" strokeLinecap="round" fill="none" />
                <path d="M30 24 L 38 28 L 35 37" stroke="#27272a" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>

            {/* Right Floating Metric Card */}
            <div
              style={{
                position: "absolute",
                right: "15px",
                top: "-15px",
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                borderRadius: "16px",
                padding: "0.85rem 1.25rem",
                boxShadow: "0 10px 25px -4px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0, 0, 0, 0.02)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                transform: "rotate(2deg)",
                zIndex: 5,
              }}
              className="tablet-hide"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#09090b", letterSpacing: "-0.02em", marginTop: "0.3rem", lineHeight: 1 }}>
                10K+
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#09090b", marginTop: "0.25rem" }}>
                Happy Learners
              </div>
              <div style={{ fontSize: "0.65rem", color: "#71717a", marginTop: "0.15rem" }}>
                Across 15+ Countries
              </div>
            </div>

            {/* Pill Badge matching reference 2 */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#f4f4f5",
                border: "1px solid #e4e4e7",
                borderRadius: "9999px",
                padding: "0.35rem 1rem",
                fontSize: "0.8125rem",
                color: "#18181b",
                fontWeight: 600,
                marginBottom: "1.25rem",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <span>💬</span>
              <span>Real Stories. Real Growth.</span>
            </div>

            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.85rem)", fontWeight: 800, color: "#000000", letterSpacing: "-0.035em" }}>
              Loved by Candidates Worldwide
            </h2>
            <p style={{ color: "#52525b", fontSize: "1.0625rem", marginTop: "0.6rem", maxWidth: "650px", margin: "0.6rem auto 1.75rem", lineHeight: 1.6 }}>
              Real feedback from students and job seekers who prepared with CareerNex.<br />
              You can also share your rating and experience!
            </p>

            {/* Requested Feature: Buttons to open feedback & see reviews */}
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/feedback" style={{ textDecoration: "none" }}>
                <button
                  className="btn-gradient btn-pop"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.8rem 1.85rem",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    borderRadius: "0.625rem",
                  }}
                >
                  <span>★</span>
                  <span>Give Your Feedback &amp; Rating →</span>
                </button>
              </Link>
              <Link href="/feedback" style={{ textDecoration: "none" }}>
                <button
                  className="btn-ghost btn-pop"
                  style={{
                    padding: "0.8rem 1.5rem",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    borderRadius: "0.625rem",
                  }}
                >
                  View All Reviews ({reviews.length || 7})
                </button>
              </Link>
            </div>
          </div>

          {/* 6 Testimonial Cards in 3x2 Grid */}
          <div className="features-grid-3">
            {reviews.slice(0, 6).map((t, idx) => {
              const palette = [
                { bg: "#e0f2fe", color: "#0284c7" }, // Blue
                { bg: "#ede9fe", color: "#7c3aed" }, // Purple
                { bg: "#ccfbf1", color: "#0f766e" }, // Teal/Mint
                { bg: "#fce7f3", color: "#be185d" }, // Pink
                { bg: "#fef3c7", color: "#b45309" }, // Amber
                { bg: "#e0e7ff", color: "#4338ca" }, // Indigo
              ][idx % 6];

              return (
                <div
                  key={t.id || idx}
                  className="glass-card box-pop"
                  style={{
                    padding: "1.5rem 1.65rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "#ffffff",
                    borderRadius: "1.25rem",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  <div>
                    {/* Top row: 5 Stars + Neutral Category Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", gap: "2px", color: "#f59e0b", fontSize: "1rem" }}>
                        {"★".repeat(t.rating || 5)}
                        {"☆".repeat(5 - (t.rating || 5))}
                      </div>
                      {t.tag && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: "#f4f4f5",
                            color: "#18181b",
                            padding: "0.2rem 0.65rem",
                            borderRadius: "9999px",
                            border: "1px solid #e4e4e7",
                          }}
                        >
                          {t.tag}
                        </span>
                      )}
                    </div>

                    {/* Middle: Quotation Icon + Quote */}
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", margin: "1rem 0 1.5rem" }}>
                      <span style={{ fontSize: "1.6rem", lineHeight: 1, color: "#94a3b8", fontWeight: 800, fontFamily: "serif", flexShrink: 0 }}>
                        “
                      </span>
                      <p style={{ fontSize: "0.9375rem", color: "#3f3f46", lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                        {t.quote}
                      </p>
                    </div>
                  </div>

                  {/* Bottom row: Avatar, Name + Black Verified Circle, Role, and Three Dots Menu */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: palette.bg,
                          color: palette.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.875rem",
                          flexShrink: 0,
                        }}
                      >
                        {(t.author || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <span style={{ fontWeight: 800, fontSize: "0.9375rem", color: "#09090b" }}>{t.author}</span>
                          {/* Black verified circle with white check */}
                          <div
                            style={{
                              width: "14px",
                              height: "14px",
                              borderRadius: "50%",
                              background: "#09090b",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.55rem",
                              fontWeight: 900,
                              flexShrink: 0,
                            }}
                          >
                            ✓
                          </div>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>{t.role}</div>
                      </div>
                    </div>

                    {/* Three dots menu */}
                    <span style={{ color: "#71717a", fontSize: "1.15rem", letterSpacing: "1px", cursor: "pointer" }}>
                      •••
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Carousel Controls: 3 Dots in center, Arrow buttons on right */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "2.75rem",
              position: "relative",
            }}
          >
            <div style={{ width: "80px" }} className="mobile-hide"></div>

            {/* Pagination Dots */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", margin: "0 auto" }}>
              <div style={{ width: "20px", height: "7px", borderRadius: "999px", background: "#09090b" }}></div>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#cbd5e1" }}></div>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#cbd5e1" }}></div>
            </div>

            {/* Arrow controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                className="btn-pop"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#18181b",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                }}
                aria-label="Previous Reviews"
              >
                ‹
              </button>
              <button
                className="btn-pop"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#18181b",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                }}
                aria-label="Next Reviews"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ─────────────────────────────────────────────── */}
      <section
        id="pricing"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "5rem 1.5rem",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
            Simple, Transparent Plans
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", marginTop: "0.5rem" }}>
            Get started for free or unlock unlimited AI evaluation metrics.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", maxWidth: "850px", margin: "0 auto" }}>
          {[
            {
              name: "Student Plan",
              price: "$0",
              features: ["Unlimited resume scoring", "Level 1-3 Skill Quizzes", "Real-time voice coach practice", "Free career roadmap generator"],
              cta: "Launch Dashboard",
              popular: false,
            },
            {
              name: "Pro Accelerator",
              price: "$19",
              features: ["Priority Gemini 2.0 Flash access", "Company-specific question banks", "AI video replay & pronunciation audit", "1-on-1 human mentor review"],
              cta: "Upgrade to Pro",
              popular: true,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className="glass-card"
              style={{
                padding: "2.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                border: plan.popular ? "2px solid #2563eb" : "1px solid #e2e8f0",
                background: "#ffffff",
                boxShadow: plan.popular ? "0 10px 30px rgba(37, 99, 235, 0.1)" : undefined,
              }}
            >
              {plan.popular && (
                <div style={{
                  alignSelf: "flex-start",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: "0.6875rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  padding: "0.3rem 0.75rem",
                  borderRadius: "9999px",
                  marginTop: "-1.5rem",
                  marginBottom: "0.5rem",
                  letterSpacing: "0.05em",
                }}>
                  Recommended
                </div>
              )}
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>{plan.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0f172a" }}>{plan.price}</span>
                  <span style={{ fontSize: "0.875rem", color: "#64748b" }}>/ month</span>
                </div>
              </div>

              <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingLeft: "1.25rem", color: "#334155", fontSize: "0.9375rem" }}>
                {plan.features.map((feat) => (
                  <li key={feat}>{feat}</li>
                ))}
              </ul>

              <Link href="/dashboard" style={{ textDecoration: "none", marginTop: "auto" }}>
                <button
                  className={plan.popular ? "btn-gradient" : "btn-ghost"}
                  style={{
                    width: "100%",
                    padding: "0.8rem 1rem",
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                  }}
                >
                  {plan.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid #e2e8f0",
          background: "#ffffff",
          padding: "4.5rem 1.5rem 3rem",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "3rem",
            marginBottom: "3rem",
          }}
        >
          {/* Brand info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <img
                src="/logo.jpg"
                alt="CareerNex Logo"
                style={{ width: 28, height: 28, borderRadius: "6px", objectFit: "cover" }}
              />
              <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "#0f172a" }}>CareerNex</span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.5 }}>
              AI-powered placement preparation & recruitment readiness platform.
            </p>
          </div>

            {/* Product Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Product</h4>
              <Link href="/dashboard/ats" style={{ fontSize: "0.875rem", color: "#475569", textDecoration: "none" }}>ATS Resume Scorer</Link>
              <Link href="/dashboard/quiz" style={{ fontSize: "0.875rem", color: "#475569", textDecoration: "none" }}>Skill Quizzes</Link>
              <Link href="/dashboard/interview" style={{ fontSize: "0.875rem", color: "#475569", textDecoration: "none" }}>HR Voice Coach</Link>
              <Link href="/dashboard/roadmap" style={{ fontSize: "0.875rem", color: "#475569", textDecoration: "none" }}>Career Roadmap</Link>
              <Link href="/feedback" style={{ fontSize: "0.875rem", color: "#475569", textDecoration: "none" }}>Candidate Reviews</Link>
            </div>

            {/* Technology stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Engine</h4>
              {["FastAPI Python Backend", "Next.js 16 + React 19", "Google Gemini 2.5 Flash", "Sentence-Transformers"].map((t) => (
                <span key={t} style={{ fontSize: "0.875rem", color: "#64748b" }}>{t}</span>
              ))}
            </div>

            {/* Contact / Social */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Connect</h4>
              <span style={{ fontSize: "0.875rem", color: "#64748b" }}>support@careernex.ai</span>
              <span style={{ fontSize: "0.875rem", color: "#64748b" }}>GitHub Repository</span>
            </div>
          </div>

          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              borderTop: "1px solid #f1f5f9",
              paddingTop: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              fontSize: "0.8125rem",
              color: "#94a3b8",
            }}
          >
            <span>© {new Date().getFullYear()} CareerNex. All rights reserved.</span>
            <span>Built by Devi Prasad Singh</span>
          </div>
      </footer>

    </div>
  );
}
