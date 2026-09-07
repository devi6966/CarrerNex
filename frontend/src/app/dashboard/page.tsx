"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  getUserData,
  seedDemoActivity,
  clearUserHistory,
  formatTimeAgo,
  UserProfileData,
} from "@/lib/userStore";

export default function Dashboard() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Candidate";
  const userEmail = session?.user?.email;

  const [profileData, setProfileData] = useState<UserProfileData>({
    email: userEmail || "",
    activities: [],
    metrics: {
      atsOptimization: null,
      communicationVoice: null,
      quizDepth: null,
      overallReadiness: null,
    },
    lastUpdated: Date.now(),
  });

  const [showAllActivities, setShowAllActivities] = useState(false);

  // Load user data whenever session / email changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = getUserData(userEmail);
      setProfileData(data);
    }
  }, [userEmail]);

  // Listen for user data updates dispatched across pages
  useEffect(() => {
    const handleDataUpdate = (e: any) => {
      const updatedEmail = e?.detail?.email;
      if (!updatedEmail || updatedEmail.toLowerCase() === (userEmail || "guest_user").toLowerCase()) {
        const data = getUserData(userEmail);
        setProfileData(data);
      }
    };

    window.addEventListener("careernex_user_data_updated", handleDataUpdate);
    return () => {
      window.removeEventListener("careernex_user_data_updated", handleDataUpdate);
    };
  }, [userEmail]);

  const handleSeedDemo = () => {
    const data = seedDemoActivity(userEmail);
    setProfileData(data);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your activity history and metrics?")) {
      clearUserHistory(userEmail);
      const data = getUserData(userEmail);
      setProfileData(data);
    }
  };

  const tools = [
    {
      title: "ATS Resume Checker",
      desc: "Analyze your PDF formatting, detect phrasing weaknesses, and verify semantic key requirements using spaCy + Gemini.",
      icon: "📄",
      href: "/dashboard/ats",
      color: "#2563eb",
    },
    {
      title: "Skill Quiz",
      desc: "Practice 10 technical MCQ questions targeted to your job title and chosen difficulty level with explanations.",
      icon: "🧠",
      href: "/dashboard/quiz",
      color: "#0284c7",
    },
    {
      title: "HR Voice Interview",
      desc: "Simulate zoom-style real-time voice coaching. Speak directly through speech recognition to get parsed evaluations.",
      icon: "🎙️",
      href: "/dashboard/interview",
      color: "#059669",
    },
    {
      title: "Career Roadmap",
      desc: "Map your milestones, track learning stacks, and explore customized recommendations to level up your career.",
      icon: "🗺️",
      href: "/dashboard/roadmap",
      color: "#d97706",
    },
  ];

  const { activities, metrics } = profileData;
  const displayedActivities = showAllActivities ? activities : activities.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* ── Welcome Banner matching target reference image ─────────────────── */}
      <div
        className="glass-card box-pop"
        style={{
          padding: "2rem 2.25rem",
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid #e4e4e7",
          borderRadius: "1.25rem",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
          {/* Left Column: Greeting, details & 3 features */}
          <div style={{ flex: 1, minWidth: "280px" }}>
            {/* Pill Badge with Live Beacon */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.55rem",
                background: "#ffffff",
                padding: "0.32rem 0.9rem",
                borderRadius: "9999px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#18181b",
                marginBottom: "0.875rem",
                border: "1px solid #e4e4e7",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "8px", height: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                <span style={{ position: "absolute", width: "16px", height: "16px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.45)", animation: "pulseGlow 2s infinite" }}></span>
              </span>
              <span>🚀 Ready for Placements</span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.25rem)",
                fontWeight: 800,
                color: "#000000",
                marginBottom: "0.55rem",
                letterSpacing: "-0.03em",
              }}
            >
              Welcome back, {userName}! 👋
            </h1>

            {/* Subtitle */}
            <p style={{ color: "#52525b", fontSize: "0.9375rem", lineHeight: 1.6, maxWidth: "660px", marginBottom: "1.75rem" }}>
              {userEmail ? (
                <span>
                  Signed in as <strong style={{ color: "#09090b" }}>{userEmail}</strong>. Your placement preparation records and readiness scores are exclusively mapped to your personal account.
                </span>
              ) : (
                "Your recruitment readiness portal is up to date. Check your resume against recent job descriptions, take a dynamic skill quiz, or practice real voice interview rounds."
              )}
            </p>

            {/* 3 Mini Stats / Highlights row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2rem",
                flexWrap: "wrap",
                borderTop: "1px solid #e4e4e7",
                paddingTop: "1.25rem",
              }}
            >
              {/* Stat 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <span style={{ fontSize: "1.35rem" }}>🎯</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.8125rem", color: "#09090b" }}>Stay Consistent</div>
                  <div style={{ fontSize: "0.7rem", color: "#71717a" }}>Practice Regularly</div>
                </div>
              </div>

              {/* Stat 2 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <span style={{ fontSize: "1.35rem" }}>📊</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.8125rem", color: "#09090b" }}>Track Progress</div>
                  <div style={{ fontSize: "0.7rem", color: "#71717a" }}>See Real Improvement</div>
                </div>
              </div>

              {/* Stat 3 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <span style={{ fontSize: "1.35rem" }}>⭐</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.8125rem", color: "#09090b" }}>Get Placements Ready</div>
                  <div style={{ fontSize: "0.7rem", color: "#71717a" }}>Turn Skills into Opportunities</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Laptop & Growth Illustration Mockup */}
          <div
            style={{
              position: "relative",
              width: "280px",
              height: "175px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            className="mobile-hide"
          >
            {/* Modern Laptop Mockup wrapped in float animation */}
            <div className="anim-float" style={{ position: "relative" }}>
              <div
                style={{
                  position: "relative",
                  width: "205px",
                  height: "130px",
                  background: "#18181b",
                  borderRadius: "10px 10px 0 0",
                  border: "3px solid #27272a",
                  boxShadow: "0 14px 30px -4px rgba(15, 23, 42, 0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.5rem",
                  transform: "perspective(800px) rotateY(-8deg) rotateX(4deg)",
                }}
              >
                {/* Screen display: Placement Success Card */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#ffffff",
                    borderRadius: "6px",
                    padding: "0.45rem 0.6rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#09090b", marginBottom: "0.35rem", lineHeight: 1.1 }}>
                    Placement<br />Success
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {[85, 70, 90].map((w, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#09090b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.45rem", fontWeight: 900 }}>
                          ✓
                        </div>
                        <div style={{ height: "4px", width: `${w}%`, background: "#e4e4e7", borderRadius: "999px" }}></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Laptop Base */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-10px",
                    left: "-16px",
                    right: "-16px",
                    height: "10px",
                    background: "#27272a",
                    borderRadius: "0 0 8px 8px",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ width: "36px", height: "3px", background: "#52525b", borderRadius: "999px", margin: "0 auto" }}></div>
                </div>
              </div>
            </div>

            {/* Upward Growth Arrow with subtle pulse */}
            <div className="anim-pulse-subtle" style={{ position: "absolute", right: "25px", top: "-10px", zIndex: 2 }}>
              <svg width="46" height="85" viewBox="0 0 48 85" fill="none">
                <path
                  d="M10 80 L35 22"
                  stroke="#09090b"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M18 18 L38 20 L35 40"
                  stroke="#09090b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Handwritten Cursive Words beside the arrow */}
            <div
              className="anim-pulse-subtle"
              style={{
                position: "absolute",
                right: "-15px",
                top: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "0.15rem",
                fontFamily: "'Caveat', cursive",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#27272a",
                lineHeight: 1.1,
                transform: "rotate(-2deg)",
                animationDelay: "0.5s",
              }}
            >
              <span>Prepare</span>
              <span>Practice</span>
              <span>Perform</span>
              <span>Grow</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Career Prep Tools matching target reference image ──────────── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#000000", letterSpacing: "-0.025em" }}>
              AI Career Prep Tools
            </h2>
            <p style={{ color: "#71717a", fontSize: "0.8125rem", marginTop: "0.15rem" }}>
              Everything you need to analyze, practice, and plan — in one place.
            </p>
          </div>
          <Link href="#modules" style={{ textDecoration: "none", color: "#18181b", fontSize: "0.8125rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span>4 Modules Ready</span>
            <span style={{ fontSize: "1rem", lineHeight: 1 }}>›</span>
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {tools.map((tool, idx) => {
            const isBlackBtn = idx % 2 === 0;
            return (
              <div
                key={tool.title}
                className="glass-card box-pop"
                style={{
                  padding: "1.5rem",
                  background: "#ffffff",
                  borderRadius: "1.25rem",
                  border: "1px solid #e4e4e7",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1.25rem",
                }}
              >
                <div>
                  {/* Top Row: Icon */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div
                      className="icon-pop"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        background: "#f4f4f5",
                        border: "1px solid #e4e4e7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.375rem",
                      }}
                    >
                      {tool.icon}
                    </div>
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#09090b", marginBottom: "0.45rem", letterSpacing: "-0.015em" }}>
                    {tool.title}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#52525b", lineHeight: 1.55 }}>
                    {tool.desc}
                  </p>
                </div>

                {/* Bottom Button (Alternating Black & White) */}
                <Link href={tool.href} style={{ textDecoration: "none", width: "100%", marginTop: "0.5rem" }}>
                  <button
                    className={isBlackBtn ? "btn-gradient btn-pop" : "btn-ghost btn-pop"}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.625rem",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.45rem",
                    }}
                  >
                    <span>Launch {tool.title.split(" ")[0]}</span>
                    <span className="arrow-slide">→</span>
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Two-Column Insights Layout (Stacks gracefully on mobile/tablet) ─ */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.75rem" }} className="mobile-column-stack">
        
        {/* Left Column: Recent Activity Logs */}
        <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.015em", margin: 0 }}>
                Recent Activity
              </h3>
              {activities.length > 0 && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    padding: "0.15rem 0.55rem",
                    borderRadius: "9999px",
                  }}
                >
                  {activities.length}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              {activities.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  style={{
                    background: showAllActivities ? "#eff6ff" : "#f8fafc",
                    border: showAllActivities ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                    fontSize: "0.75rem",
                    color: showAllActivities ? "#1d4ed8" : "#475569",
                    fontWeight: 700,
                    padding: "0.3rem 0.65rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{showAllActivities ? "Show Less" : `See All (${activities.length})`}</span>
                  <span>{showAllActivities ? "↑" : "↓"}</span>
                </button>
              )}
              {activities.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Clear my log
                </button>
              )}
            </div>
          </div>

          {activities.length === 0 ? (
            <div
              style={{
                padding: "2rem 1.5rem",
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: "1rem",
                border: "1.5px dashed #cbd5e1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div style={{ fontSize: "2rem" }}>📋</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                No recent activity for this account
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", maxWidth: "420px", lineHeight: 1.5, margin: 0 }}>
                This account has a clean slate! Complete your first resume scan, skill quiz, or mock voice interview to see your personalized history here.
              </p>
              
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                <Link href="/dashboard/ats" style={{ textDecoration: "none" }}>
                  <button type="button" className="btn-pop" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "0.45rem 0.85rem", borderRadius: "0.5rem", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>
                    📄 Scan Resume
                  </button>
                </Link>
                <Link href="/dashboard/quiz" style={{ textDecoration: "none" }}>
                  <button type="button" className="btn-pop" style={{ background: "#eff6ff", color: "#0284c7", border: "1px solid #bfdbfe", padding: "0.45rem 0.85rem", borderRadius: "0.5rem", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>
                    🧠 Take Quiz
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={handleSeedDemo}
                  className="btn-pop"
                  style={{
                    background: "#ffffff",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ✨ Load Sample Activities
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  maxHeight: showAllActivities ? "360px" : "none",
                  overflowY: showAllActivities ? "auto" : "visible",
                  paddingRight: showAllActivities ? "0.4rem" : "0",
                }}
              >
                {displayedActivities.map((act, idx) => (
                  <div
                    key={act.id || idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: idx === displayedActivities.length - 1 ? "none" : "1px solid #f1f5f9",
                      paddingBottom: idx === displayedActivities.length - 1 ? "0" : "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
                      <div
                        className="icon-pop"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "10px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          flexShrink: 0,
                        }}
                      >
                        {act.type === "ATS Checker" ? "📄" : act.type === "Skill Quiz" ? "🧠" : act.type === "HR Interview" ? "🎙️" : "🗺️"}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>{act.type}</div>
                        <div style={{ fontSize: "0.8125rem", color: "#475569", marginTop: "0.15rem" }}>{act.detail}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.8125rem", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap", marginLeft: "1rem" }}>
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom "See All" / "Show Less" Action Footer if more than 5 activities */}
              {activities.length > 5 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: "1rem",
                    marginTop: "0.75rem",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <button
                    type="button"
                    className="btn-pop"
                    onClick={() => setShowAllActivities(!showAllActivities)}
                    style={{
                      background: showAllActivities ? "#f8fafc" : "#eff6ff",
                      color: showAllActivities ? "#475569" : "#2563eb",
                      border: showAllActivities ? "1px solid #e2e8f0" : "1px solid #bfdbfe",
                      borderRadius: "8px",
                      padding: "0.45rem 1.1rem",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      boxShadow: showAllActivities ? "none" : "0 1px 3px rgba(37, 99, 235, 0.08)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>{showAllActivities ? "Show Less (Recent 5)" : `See All Activity (${activities.length} total)`}</span>
                    <span className="arrow-slide">{showAllActivities ? "↑" : "→"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Progress Indicators */}
        <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.35rem" }}>
          <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.015em" }}>
            Readiness Metrics
          </h3>
          
          {/* ATS Metric */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.35rem" }}>
              <span style={{ color: "#475569", fontWeight: 600 }}>ATS Optimization</span>
              <span style={{ fontWeight: 800, color: metrics.atsOptimization !== null ? "#059669" : "#94a3b8" }}>
                {metrics.atsOptimization !== null ? `${metrics.atsOptimization}%` : "Not Evaluated"}
              </span>
            </div>
            <div className="progress-bar-track" style={{ height: "8px" }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${metrics.atsOptimization ?? 0}%`,
                  background: metrics.atsOptimization !== null ? "linear-gradient(90deg, #10b981, #059669)" : "#e2e8f0",
                }}
              />
            </div>
          </div>

          {/* Voice & Communication */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.35rem" }}>
              <span style={{ color: "#475569", fontWeight: 600 }}>Communication & Voice</span>
              <span style={{ fontWeight: 800, color: metrics.communicationVoice !== null ? "#2563eb" : "#94a3b8" }}>
                {metrics.communicationVoice !== null ? `${metrics.communicationVoice}%` : "Not Evaluated"}
              </span>
            </div>
            <div className="progress-bar-track" style={{ height: "8px" }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${metrics.communicationVoice ?? 0}%`,
                  background: metrics.communicationVoice !== null ? "linear-gradient(90deg, #3b82f6, #2563eb)" : "#e2e8f0",
                }}
              />
            </div>
          </div>

          {/* Quiz Depth */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.35rem" }}>
              <span style={{ color: "#475569", fontWeight: 600 }}>Quiz Depth</span>
              <span style={{ fontWeight: 800, color: metrics.quizDepth ? "#0284c7" : "#94a3b8" }}>
                {metrics.quizDepth ? `${metrics.quizDepth.percentage}% (${metrics.quizDepth.level})` : "Not Evaluated"}
              </span>
            </div>
            <div className="progress-bar-track" style={{ height: "8px" }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${metrics.quizDepth?.percentage ?? 0}%`,
                  background: metrics.quizDepth ? "linear-gradient(90deg, #38bdf8, #0284c7)" : "#e2e8f0",
                }}
              />
            </div>
          </div>

          {metrics.atsOptimization === null && metrics.communicationVoice === null && metrics.quizDepth === null && (
            <div style={{ fontSize: "0.75rem", color: "#64748b", background: "#f8fafc", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", lineHeight: 1.4 }}>
              💡 <em>Tip: Run tests in the modules above to automatically calibrate your personal readiness metrics.</em>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

