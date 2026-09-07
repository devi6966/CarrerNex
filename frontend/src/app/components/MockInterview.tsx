"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { recordActivity } from "@/lib/userStore";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MCQQuestion {
  id: number;
  topic?: string;
  question: string;
  options: string[];
  correct_answer: string; // "A", "B", "C", or "D"
  explanation: string;
}

interface QuizResponse {
  job_role: string;
  difficulty: string;
  topic_category: string;
  total_questions: number;
  time_limit_minutes: number;
  questions: MCQQuestion[];
}

const SPECIALIZATION_TRACKS = [
  {
    id: "dsa",
    title: "Core DSA & Algorithms",
    topics: "Arrays • DP • Graphs • Trees",
    value: "Data Structures & Algorithms",
    defaultRole: "Core DSA & Algorithms",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
    ),
  },
  {
    id: "fullstack",
    title: "Full Stack & Web Dev",
    topics: "Frontend • Backend • APIs",
    value: "Full Stack Web Development",
    defaultRole: "Full Stack Developer",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    ),
  },
  {
    id: "backend",
    title: "Backend & System Design",
    topics: "Scalability • HLD • LLD",
    value: "Backend Systems & APIs",
    defaultRole: "Backend & System Design",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="4" rx="1.5"></rect>
        <rect x="2" y="10" width="20" height="4" rx="1.5"></rect>
        <rect x="2" y="17" width="20" height="4" rx="1.5"></rect>
        <line x1="6" y1="5" x2="6.01" y2="5"></line>
        <line x1="6" y1="12" x2="6.01" y2="12"></line>
        <line x1="6" y1="19" x2="6.01" y2="19"></line>
      </svg>
    ),
  },
  {
    id: "database",
    title: "Database & SQL",
    topics: "Queries • Optimization",
    value: "Databases & SQL",
    defaultRole: "Database & SQL Optimization",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
      </svg>
    ),
  },
  {
    id: "devops",
    title: "DevOps, Docker & Cloud",
    topics: "AWS • Docker • CI/CD",
    value: "DevOps & Cloud Architecture",
    defaultRole: "DevOps, Docker & Cloud",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
      </svg>
    ),
  },
  {
    id: "aptitude",
    title: "Aptitude & Logical Reasoning",
    topics: "Quant • Logical • Verbal",
    value: "Quantitative & Logical Aptitude",
    defaultRole: "Aptitude & Logical Reasoning",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path>
      </svg>
    ),
  },
];

const SAMPLE_QUESTIONS_BY_TRACK: Record<string, Array<{ question: string; options: string[]; answer: string; explanation: string }>> = {
  "Full Stack Web Development": [
    {
      question: "What is the primary difference between React Server Components (RSC) and standard Client Components?",
      options: [
        "A) RSCs execute strictly on the server and do not bundle their dependencies into the client JavaScript bundle",
        "B) RSCs cannot pass props to client components",
        "C) RSCs run in a separate Web Worker thread in the browser",
        "D) RSCs only work with relational database queries directly in the browser DOM",
      ],
      answer: "A",
      explanation: "RSCs render on the server, eliminating large libraries from client-side JS bundles and improving initial page load performance.",
    },
    {
      question: "In CSS, what is the effect of setting 'contain: content;' on a container element?",
      options: [
        "A) It prevents the container from accepting any pointer events",
        "B) It isolates the layout, style, and paint calculations of the element from the rest of the DOM tree",
        "C) It hides all overflow content regardless of the scroll position",
        "D) It converts the element into an iframe container",
      ],
      answer: "B",
      explanation: "'contain: content' applies layout, style, and paint containment, optimizing browser rendering cycles.",
    },
  ],
  "Data Structures & Algorithms": [
    {
      question: "What is the worst-case time complexity of QuickSelect to find the k-th smallest element in an unsorted array?",
      options: ["A) O(n log n)", "B) O(n²)", "C) O(n)", "D) O(log n)"],
      answer: "B",
      explanation: "QuickSelect averages O(n), but with poor pivot choices (e.g. already sorted array without random pivot), it degrades to O(n²).",
    },
  ],
  default: [
    {
      question: "Which of the following describes the ACID property of 'Isolation' in database transactions?",
      options: [
        "A) Changes are immediately visible to all concurrent transactions without locking",
        "B) Concurrent transactions execute without interfering with one another, preventing dirty reads or phantom reads",
        "C) The database is physically isolated from network interfaces",
        "D) All writes are written to isolated SSD storage",
      ],
      answer: "B",
      explanation: "Isolation ensures concurrent transactions result in a system state equivalent to serial execution.",
    },
  ],
};

export default function MockInterview() {
  const { data: session } = useSession();

  // Configuration Form State
  const [jobRole, setJobRole] = useState("Full Stack Developer");
  const [difficulty, setDifficulty] = useState("Level-2");
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedTopic, setSelectedTopic] = useState("Full Stack Web Development");

  // Modals
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [samplesModalOpen, setSamplesModalOpen] = useState(false);

  // Active Assessment State
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // UI View Mode (Single Focus vs Full List)
  const [viewMode, setViewMode] = useState<"focus" | "list">("focus");
  const [loadingStep, setLoadingStep] = useState("⚡ Synthesizing Placement Questions...");

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // Dynamic Loading Step Rotation
  useEffect(() => {
    if (!loading) return;
    const steps = [
      "⚡ Initializing AI Engine...",
      `🎯 Generating ${questionCount} Placement Questions...`,
      "🧠 Calibrating Real Interview Scenarios...",
      "🚀 Finalizing Assessment Paper...",
    ];
    let idx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setLoadingStep(steps[idx]);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading, questionCount]);

  // Timer Effect
  useEffect(() => {
    if (started && !submitted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, submitted, timeLeft]);

  const handleAutoSubmit = () => {
    setSubmitted(true);
  };

  // Record completed assessment to personal history & readiness metrics
  useEffect(() => {
    if (started && submitted && questions.length > 0 && session?.user?.email) {
      const score = calculateScore();
      const pct = Math.round((score / questions.length) * 100);
      recordActivity(session.user.email, {
        type: "Skill Quiz",
        detail: `Completed ${jobRole || "Technical"} (${difficulty}) Quiz - Score: ${score}/${questions.length} (${pct}%)`,
        score: pct,
        metricUpdates: {
          quizDepth: {
            level: `${difficulty} (${jobRole || "Tech"})`,
            percentage: pct,
          },
        },
      });
    }
  }, [submitted, started]);

  // Start / Generate Quiz
  const handleStartQuiz = async () => {
    if (!jobRole.trim()) {
      setError("Please enter or select a job role / topic.");
      return;
    }

    setLoading(true);
    setError(null);
    setSubmitted(false);
    setSelectedAnswers({});
    setMarkedForReview({});
    setCurrentIdx(0);

    try {
      const res = await fetch(`${API_URL}/api/interview/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_role: jobRole.trim(),
          difficulty: difficulty,
          question_count: questionCount,
          topic_category: selectedTopic,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error: ${res.status}`);
      }

      const data: QuizResponse = await res.json();
      setQuestions(data.questions);
      const seconds = data.time_limit_minutes * 60;
      setTimeLeft(seconds);
      setTotalTime(seconds);
      setStarted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load placement assessment questions.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Option Selection
  const handleSelectOption = (questionId: number, optionLetter: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  const handleToggleReview = (questionId: number) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Calculate Score
  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_answer) {
        score += 1;
      }
    });
    return score;
  };

  const scorePercentage = questions.length > 0 ? Math.round((calculateScore() / questions.length) * 100) : 0;

  const getOptionLetter = (optionText: string, index: number): string => {
    const match = optionText.match(/^([A-D])\)/i);
    if (match) return match[1].toUpperCase();
    return String.fromCharCode(65 + index);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentIdx];

  const sampleQuestionsList =
    SAMPLE_QUESTIONS_BY_TRACK[selectedTopic] || SAMPLE_QUESTIONS_BY_TRACK.default;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", width: "100%", maxWidth: "1280px", margin: "0 auto" }}>
      
      {/* ── Configuration Screen (When Quiz is NOT started) ──────────────── */}
      {!started && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          
          {/* Top Breadcrumb Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.875rem", color: "#71717a" }}>
            <Link href="/dashboard" style={{ textDecoration: "none", color: "#71717a", fontWeight: 500 }}>
              Dashboard
            </Link>
            <span style={{ color: "#d4d4d8" }}>›</span>
            <span style={{ color: "#09090b", fontWeight: 600 }}>Skill Quiz</span>
          </div>

          {/* Hero Header Row with Hand-drawn Doodle + 3D Monitor Illustration */}
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
            {/* Left Title & Description */}
            <div style={{ maxWidth: "660px" }}>
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
                Technical Skill Quiz
              </h1>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "#52525b",
                  marginTop: "0.5rem",
                  lineHeight: 1.55,
                }}
              >
                Test your coding concepts and architecture knowledge. Choose your target role
                and difficulty level to answer 10 questions with real-time scoring and explanations.
              </p>
            </div>

            {/* Right: Hand-Drawn Doodle + 3D Laptop/Monitor with Floating Badges */}
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
                  transform: "rotate(-5deg)",
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
                  Practice<br />Solve<br />Improve<br />Get Placed
                </div>
                <svg
                  width="45"
                  height="35"
                  viewBox="0 0 45 35"
                  fill="none"
                  stroke="#52525b"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginTop: "0.2rem" }}
                >
                  <path d="M 8 5 Q 30 8 32 25" />
                  <path d="M 24 22 L 32 27 L 36 19" />
                </svg>
              </div>

              {/* 3D Monitor Visual + Floating App Badges */}
              <div style={{ position: "relative", width: "250px", height: "155px" }}>
                {/* Floating Badge 1: DSA */}
                <div
                  style={{
                    position: "absolute",
                    top: "0px",
                    left: "12px",
                    padding: "0.28rem 0.6rem",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#09090b",
                    zIndex: 4,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span>DSA</span>
                </div>

                {/* Floating Badge 2: System Design */}
                <div
                  style={{
                    position: "absolute",
                    top: "-6px",
                    left: "86px",
                    padding: "0.28rem 0.6rem",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#09090b",
                    zIndex: 4,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="5" rx="1.5"></rect>
                    <rect x="2" y="11" width="20" height="5" rx="1.5"></rect>
                    <line x1="6" y1="5.5" x2="6.01" y2="5.5"></line>
                    <line x1="6" y1="13.5" x2="6.01" y2="13.5"></line>
                  </svg>
                  <span>System Design</span>
                </div>

                {/* Floating Badge 3: Database */}
                <div
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "-4px",
                    padding: "0.28rem 0.6rem",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#09090b",
                    zIndex: 4,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                  </svg>
                  <span>Database</span>
                </div>

                {/* Floating Badge 4: DevOps */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "22px",
                    right: "16px",
                    padding: "0.28rem 0.6rem",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#09090b",
                    zIndex: 4,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                  </svg>
                  <span>DevOps</span>
                </div>

                {/* Floating Lightbulb */}
                <div
                  style={{
                    position: "absolute",
                    top: "36px",
                    right: "-12px",
                    fontSize: "1.45rem",
                    filter: "drop-shadow(0 2px 10px rgba(234, 179, 8, 0.5))",
                    zIndex: 4,
                  }}
                >
                  💡
                </div>

                {/* Tilted Metallic Laptop / Screen Mockup */}
                <div
                  style={{
                    position: "absolute",
                    top: "28px",
                    left: "22px",
                    width: "172px",
                    height: "106px",
                    background: "#09090b",
                    borderRadius: "10px",
                    border: "2px solid #27272a",
                    boxShadow: "0 18px 36px -8px rgba(0,0,0,0.3)",
                    transform: "perspective(420px) rotateY(-8deg) rotateX(6deg)",
                    padding: "0.55rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.65rem",
                      fontWeight: 800,
                      color: "#38bdf8",
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                      textShadow: "0 0 16px rgba(56, 189, 248, 0.7)",
                    }}
                  >
                    &lt;/&gt;
                  </div>
                  <div style={{ display: "flex", gap: "3px", marginTop: "0.4rem" }}>
                    <div style={{ width: 18, height: 3, background: "#34d399", borderRadius: 2 }} />
                    <div style={{ width: 28, height: 3, background: "#818cf8", borderRadius: 2 }} />
                    <div style={{ width: 14, height: 3, background: "#38bdf8", borderRadius: 2 }} />
                  </div>
                </div>

                {/* Laptop keyboard base */}
                <div
                  style={{
                    position: "absolute",
                    top: "130px",
                    left: "12px",
                    width: "192px",
                    height: "10px",
                    background: "linear-gradient(180deg, #3f3f46 0%, #18181b 100%)",
                    borderRadius: "2px 2px 8px 8px",
                    transform: "perspective(420px) rotateY(-8deg) rotateX(25deg)",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Main "Customize Your Quiz" Card ──────────────────────────────── */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              border: "1px solid #e4e4e7",
              padding: "2rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "1.75rem",
            }}
          >
            {/* Card Header Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem",
                    flexShrink: 0,
                  }}
                >
                  🎯
                </div>
                <div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "9999px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      marginBottom: "0.35rem",
                    }}
                  >
                    Placement Mock Assessment Engine
                  </div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#09090b", margin: 0 }}>
                    Customize Your Quiz
                  </h2>
                  <p style={{ fontSize: "0.8125rem", color: "#71717a", marginTop: "0.25rem", margin: 0 }}>
                    Simulate TCS, Infosys, Amazon, and product-tier placement technical screening rounds.
                  </p>
                </div>
              </div>

              {/* How it works Button */}
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
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
              >
                <span style={{ color: "#71717a" }}>❓</span>
                <span>How it works?</span>
              </button>
            </div>

            {/* 1. Select Specialization Track Section */}
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#09090b", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>①</span>
                <span>1. Select Specialization Track</span>
              </div>

              {/* 3x2 Grid of Track Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.85rem",
                }}
                className="mobile-column-stack"
              >
                {SPECIALIZATION_TRACKS.map((track) => {
                  const isSelected = selectedTopic === track.value;
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        setSelectedTopic(track.value);
                        setJobRole(track.defaultRole);
                      }}
                      style={{
                        padding: "1rem 1.15rem",
                        borderRadius: "12px",
                        background: isSelected ? "#f0f7ff" : "#ffffff",
                        border: isSelected ? "2px solid #2563eb" : "1px solid #e4e4e7",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.18s ease",
                        boxShadow: isSelected ? "0 4px 12px rgba(37, 99, 235, 0.08)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "10px",
                            background: isSelected ? "#ffffff" : "#f4f4f5",
                            border: "1px solid",
                            borderColor: isSelected ? "#bfdbfe" : "#e4e4e7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {track.icon}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: isSelected ? "#1d4ed8" : "#09090b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {track.title}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: isSelected ? "#2563eb" : "#71717a", marginTop: "2px" }}>
                            {track.topics}
                          </div>
                        </div>
                      </div>

                      {/* Checkmark badge when active */}
                      {isSelected && (
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "#2563eb",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          ✔
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2, 3, 4 Configuration Dropdowns Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr 1fr",
                gap: "1rem",
              }}
              className="mobile-column-stack"
            >
              {/* Field 2: Target Role / Subject Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#09090b", marginBottom: "0.45rem" }}>
                  2. Target Role / Subject Name
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e4e4e7",
                    padding: "0.6rem 0.85rem",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    id="quiz-role-input"
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#09090b",
                      width: "100%",
                    }}
                  />
                  <span style={{ color: "#a1a1aa", fontSize: "0.75rem" }}>▼</span>
                </div>
              </div>

              {/* Field 3: Assessment Size */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#09090b", marginBottom: "0.45rem" }}>
                  3. Assessment Size
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e4e4e7",
                    padding: "0.6rem 0.85rem",
                    position: "relative",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <select
                    id="quiz-count-select"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#09090b",
                      width: "100%",
                      cursor: "pointer",
                      appearance: "none",
                    }}
                  >
                    <option value={10}>10 Questions (Quick Test • 10 Mins)</option>
                    <option value={20}>20 Questions (Placement Round • 20 Mins)</option>
                    <option value={30}>30 Questions (Full Mock • 30 Mins)</option>
                  </select>
                  <span style={{ color: "#a1a1aa", fontSize: "0.75rem", pointerEvents: "none" }}>▼</span>
                </div>
              </div>

              {/* Field 4: Difficulty Tier */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#09090b", marginBottom: "0.45rem" }}>
                  4. Difficulty Tier
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e4e4e7",
                    padding: "0.6rem 0.85rem",
                    position: "relative",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                  <select
                    id="quiz-difficulty-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#09090b",
                      width: "100%",
                      cursor: "pointer",
                      appearance: "none",
                    }}
                  >
                    <option value="Level-1">Level-1: Foundational Syntax & Logic</option>
                    <option value="Level-2">Level-2: Standard Placement Logic</option>
                    <option value="Level-3">Level-3: Senior & Advanced Architecture</option>
                  </select>
                  <span style={{ color: "#a1a1aa", fontSize: "0.75rem", pointerEvents: "none" }}>▼</span>
                </div>
              </div>
            </div>

            {/* Error banner if any */}
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

            {/* Action Buttons Row matching screenshot */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "1rem",
                marginTop: "0.5rem",
              }}
              className="mobile-column-stack"
            >
              {/* Primary Launch Assessment Button */}
              <button
                id="start-assessment-btn"
                type="button"
                onClick={handleStartQuiz}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.6rem",
                  padding: "0.95rem 1.75rem",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #09090b 0%, #1e293b 100%)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
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
                    <span>▶</span>
                    <span>Launch Assessment ({questionCount} Questions) 🚀</span>
                    <span>→</span>
                  </>
                )}
              </button>

              {/* Secondary View Sample Questions Button */}
              <button
                type="button"
                onClick={() => setSamplesModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.95rem 1.25rem",
                  borderRadius: "10px",
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  color: "#09090b",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>View Sample Questions</span>
              </button>
            </div>
          </div>

          {/* ── Bottom 4 Feature Highlight Cards ─────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
            }}
            className="mobile-column-stack"
          >
            {/* Card 1: Real-time Scoring */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e4e4e7",
                padding: "1rem 1.15rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="8"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#09090b" }}>
                  Real-time Scoring
                </div>
                <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>
                  See your performance instantly
                </div>
              </div>
            </div>

            {/* Card 2: Detailed Explanations */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e4e4e7",
                padding: "1rem 1.15rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  background: "#f3e8ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#09090b" }}>
                  Detailed Explanations
                </div>
                <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>
                  Learn from every question
                </div>
              </div>
            </div>

            {/* Card 3: Company-level Questions */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e4e4e7",
                padding: "1rem 1.15rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  background: "#fef3c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#09090b" }}>
                  Company-level Questions
                </div>
                <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>
                  Based on latest patterns
                </div>
              </div>
            </div>

            {/* Card 4: Track Your Progress */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e4e4e7",
                padding: "1rem 1.15rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  background: "#e0f2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#09090b" }}>
                  Track Your Progress
                </div>
                <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "1px" }}>
                  Improve with consistent practice
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Assessment Mode (When Started) ─────────────────────────── */}
      {started && questions.length > 0 && !submitted && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Top Floating Exam Status Bar */}
          <div
            style={{
              padding: "1.25rem 1.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e4e4e7",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "#71717a", textTransform: "uppercase", fontWeight: 700 }}>
                {selectedTopic} · {difficulty}
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#09090b", margin: 0 }}>{jobRole}</h2>
            </div>

            {/* Live Countdown Clock + Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  background: timeLeft < 120 ? "#fee2e2" : "#eff6ff",
                  border: timeLeft < 120 ? "1px solid #fecdd3" : "1px solid #bfdbfe",
                  color: timeLeft < 120 ? "#be123c" : "#1d4ed8",
                  padding: "0.45rem 1rem",
                  borderRadius: "10px",
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>⏳</span>
                <span>{formatTimer(timeLeft)}</span>
              </div>

              {/* View Mode Switcher */}
              <div style={{ display: "flex", gap: "0.25rem", background: "#f4f4f5", padding: "0.25rem", borderRadius: "8px" }}>
                <button
                  type="button"
                  onClick={() => setViewMode("focus")}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    background: viewMode === "focus" ? "#09090b" : "transparent",
                    color: viewMode === "focus" ? "#ffffff" : "#71717a",
                    border: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Single Focus
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    background: viewMode === "list" ? "#09090b" : "transparent",
                    color: viewMode === "list" ? "#ffffff" : "#71717a",
                    border: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Full Sheet
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSubmitted(true)}
                style={{
                  padding: "0.55rem 1.25rem",
                  borderRadius: "8px",
                  background: "#09090b",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Submit Exam 📤
              </button>
            </div>
          </div>

          {/* Assessment Layout: Question Body + Navigation Palette */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "1.5rem" }} className="mobile-column-stack">
            
            {/* Left: Questions Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {viewMode === "focus" && currentQuestion && (
                <div style={{ padding: "2.25rem", background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2563eb" }}>
                      Question {currentIdx + 1} of {questions.length} · Topic: {currentQuestion.topic || selectedTopic}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleReview(currentQuestion.id)}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "8px",
                        background: markedForReview[currentQuestion.id] ? "#fef3c7" : "#f4f4f5",
                        border: markedForReview[currentQuestion.id] ? "1px solid #fde68a" : "1px solid #e4e4e7",
                        color: markedForReview[currentQuestion.id] ? "#b45309" : "#71717a",
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {markedForReview[currentQuestion.id] ? "🚩 Marked for Review" : "🏳 Mark for Review"}
                    </button>
                  </div>

                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#09090b", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                    {currentQuestion.question}
                  </h3>

                  {/* Options List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {currentQuestion.options.map((opt, i) => {
                      const letter = getOptionLetter(opt, i);
                      const isSelected = selectedAnswers[currentQuestion.id] === letter;
                      return (
                        <div
                          key={i}
                          onClick={() => handleSelectOption(currentQuestion.id, letter)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            padding: "1rem 1.25rem",
                            borderRadius: "12px",
                            border: isSelected ? "2px solid #09090b" : "1px solid #e4e4e7",
                            background: isSelected ? "#f4f4f5" : "#ffffff",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: isSelected ? "#09090b" : "#f4f4f5",
                              color: isSelected ? "#ffffff" : "#09090b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "0.875rem",
                              flexShrink: 0,
                            }}
                          >
                            {letter}
                          </div>
                          <span style={{ fontSize: "0.95rem", color: "#09090b", fontWeight: isSelected ? 700 : 500, lineHeight: 1.45 }}>
                            {opt.replace(/^[A-D]\)\s*/i, "")}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Next / Previous Controls */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid #f4f4f5" }}>
                    <button
                      type="button"
                      onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                      disabled={currentIdx === 0}
                      style={{
                        padding: "0.55rem 1.25rem",
                        borderRadius: "8px",
                        background: "#ffffff",
                        border: "1px solid #e4e4e7",
                        color: "#09090b",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                        opacity: currentIdx === 0 ? 0.5 : 1,
                      }}
                    >
                      ← Previous Question
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentIdx === questions.length - 1}
                      style={{
                        padding: "0.55rem 1.25rem",
                        borderRadius: "8px",
                        background: "#09090b",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: currentIdx === questions.length - 1 ? "not-allowed" : "pointer",
                        opacity: currentIdx === questions.length - 1 ? 0.5 : 1,
                      }}
                    >
                      Next Question →
                    </button>
                  </div>
                </div>
              )}

              {/* Full Sheet Mode */}
              {viewMode === "list" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {questions.map((q, idx) => (
                    <div key={q.id} style={{ padding: "1.75rem", background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2563eb" }}>
                          Question {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleReview(q.id)}
                          style={{
                            padding: "0.25rem 0.65rem",
                            borderRadius: "6px",
                            background: markedForReview[q.id] ? "#fef3c7" : "#f4f4f5",
                            border: markedForReview[q.id] ? "1px solid #fde68a" : "1px solid #e4e4e7",
                            color: markedForReview[q.id] ? "#b45309" : "#71717a",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {markedForReview[q.id] ? "🚩 Marked" : "Mark"}
                        </button>
                      </div>

                      <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#09090b", marginBottom: "1rem" }}>
                        {q.question}
                      </h4>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {q.options.map((opt, i) => {
                          const letter = getOptionLetter(opt, i);
                          const isSelected = selectedAnswers[q.id] === letter;
                          return (
                            <div
                              key={i}
                              onClick={() => handleSelectOption(q.id, letter)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.65rem 0.85rem",
                                borderRadius: "8px",
                                border: isSelected ? "1.5px solid #09090b" : "1px solid #e4e4e7",
                                background: isSelected ? "#f4f4f5" : "#ffffff",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  background: isSelected ? "#09090b" : "#f4f4f5",
                                  color: isSelected ? "#ffffff" : "#09090b",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                }}
                              >
                                {letter}
                              </div>
                              <span style={{ fontSize: "0.85rem", color: "#09090b", fontWeight: isSelected ? 700 : 500 }}>
                                {opt.replace(/^[A-D]\)\s*/i, "")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Question Navigation Palette */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "1.5rem", height: "fit-content" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#09090b", marginBottom: "1rem" }}>
                Question Palette
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                {questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];
                  const isCurrent = currentIdx === idx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentIdx(idx);
                        setViewMode("focus");
                      }}
                      style={{
                        height: 38,
                        borderRadius: "8px",
                        border: isCurrent ? "2px solid #2563eb" : "1px solid #e4e4e7",
                        background: isMarked
                          ? "#fef3c7"
                          : isAnswered
                          ? "#09090b"
                          : "#f4f4f5",
                        color: isMarked
                          ? "#b45309"
                          : isAnswered
                          ? "#ffffff"
                          : "#71717a",
                        fontWeight: 700,
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f4f4f5", fontSize: "0.75rem", color: "#71717a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "#09090b" }} />
                  <span>Answered</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "#fef3c7", border: "1px solid #fde68a" }} />
                  <span>Marked for Review</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "#f4f4f5", border: "1px solid #e4e4e7" }} />
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Submission Results Screen ────────────────────────────────────────── */}
      {submitted && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          
          {/* Score Header Card */}
          <div
            style={{
              padding: "2.5rem 2rem",
              background: "#09090b",
              borderRadius: "18px",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1.5rem",
              boxShadow: "0 12px 30px -6px rgba(0,0,0,0.25)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase" }}>
                Assessment Complete
              </div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.35rem 0" }}>
                {jobRole} · {difficulty}
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#d4d4d8", margin: 0 }}>
                Topic: {selectedTopic}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "3.25rem", fontWeight: 800, lineHeight: 1 }}>
                  {calculateScore()}
                  <span style={{ fontSize: "1.5rem", color: "#71717a" }}>/{questions.length}</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#a1a1aa", marginTop: "0.25rem" }}>
                  Accuracy: <strong>{scorePercentage}%</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStarted(false);
                  setSubmitted(false);
                  setQuestions([]);
                  setSelectedAnswers({});
                  setMarkedForReview({});
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "10px",
                  background: "#ffffff",
                  color: "#09090b",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Retake / New Test 🔄
              </button>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#09090b" }}>
              Detailed Question Review & Explanations
            </h3>

            {questions.map((q, idx) => {
              const userAns = selectedAnswers[q.id];
              const isCorrect = userAns === q.correct_answer;
              return (
                <div
                  key={q.id}
                  style={{
                    padding: "1.75rem",
                    borderRadius: "14px",
                    background: "#ffffff",
                    border: isCorrect ? "1px solid #bbf7d0" : "1px solid #fecaca",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: isCorrect ? "#16a34a" : "#dc2626" }}>
                      {isCorrect ? "✔ Correct" : "✕ Incorrect / Skipped"} · Question {idx + 1}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#71717a" }}>
                      Your Answer: <strong>{userAns || "None"}</strong> | Correct: <strong>{q.correct_answer}</strong>
                    </span>
                  </div>

                  <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#09090b", margin: 0 }}>
                    {q.question}
                  </h4>

                  {/* Options */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.35rem" }} className="mobile-column-stack">
                    {q.options.map((opt, i) => {
                      const letter = getOptionLetter(opt, i);
                      const isCorrectChoice = letter === q.correct_answer;
                      const isUserChoice = letter === userAns;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: "0.6rem 0.85rem",
                            borderRadius: "8px",
                            fontSize: "0.8125rem",
                            background: isCorrectChoice
                              ? "#f0fdf4"
                              : isUserChoice
                              ? "#fef2f2"
                              : "#fafafa",
                            border: isCorrectChoice
                              ? "1.5px solid #16a34a"
                              : isUserChoice
                              ? "1.5px solid #dc2626"
                              : "1px solid #e4e4e7",
                            color: "#09090b",
                            fontWeight: isCorrectChoice || isUserChoice ? 700 : 500,
                          }}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      background: "#f4f4f5",
                      fontSize: "0.8125rem",
                      color: "#3f3f46",
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>💡 Explanation:</strong> {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── "How it works?" Modal ─────────────────────────────────────────── */}
      {howItWorksOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
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
                How Placement Skill Quiz Works
              </div>
              <button
                onClick={() => setHowItWorksOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#71717a" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.85rem", color: "#3f3f46", lineHeight: 1.5 }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>1️⃣</span>
                <div>
                  <strong style={{ color: "#09090b" }}>Select Track & Difficulty:</strong> Choose from DSA, Full Stack, DevOps, System Design, Database, or Aptitude, calibrated to Level-1, 2, or 3.
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>2️⃣</span>
                <div>
                  <strong style={{ color: "#09090b" }}>Fast AI Question Generation:</strong> Powered by Google Gemini to assemble realistic, challenging technical MCQs tailored to current tech company interviews.
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>3️⃣</span>
                <div>
                  <strong style={{ color: "#09090b" }}>Simulated Exam Environment:</strong> Timed test engine with single-focus mode, question palette, review tagging, and instant automated grading.
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>4️⃣</span>
                <div>
                  <strong style={{ color: "#09090b" }}>Learn From Explanations:</strong> Every question comes with detailed technical explanations to identify and bridge your knowledge gaps.
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

      {/* ── "View Sample Questions" Modal ─────────────────────────────────── */}
      {samplesModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSamplesModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "580px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#09090b" }}>
                  Sample Questions Preview
                </div>
                <div style={{ fontSize: "0.75rem", color: "#71717a" }}>
                  Track: {selectedTopic}
                </div>
              </div>
              <button
                onClick={() => setSamplesModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#71717a" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {sampleQuestionsList.map((sq, i) => (
                <div key={i} style={{ padding: "1rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e4e4e7" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#09090b", marginBottom: "0.5rem" }}>
                    Q{i + 1}. {sq.question}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", color: "#475569" }}>
                    {sq.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ padding: "0.3rem 0.5rem", borderRadius: "4px", background: "#ffffff", border: "1px solid #f1f5f9" }}>
                        {opt}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#059669", background: "#f0fdf4", padding: "0.4rem 0.6rem", borderRadius: "6px" }}>
                    <strong>Answer: {sq.answer}</strong> — {sq.explanation}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => setSamplesModalOpen(false)}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  color: "#09090b",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setSamplesModalOpen(false);
                  handleStartQuiz();
                }}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  background: "#09090b",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Launch Assessment Now 🚀
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
