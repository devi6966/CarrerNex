"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { recordActivity } from "@/lib/userStore";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface HREvaluation {
  hr_score: number;
  communication_score: number;
  confidence_score: number;
  fluency_score: number;
  grammar_score: number;
  overall_performance: string;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
}

const POPULAR_ROLES = [
  "Software Engineer",
  "Full Stack Developer",
  "Frontend Engineer (React / Next.js)",
  "Backend Engineer (Python / Node / Java)",
  "Cloud & DevOps Engineer",
  "Data Analyst / Data Scientist",
  "AI / Machine Learning Engineer",
  "Product Manager (Technical)",
];

const ROLE_SAMPLE_QUESTIONS: Record<string, string[]> = {
  "Software Engineer": [
    "Could you briefly introduce yourself and share what inspired you to pursue software engineering?",
    "Tell me about a challenging project you built. What technical hurdles did you encounter and how did you resolve them?",
    "Describe a situation where you had a tight deadline or production bug. How did you prioritize tasks under pressure?",
    "Have you ever had a technical disagreement with a colleague or manager? How did you navigate the discussion?",
    "Where do you see yourself technically and professionally in the next 3 to 5 years?",
  ],
  "Full Stack Developer": [
    "Tell me about your experience balancing frontend user experience with backend API performance.",
    "Walk me through how you architected state management and database schema in your recent application.",
    "Can you share an instance where you identified and resolved a critical security or performance bottleneck?",
    "How do you approach learning new frameworks or transitioning between tech stacks?",
  ],
  default: [
    "Could you give me a brief elevator pitch about yourself and what excites you about this role?",
    "Tell me about a time you had to overcome a major roadblock in a project or assignment.",
    "How do you handle ambiguous requirements or sudden changes in project direction?",
    "Describe your preferred team collaboration style and how you handle constructive feedback.",
    "What motivates you to do your best work every day?",
  ],
};

// ── Waveform Visualizer ───────────────────────────────────────────────────────
function WaveformVisualizer({ active, color }: { active: boolean; color: string }) {
  const barsCount = 14;
  const bars = Array.from({ length: barsCount });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", height: "40px" }}>
      {bars.map((_, index) => {
        const height = active ? 10 + (index % 5) * 6 : 6;
        return (
          <div
            key={index}
            style={{
              width: "4px",
              height: `${height}px`,
              borderRadius: "9999px",
              background: color,
              transition: "height 0.2s ease, opacity 0.2s ease",
              opacity: active ? 0.95 : 0.35,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Score Bar Component ──────────────────────────────────────────────────────
function ScoreBar({ label, score }: { label: string; score: number }) {
  const percent = Math.min(100, Math.max(0, score * 10));
  const color = score >= 8 ? "#059669" : score >= 6 ? "#0284c7" : score >= 4 ? "#d97706" : "#e11d48";

  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem", fontSize: "0.875rem" }}>
        <span style={{ fontWeight: 600, color: "#334155" }}>{label}</span>
        <span style={{ fontWeight: 800, color }}>{score} / 10</span>
      </div>
      <div className="progress-bar-track" style={{ height: "8px" }}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${percent}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HRInterview() {
  const { data: session } = useSession();
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Setup Form & Modal States matching target UI
  const [interviewMode, setInterviewMode] = useState<"audio" | "video">("audio");
  const [interviewType, setInterviewType] = useState("General HR Round");
  const [difficultyLevel, setDifficultyLevel] = useState("Medium (Placement Level)");
  const [interviewDuration, setInterviewDuration] = useState("~ 10 Minutes (5–8 Questions)");
  const [activeTab, setActiveTab] = useState<"setup" | "info" | "samples" | "progress">("setup");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState("⚡ Preparing AI Interview Room...");

  // Call & Media States
  const [speakingAI, setSpeakingAI] = useState(false);
  const [speakingUser, setSpeakingUser] = useState(false);
  const [aiSubtitles, setAiSubtitles] = useState("");
  const [userSubtitles, setUserSubtitles] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [textInput, setTextInput] = useState("");

  // Interview Progress
  const [duration, setDuration] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [evaluation, setEvaluation] = useState<HREvaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Dynamic Loading Step Rotation
  useEffect(() => {
    if (!loading) return;
    const steps = [
      "⚡ Initializing AI Interview Room...",
      `🎯 Calibrating questions for ${jobRole}...`,
      "🧠 Preparing recruiter conversation model...",
      "🚀 Connecting live audio stream...",
    ];
    let idx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setLoadingStep(steps[idx]);
    }, 1100);
    return () => clearInterval(interval);
  }, [loading, jobRole]);

  // Refs
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isMutedRef = useRef(isMuted);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // ── Sync Mute Ref ──────────────────────────────────────────────────────────
  useEffect(() => {
    isMutedRef.current = isMuted;
    if (isMuted && recognitionRef.current) {
      recognitionRef.current.abort();
      setSpeakingUser(false);
    } else if (!isMuted && started && !speakingAI && !loading && !evaluating) {
      startSpeechRecognition();
    }
  }, [isMuted]);

  // ── Duration Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (started && !evaluation) {
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [started, evaluation]);

  // ── Auto scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, showTranscript]);

  // ── Camera Handler ─────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      }
    } catch (err) {
      console.warn("Webcam access optional or denied:", err);
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
      setIsCameraOn(false);
    } else {
      startCamera();
    }
  };

  const stopVoiceSystems = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setSpeakingAI(false);
    setSpeakingUser(false);
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopVoiceSystems();
      stopCamera();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [stopVoiceSystems]);

  // ── Speech Synthesis (AI Voice) ───────────────────────────────────────────
  const speakAIResponse = (text: string) => {
    if (!text || typeof window === "undefined") return;

    setSpeakingAI(true);
    setAiSubtitles(text);

    if (!window.speechSynthesis) {
      setTimeout(() => {
        setSpeakingAI(false);
        if (!isMutedRef.current) {
          startSpeechRecognition();
        }
      }, 3500);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const englishVoice =
        voices.find((v) => v.lang.includes("en-US") && v.name.includes("Female")) ||
        voices.find((v) => v.lang.includes("en") && !v.name.includes("Male")) ||
        voices.find((v) => v.lang.includes("en"));
      if (englishVoice) utterance.voice = englishVoice;

      utterance.onend = () => {
        setSpeakingAI(false);
        if (!isMutedRef.current) {
          startSpeechRecognition();
        }
      };

      utterance.onerror = () => {
        setSpeakingAI(false);
        if (!isMutedRef.current) {
          startSpeechRecognition();
        }
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis notice:", e);
      setSpeakingAI(false);
      if (!isMutedRef.current) {
        startSpeechRecognition();
      }
    }
  };

  // ── Speech Recognition (User Voice) ───────────────────────────────────────
  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Browser SpeechRecognition not supported. Use text input fallback.");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onstart = () => {
      setSpeakingUser(true);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += " " + transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      const activeText = (finalTranscript + " " + interim).trim();
      setUserSubtitles(activeText);

      // Reset 2.5s silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (activeText.length > 3) {
          recognition.stop();
          sendAnswerToBackend(activeText);
        }
      }, 2400);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        console.warn("Speech recognition notice:", e.error);
      }
      setSpeakingUser(false);
    };

    recognition.onend = () => {
      setSpeakingUser(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.warn("Recognition start skipped:", err);
    }
  };

  // ── Send User Answer to FastAPI Backend ────────────────────────────────────
  const sendAnswerToBackend = async (answerText: string) => {
    if (!answerText.trim()) return;

    stopVoiceSystems();
    setLoading(true);
    setError(null);
    setUserSubtitles("");
    setTextInput("");

    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user", content: answerText.trim() },
    ];
    setChatHistory(updatedHistory);

    try {
      const res = await fetch(`${API_URL}/api/hr/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_role: jobRole,
          chat_history: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
            parts: [m.content],
          })),
          user_message: answerText.trim(),
          user_answer: answerText.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error: ${res.status}`);
      }

      const data = await res.json();
      const aiResponse = data.ai_response || data.content || "Thank you for sharing that. Could you describe a challenging scenario you solved recently?";

      setChatHistory([
        ...updatedHistory,
        { role: "model", content: aiResponse },
      ]);

      speakAIResponse(aiResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to communicate with HR AI interviewer.");
      if (!isMutedRef.current) startSpeechRecognition();
    } finally {
      setLoading(false);
    }
  };

  // ── Start Interview Round ──────────────────────────────────────────────────
  const handleStart = async () => {
    if (!jobRole.trim()) {
      setError("Please enter your target job role.");
      return;
    }

    setStarted(true);
    setLoading(true);
    setError(null);
    setDuration(0);
    setChatHistory([]);
    setEvaluation(null);

    if (interviewMode === "video") {
      startCamera();
    } else {
      setIsCameraOn(false);
    }

    const effectiveRole = `${jobRole.trim()} - ${interviewType} (${difficultyLevel})`;

    try {
      const res = await fetch(`${API_URL}/api/hr/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_role: effectiveRole,
          chat_history: [],
          user_message: "",
          user_answer: "",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error: ${res.status}`);
      }

      const data = await res.json();
      const aiOpening = data.ai_response || data.content || `Hello and welcome! I'm Alex from Talent Acquisition. Thanks for joining me today for the ${jobRole} interview. To kick things off, could you briefly introduce yourself?`;

      setChatHistory([{ role: "model", content: aiOpening }]);
      speakAIResponse(aiOpening);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not connect to HR interviewer server.");
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  // ── End Interview & Evaluate ───────────────────────────────────────────────
  const handleEndInterview = async () => {
    stopVoiceSystems();
    stopCamera();
    setEvaluating(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/hr/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_role: jobRole,
          chat_history: chatHistory.map((m) => ({
            role: m.role,
            content: m.content,
            parts: [m.content],
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Evaluation error: ${res.status}`);
      }

      const data = await res.json();
      const evalResult = data.evaluation || data;
      setEvaluation(evalResult);

      // Record to user's personalized activity log & readiness metrics
      if (session?.user?.email && evalResult) {
        const score = Math.round(evalResult.hr_score ? evalResult.hr_score * 10 : evalResult.communication_score ? evalResult.communication_score * 10 : 75);
        recordActivity(session.user.email, {
          type: "HR Interview",
          detail: `Completed ${jobRole || "Software Engineer"} Voice Simulation - Score: ${score}%`,
          score: score,
          metricUpdates: {
            communicationVoice: score,
          },
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to compile HR evaluation scorecard.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleReset = () => {
    stopVoiceSystems();
    stopCamera();
    setStarted(false);
    setEvaluation(null);
    setChatHistory([]);
    setDuration(0);
    setAiSubtitles("");
    setUserSubtitles("");
    setError(null);
    setActiveTab("setup");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentSampleQuestions = ROLE_SAMPLE_QUESTIONS[jobRole] || ROLE_SAMPLE_QUESTIONS.default;

  // ── Setup / Onboarding Screen ──────────────────────────────────────────────
  if (!started && !evaluation) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", width: "100%", maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* CSS Keyframe for Subtle Floating Robot & Ambient Glow */}
        <style>{`
          @keyframes floatRobot {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }
          @keyframes pulseSoundwave {
            0%, 100% {
              transform: scaleY(0.9);
              opacity: 0.45;
            }
            50% {
              transform: scaleY(1.1);
              opacity: 0.7;
            }
          }
        `}</style>

        {/* Top Breadcrumb Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.875rem", color: "#71717a" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#71717a", fontWeight: 500 }}>
            Dashboard
          </Link>
          <span style={{ color: "#d4d4d8" }}>›</span>
          <span style={{ color: "#09090b", fontWeight: 600 }}>HR Interview</span>
        </div>

        {/* Hero Header Row with Hand-drawn Doodle + 3D Robot Illustration */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
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
                AI HR Voice Interviewer
              </h1>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.22rem 0.65rem",
                  borderRadius: "9999px",
                  background: "#f3e8ff",
                  color: "#7c3aed",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                <span>⚡</span>
                <span>Powered by AI</span>
              </span>
            </div>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "#52525b",
                marginTop: "0.5rem",
                lineHeight: 1.55,
              }}
            >
              Simulate realistic Google, Amazon, and top-tier placement HR rounds with real-time AI voice conversation, optional webcam preview, and a detailed 5-dimension scorecard.
            </p>
          </div>

          {/* Right: Hand-Drawn Doodle + 3D Friendly Robot with Headphones & Waveform */}
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
                Speak<br />Practice<br />Improve<br />Get Hired
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

            {/* 3D Robot Character with Sound Waveform Background & "Let's Practice!" bubble */}
            <div
              style={{
                position: "relative",
                width: "190px",
                height: "155px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Vertical Sound wave bars radiating behind robot */}
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  gap: "7px",
                  alignItems: "center",
                  opacity: 0.55,
                  zIndex: 1,
                  bottom: "32px",
                  animation: "pulseSoundwave 3s ease-in-out infinite",
                }}
              >
                <div style={{ width: 4, height: 26, background: "#93c5fd", borderRadius: 4 }} />
                <div style={{ width: 4, height: 46, background: "#60a5fa", borderRadius: 4 }} />
                <div style={{ width: 4, height: 72, background: "#3b82f6", borderRadius: 4 }} />
                <div style={{ width: 4, height: 96, background: "#2563eb", borderRadius: 4 }} />
                <div style={{ width: 4, height: 110, background: "#1d4ed8", borderRadius: 4 }} />
                <div style={{ width: 4, height: 96, background: "#2563eb", borderRadius: 4 }} />
                <div style={{ width: 4, height: 72, background: "#3b82f6", borderRadius: 4 }} />
                <div style={{ width: 4, height: 46, background: "#60a5fa", borderRadius: 4 }} />
                <div style={{ width: 4, height: 26, background: "#93c5fd", borderRadius: 4 }} />
              </div>

              {/* Speech bubble "Let's Practice!" */}
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "-14px",
                  padding: "0.35rem 0.8rem",
                  borderRadius: "20px",
                  background: "#ffffff",
                  border: "1.5px solid #bfdbfe",
                  boxShadow: "0 6px 16px rgba(37, 99, 235, 0.16)",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: "#2563eb",
                  zIndex: 5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  lineHeight: 1.2,
                  pointerEvents: "none",
                }}
              >
                <span>Let's</span>
                <span>Practice!</span>
              </div>

              {/* 3D Transparent AI Robot Character (Free-floating with drop-shadow & gentle floating motion) */}
              <div
                style={{
                  position: "relative",
                  zIndex: 3,
                  width: 148,
                  height: 148,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "floatRobot 3.6s ease-in-out infinite",
                }}
              >
                <img
                  src="/images/robot-interviewer.png"
                  alt="AI Recruiter Alex"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    filter: "drop-shadow(0 14px 24px rgba(37, 99, 235, 0.28))",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs / Pills Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTab("setup")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 1.1rem",
              borderRadius: "9px",
              background: activeTab === "setup" ? "#2563eb" : "#ffffff",
              color: activeTab === "setup" ? "#ffffff" : "#09090b",
              border: activeTab === "setup" ? "none" : "1px solid #e4e4e7",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: activeTab === "setup" ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
            }}
          >
            <span>⚙️</span>
            <span>Setup Interview</span>
          </button>

          <button
            type="button"
            onClick={() => setInfoModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 1.1rem",
              borderRadius: "9px",
              background: "#ffffff",
              color: "#09090b",
              border: "1px solid #e4e4e7",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            <span style={{ color: "#71717a" }}>ⓘ</span>
            <span>Interview Info</span>
          </button>

          <button
            type="button"
            onClick={() => setSampleModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 1.1rem",
              borderRadius: "9px",
              background: "#ffffff",
              color: "#09090b",
              border: "1px solid #e4e4e7",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            <span style={{ color: "#71717a" }}>📄</span>
            <span>Sample Questions</span>
          </button>

          <button
            type="button"
            onClick={() => setProgressModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 1.1rem",
              borderRadius: "9px",
              background: "#ffffff",
              color: "#09090b",
              border: "1px solid #e4e4e7",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            <span style={{ color: "#71717a" }}>📊</span>
            <span>Your Progress</span>
          </button>
        </div>

        {/* ── Two-Column Layout Grid (Main Setup Card + What You'll Get Card) ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "1.5rem",
            alignItems: "start",
          }}
          className="mobile-column-stack"
        >
          {/* ── Left Column: Main Setup Card ── */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e4e4e7",
              padding: "1.75rem 2rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            {/* Field 1: Target Job Role + Suggest Role Callout */}
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#09090b", marginBottom: "0.55rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>1. Target Job Role</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1fr",
                  gap: "1rem",
                  alignItems: "stretch",
                }}
                className="mobile-column-stack"
              >
                {/* Role Input Box */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e4e4e7",
                    padding: "0.75rem 1rem",
                  }}
                >
                  <input
                    id="hr-role-input"
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#09090b",
                      width: "100%",
                    }}
                    placeholder="e.g. Software Engineer"
                  />
                  <span style={{ color: "#a1a1aa", fontSize: "0.75rem", pointerEvents: "none" }}>▼</span>
                </div>

                {/* "Not sure about the role?" Callout Box */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    background: "#faf5ff",
                    borderRadius: "12px",
                    border: "1px solid #f3e8ff",
                    padding: "0.65rem 0.85rem",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#f3e8ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.95rem",
                      flexShrink: 0,
                    }}
                  >
                    🎯
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#581c87" }}>
                      Not sure about the role?
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#7e22ce", marginTop: "1px", lineHeight: 1.3 }}>
                      Get role suggestions based on your resume and skills.
                    </div>
                    <button
                      type="button"
                      onClick={() => setRoleModalOpen(true)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        marginTop: "3px",
                        color: "#6b21a8",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      <span>Suggest Role</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 2: Interview Mode Selection */}
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#09090b", marginBottom: "0.65rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <span>2. Interview Mode</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
                className="mobile-column-stack"
              >
                {/* Option 1: Natural Spoken Audio */}
                <div
                  onClick={() => setInterviewMode("audio")}
                  style={{
                    padding: "1rem 1.15rem",
                    borderRadius: "12px",
                    background: interviewMode === "audio" ? "#eff6ff" : "#ffffff",
                    border: interviewMode === "audio" ? "2px solid #2563eb" : "1px solid #e4e4e7",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.18s ease",
                    boxShadow: interviewMode === "audio" ? "0 4px 12px rgba(37, 99, 235, 0.08)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#dbeafe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#09090b" }}>
                        Natural Spoken Audio
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#71717a", marginTop: "2px", lineHeight: 1.3 }}>
                        Speak naturally and get real-time<br />AI voice responses (Recommended)
                      </div>
                    </div>
                  </div>

                  {/* Circular Checkmark Badge */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: interviewMode === "audio" ? "#2563eb" : "transparent",
                      border: interviewMode === "audio" ? "none" : "1.5px solid #d4d4d8",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {interviewMode === "audio" && "✔"}
                  </div>
                </div>

                {/* Option 2: Video + Voice (Beta) */}
                <div
                  onClick={() => setInterviewMode("video")}
                  style={{
                    padding: "1rem 1.15rem",
                    borderRadius: "12px",
                    background: interviewMode === "video" ? "#faf5ff" : "#ffffff",
                    border: interviewMode === "video" ? "2px solid #7c3aed" : "1px solid #e4e4e7",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.18s ease",
                    boxShadow: interviewMode === "video" ? "0 4px 12px rgba(124, 58, 237, 0.08)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#f3e8ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 7l-7 5 7 5V7z"></path>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#09090b" }}>
                        Video + Voice (Beta)
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#71717a", marginTop: "2px", lineHeight: 1.3 }}>
                        Enable webcam preview for a more<br />realistic interview experience.
                      </div>
                    </div>
                  </div>

                  {/* Circular Checkmark Badge */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: interviewMode === "video" ? "#7c3aed" : "transparent",
                      border: interviewMode === "video" ? "none" : "1.5px solid #d4d4d8",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {interviewMode === "video" && "✔"}
                  </div>
                </div>
              </div>
            </div>

            {/* Fields 3, 4, 5: Dropdown Selectors Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr",
                gap: "1rem",
              }}
              className="mobile-column-stack"
            >
              {/* Field 3: Interview Type */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#09090b", marginBottom: "0.45rem" }}>
                  📄 3. Interview Type
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e4e4e7",
                    padding: "0.65rem 0.85rem",
                    position: "relative",
                  }}
                >
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
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
                    <option value="General HR Round">General HR Round</option>
                    <option value="Technical Behavioral (STAR)">Technical Behavioral (STAR)</option>
                    <option value="Culture Fit & Leadership">Culture Fit & Leadership</option>
                    <option value="Managerial Round">Managerial Round</option>
                  </select>
                  <span style={{ color: "#a1a1aa", fontSize: "0.75rem", pointerEvents: "none" }}>▼</span>
                </div>
              </div>

              {/* Field 4: Difficulty Level */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#09090b", marginBottom: "0.45rem" }}>
                  📊 4. Difficulty Level
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e4e4e7",
                    padding: "0.65rem 0.85rem",
                    position: "relative",
                  }}
                >
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value)}
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
                    <option value="Easy (Entry Level)">Easy (Entry Level)</option>
                    <option value="Medium (Placement Level)">Medium (Placement Level)</option>
                    <option value="Hard (Senior Tech HR)">Hard (Senior Tech HR)</option>
                  </select>
                  <span style={{ color: "#a1a1aa", fontSize: "0.75rem", pointerEvents: "none" }}>▼</span>
                </div>
              </div>

              {/* Field 5: Interview Duration */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#09090b", marginBottom: "0.45rem" }}>
                  ⏱ 5. Interview Duration
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e4e4e7",
                    padding: "0.65rem 0.85rem",
                    position: "relative",
                  }}
                >
                  <select
                    value={interviewDuration}
                    onChange={(e) => setInterviewDuration(e.target.value)}
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
                    <option value="~ 5 Minutes (3–4 Questions)">~ 5 Minutes (3–4 Questions)</option>
                    <option value="~ 10 Minutes (5–8 Questions)">~ 10 Minutes (5–8 Questions)</option>
                    <option value="~ 15 Minutes (8–12 Questions)">~ 15 Minutes (8–12 Questions)</option>
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

            {/* Primary Action Button matching reference */}
            <button
              id="hr-voice-start-btn"
              type="button"
              onClick={handleStart}
              disabled={loading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                padding: "0.95rem 1.75rem",
                borderRadius: "10px",
                background: "linear-gradient(90deg, #0d2149 0%, #172554 50%, #1d4ed8 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 6px 18px rgba(13, 33, 73, 0.25)",
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
                  <span>Start HR Voice Interview</span>
                  <span>→</span>
                </>
              )}
            </button>

            {/* Trust Badges Footer Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "1.25rem",
                paddingTop: "0.5rem",
                borderTop: "1px solid #f4f4f5",
                fontSize: "0.75rem",
                color: "#71717a",
                fontWeight: 600,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span>🛡️</span>
                <span>Safe & Private</span>
              </div>
              <span style={{ color: "#d4d4d8" }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span>⚡</span>
                <span>Real-time AI Conversation</span>
              </div>
              <span style={{ color: "#d4d4d8" }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span>📊</span>
                <span>Detailed Scorecard</span>
              </div>
              <span style={{ color: "#d4d4d8" }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span>🏆</span>
                <span>Improve Communication</span>
              </div>
            </div>
          </div>

          {/* ── Right Column: "What You'll Get" Card ── */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e4e4e7",
              padding: "1.5rem 1.6rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "1.35rem",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", fontWeight: 800, color: "#09090b" }}>
              <span>⭐</span>
              <span>What You'll Get</span>
            </div>

            {/* Benefit Item 1: Real-time AI conversation */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#09090b" }}>
                  Real-time AI conversation
                </div>
                <div style={{ fontSize: "0.72rem", color: "#71717a", marginTop: "2px", lineHeight: 1.35 }}>
                  Natural and human-like voice interaction
                </div>
              </div>
            </div>

            {/* Benefit Item 2: 5-dimension scorecard */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#09090b" }}>
                  5-dimension scorecard
                </div>
                <div style={{ fontSize: "0.72rem", color: "#71717a", marginTop: "2px", lineHeight: 1.35 }}>
                  Communication, Fluency, Confidence, Content, Body Language
                </div>
              </div>
            </div>

            {/* Benefit Item 3: Personalized feedback */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#fff7ed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#09090b" }}>
                  Personalized feedback
                </div>
                <div style={{ fontSize: "0.72rem", color: "#71717a", marginTop: "2px", lineHeight: 1.35 }}>
                  Strengths, weak areas and tips
                </div>
              </div>
            </div>

            {/* Benefit Item 4: Industry-like experience */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#09090b" }}>
                  Industry-like experience
                </div>
                <div style={{ fontSize: "0.72rem", color: "#71717a", marginTop: "2px", lineHeight: 1.35 }}>
                  Based on real HR interview patterns
                </div>
              </div>
            </div>

            {/* Testimonial Quote Card */}
            <div
              style={{
                marginTop: "0.5rem",
                padding: "1rem 1.15rem",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              <div style={{ fontSize: "1.75rem", color: "#94a3b8", lineHeight: 1, fontFamily: "serif" }}>
                “
              </div>
              <p style={{ fontSize: "0.78rem", fontStyle: "italic", color: "#475569", lineHeight: 1.45, margin: 0 }}>
                "The AI interviewer felt so real! It helped me improve my confidence a lot before my actual interview."
              </p>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textAlign: "right", marginTop: "0.25rem" }}>
                — A Happy Learner
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal 1: Suggest Role Popover ── */}
        {roleModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999,
              padding: "1rem",
            }}
            onClick={() => setRoleModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "1.75rem",
                maxWidth: "520px",
                width: "100%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#09090b", margin: 0 }}>
                  🎯 Select Your Target Role
                </h3>
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#71717a" }}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#52525b", margin: 0 }}>
                Pick from top tech placement roles to tailor Alex's behavioral and technical question bank:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                {POPULAR_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setJobRole(role);
                      setRoleModalOpen(false);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "0.75rem 0.85rem",
                      borderRadius: "10px",
                      background: jobRole === role ? "#eff6ff" : "#f8fafc",
                      border: jobRole === role ? "1.5px solid #2563eb" : "1px solid #e4e4e7",
                      color: jobRole === role ? "#1d4ed8" : "#09090b",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal 2: Sample Questions Preview ── */}
        {sampleModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999,
              padding: "1rem",
            }}
            onClick={() => setSampleModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "1.75rem",
                maxWidth: "600px",
                width: "100%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#09090b", margin: 0 }}>
                  📄 Sample HR Behavioral Questions · {jobRole}
                </h3>
                <button
                  type="button"
                  onClick={() => setSampleModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#71717a" }}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#52525b", margin: 0 }}>
                Practice answering these common placement prompts using the STAR method (Situation, Task, Action, Result):
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {currentSampleQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e4e4e7",
                      fontSize: "0.85rem",
                      color: "#1e293b",
                      lineHeight: 1.45,
                    }}
                  >
                    <span style={{ fontWeight: 800, color: "#2563eb", marginRight: "0.5rem" }}>Q{idx + 1}:</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal 3: Interview Info ── */}
        {infoModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999,
              padding: "1rem",
            }}
            onClick={() => setInfoModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "1.75rem",
                maxWidth: "560px",
                width: "100%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <img
                    src="/images/robot-interviewer.png"
                    alt="Alex"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "#eff6ff",
                      border: "1.5px solid #bfdbfe",
                      objectFit: "contain",
                      padding: "1px",
                    }}
                  />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#09090b", margin: 0 }}>
                    How Alex Conducts Your Interview
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#71717a" }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "#334155" }}>
                <div>
                  <strong>Stage 1: Introduction & Icebreaker</strong>
                  <div style={{ color: "#64748b", marginTop: "2px" }}>Warm greeting and quick 60-second elevator pitch about your background.</div>
                </div>
                <div>
                  <strong>Stage 2: Technical & Project Hurdles</strong>
                  <div style={{ color: "#64748b", marginTop: "2px" }}>Discussing your flagship projects, architecture decisions, and bugs solved.</div>
                </div>
                <div>
                  <strong>Stage 3: Behavioral Situations (STAR)</strong>
                  <div style={{ color: "#64748b", marginTop: "2px" }}>Conflict resolution, tight deadlines, and team collaboration under pressure.</div>
                </div>
                <div>
                  <strong>Stage 4: Culture & Long-Term Goals</strong>
                  <div style={{ color: "#64748b", marginTop: "2px" }}>Work style preferences, growth ambitions, and company alignment.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal 4: Your Progress ── */}
        {progressModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999,
              padding: "1rem",
            }}
            onClick={() => setProgressModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "1.75rem",
                maxWidth: "500px",
                width: "100%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#09090b", margin: 0 }}>
                  📊 Your HR Interview History
                </h3>
                <button
                  type="button"
                  onClick={() => setProgressModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#71717a" }}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#52525b", margin: 0 }}>
                {session?.user?.name ? `${session.user.name}'s performance records are tracked in real-time.` : "Sign in to persist your interview scorecards and track fluency improvements."}
              </p>
              <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#0f172a" }}>
                <strong>Recent Target:</strong> {jobRole} ({interviewType})<br />
                <span style={{ color: "#16a34a", fontWeight: 700 }}>Ready for next simulation session</span>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ── Evaluation / Final Report Screen ───────────────────────────────────────
  if (evaluation) {
    return (
      <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "880px", margin: "0 auto" }}>
        <div className="glass-card" style={{ padding: "2.5rem", textAlign: "center", background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.85rem", marginBottom: "0.75rem" }}>
            <img
              src="/images/robot-interviewer.png"
              alt="Alex"
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: "2px solid #bfdbfe",
                boxShadow: "0 6px 16px rgba(37, 99, 235, 0.2)",
                background: "#eff6ff",
                objectFit: "contain",
                padding: "2px",
              }}
            />
            <span style={{ fontSize: "2.5rem" }}>🏆</span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
            HR Interview Evaluation Scorecard
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9375rem" }}>
            Candidate Performance Audit for <strong style={{ color: "#0f172a" }}>{jobRole}</strong> · Session Duration: {formatTime(duration)}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }} className="mobile-column-stack">
          {/* Skill Breakdown */}
          <div className="glass-card" style={{ padding: "2rem", background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, marginBottom: "1.5rem", color: "#1d4ed8" }}>
              📊 Core Competency Scores
            </h3>
            <ScoreBar label="HR Recruiter Rating" score={evaluation.hr_score} />
            <ScoreBar label="Communication & Articulation" score={evaluation.communication_score} />
            <ScoreBar label="Confidence & Poise" score={evaluation.confidence_score} />
            <ScoreBar label="Spoken Fluency" score={evaluation.fluency_score} />
            <ScoreBar label="Grammar & Vocabulary" score={evaluation.grammar_score} />
          </div>

          {/* Overall Performance */}
          <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#1d4ed8" }}>
              💡 Recruiter Summary
            </h3>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "#334155" }}>
              {evaluation.overall_performance}
            </p>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="mobile-column-stack">
          <div className="glass-card" style={{ padding: "1.75rem", borderLeft: "4px solid #059669", background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.875rem", color: "#047857" }}>
              🟢 Demonstrated Strengths
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {evaluation.strengths.map((s, i) => (
                <li key={i} style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.5 }}>
                  ✓ {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card" style={{ padding: "1.75rem", borderLeft: "4px solid #e11d48", background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.875rem", color: "#be123c" }}>
              🔴 Areas for Development
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {evaluation.weaknesses.map((w, i) => (
                <li key={i} style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.5 }}>
                  ⚠ {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actionable Suggestions */}
        <div className="glass-card" style={{ padding: "2rem", background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 800, marginBottom: "1rem", color: "#0284c7" }}>
            🛠 Actionable Next Steps
          </h3>
          <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {evaluation.improvement_suggestions.map((s, i) => (
              <li key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ color: "#0284c7", fontWeight: 800 }}>{i + 1}.</span>
                <span style={{ fontSize: "0.9375rem", color: "#334155", lineHeight: 1.55 }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
          <button
            onClick={() => window.print()}
            className="btn-ghost"
            style={{ padding: "0.6rem 1.5rem", fontSize: "0.9rem" }}
          >
            📥 Print / Download Evaluation Report
          </button>
          <button id="hr-restart-btn" className="btn-gradient" onClick={handleReset} style={{ padding: "0.6rem 1.75rem" }}>
            ↩ Start Another Interview
          </button>
        </div>
      </div>
    );
  }

  // ── Zoom / Meet Live Video Call Screen ─────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "980px", margin: "0 auto" }}>
      
      {/* Call Header Bar */}
      <div className="glass-card" style={{ padding: "0.875rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", background: "#ffffff", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{
            width: 10, height: 10, borderRadius: "50%",
            background: speakingAI ? "#2563eb" : speakingUser ? "#0284c7" : "#cbd5e1",
            boxShadow: speakingAI ? "0 0 10px #2563eb" : speakingUser ? "0 0 10px #0284c7" : "none",
          }} />
          <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>
            Live HR Interview · {jobRole}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "0.875rem", color: "#1d4ed8", fontWeight: 700, background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.25rem 0.75rem", borderRadius: "0.5rem" }}>
            ⏱ {formatTime(duration)}
          </div>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            style={{
              background: showTranscript ? "#eff6ff" : "#ffffff",
              border: showTranscript ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
              color: showTranscript ? "#1d4ed8" : "#475569",
              padding: "0.35rem 0.85rem",
              borderRadius: "0.5rem",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            💬 {showTranscript ? "Hide Chat" : "Live Chat"}
          </button>
        </div>
      </div>

      {/* Main Video Call Area (Split Screen) */}
      <div style={{ display: "grid", gridTemplateColumns: showTranscript ? "2.2fr 1fr" : "1fr 1fr", gap: "1rem" }} className="mobile-column-stack">
        
        {/* Left Video: AI Recruiter Alex */}
        <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "320px", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #f8fafc, #eff6ff)", border: speakingAI ? "2px solid #2563eb" : "1px solid #e2e8f0" }}>
          
          <div style={{ position: "absolute", top: "1rem", left: "1rem", display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.9)", padding: "0.25rem 0.6rem", borderRadius: "0.375rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
            <span style={{ fontSize: "0.75rem", color: "#1d4ed8", fontWeight: 700 }}>Alex (Talent Acquisition Lead)</span>
          </div>

          {/* AI Avatar */}
          <div
            style={{
              position: "relative",
              width: 124,
              height: 124,
              borderRadius: "50%",
              background: "linear-gradient(145deg, #f0fdf4 0%, #eff6ff 100%)",
              border: speakingAI ? "3px solid #2563eb" : "2.5px solid #bfdbfe",
              boxShadow: speakingAI
                ? "0 0 30px rgba(37, 99, 235, 0.45), 0 8px 24px rgba(37, 99, 235, 0.2)"
                : "0 8px 24px rgba(15, 23, 42, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              transition: "all 0.35s ease",
              overflow: "hidden",
            }}
          >
            <img
              src="/images/robot-interviewer.png"
              alt="Alex AI Interviewer"
              style={{
                width: "116%",
                height: "116%",
                objectFit: "contain",
                objectPosition: "center 18%",
                transform: speakingAI ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.3s ease",
              }}
            />
            {/* Live pulsing online badge */}
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                right: "10px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: speakingAI ? "#22c55e" : "#3b82f6",
                border: "2px solid #ffffff",
                boxShadow: speakingAI
                  ? "0 0 10px rgba(34, 197, 94, 0.8)"
                  : "0 0 6px rgba(59, 130, 246, 0.5)",
              }}
            />
          </div>

          <WaveformVisualizer active={speakingAI} color="linear-gradient(180deg, #3b82f6, #2563eb)" />
          
          <div style={{ fontSize: "0.8125rem", color: speakingAI ? "#1d4ed8" : "#64748b", fontWeight: 700, marginTop: "0.5rem" }}>
            {speakingAI ? "Alex is speaking..." : loading ? "Analyzing response..." : "Listening attentively"}
          </div>

          {/* Live Subtitle bar */}
          {aiSubtitles && (
            <div style={{
              marginTop: "1rem",
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #cbd5e1",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              width: "100%",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#0f172a",
              lineHeight: 1.4,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)"
            }}>
              "{aiSubtitles}"
            </div>
          )}
        </div>

        {/* Right Video: Candidate Webcam Preview */}
        <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "320px", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #f8fafc, #f1f5f9)", border: "1px solid #e2e8f0" }}>
          
          <div style={{ position: "absolute", top: "1rem", left: "1rem", display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.9)", padding: "0.25rem 0.6rem", borderRadius: "0.375rem", zIndex: 10, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
            <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: 700 }}>You (Candidate)</span>
          </div>

          {isCameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "240px",
                objectFit: "cover",
                borderRadius: "0.75rem",
                transform: "scaleX(-1)",
                border: "1px solid #cbd5e1",
              }}
            />
          ) : (
            <div style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: "#ffffff",
              border: speakingUser ? "3px solid #0284c7" : "2px solid #cbd5e1",
              boxShadow: speakingUser ? "0 0 25px rgba(2,132,199,0.3)" : "0 4px 12px rgba(15,23,42,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3.5rem",
              marginBottom: "1rem"
            }}>
              👨‍💻
            </div>
          )}

          <div style={{ marginTop: "0.75rem", width: "100%" }}>
            <WaveformVisualizer active={speakingUser} color="linear-gradient(180deg, #38bdf8, #0284c7)" />
          </div>

          <div style={{ fontSize: "0.8125rem", color: speakingUser ? "#0284c7" : isMuted ? "#be123c" : "#64748b", fontWeight: 700, marginTop: "0.25rem" }}>
            {isMuted ? "Muted" : speakingUser ? "Listening to your answer..." : "Ready to speak"}
          </div>

          {userSubtitles && (
            <div style={{
              marginTop: "0.75rem",
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #cbd5e1",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              width: "100%",
              textAlign: "center",
              fontSize: "0.8125rem",
              color: "#0f172a",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)"
            }}>
              "{userSubtitles}"
            </div>
          )}
        </div>

        {/* Optional Right Drawer: Live Chat Transcript */}
        {showTranscript && (
          <div className="glass-card animate-fade-up" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", height: "320px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.75rem" }}>
              Interview Transcript
            </h4>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.25rem" }}>
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    background: msg.role === "user" ? "#eff6ff" : "#f8fafc",
                    border: msg.role === "user" ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.8125rem",
                    color: "#0f172a",
                    lineHeight: 1.4
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.6875rem", fontWeight: 800, color: msg.role === "user" ? "#1d4ed8" : "#2563eb", marginBottom: "0.2rem" }}>
                    {msg.role !== "user" ? (
                      <>
                        <img
                          src="/images/robot-interviewer.png"
                          alt="Alex"
                          style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "contain", border: "1px solid #bfdbfe", background: "#eff6ff" }}
                        />
                        <span>Alex (AI Recruiter)</span>
                      </>
                    ) : (
                      <span>You</span>
                    )}
                  </div>
                  {msg.content}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
          </div>
        )}

      </div>

      {/* Zoom / Meet Style Interactive Control Bar */}
      <div className="glass-card" style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", background: "#ffffff", border: "1px solid #e2e8f0" }}>
        
        {/* Left: Input Text Hybrid Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            className="form-input"
            style={{ height: "42px", padding: "0 0.875rem", fontSize: "0.875rem" }}
            placeholder="Type your answer here or speak freely into mic..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendAnswerToBackend(textInput)}
          />
          <button
            type="button"
            className="btn-gradient"
            onClick={() => sendAnswerToBackend(textInput)}
            disabled={!textInput.trim() || loading}
            style={{ padding: "0.5rem 1.1rem", fontSize: "0.8125rem" }}
          >
            Send ↵
          </button>
        </div>

        {/* Right: Meeting Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Mic Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              background: isMuted ? "#fff1f2" : "#f8fafc",
              border: isMuted ? "1px solid #fecdd3" : "1px solid #cbd5e1",
              color: isMuted ? "#be123c" : "#334155",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {isMuted ? "🔇 Unmute" : "🎤 Mute"}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleCamera}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              background: !isCameraOn ? "#fff1f2" : "#f8fafc",
              border: !isCameraOn ? "1px solid #fecdd3" : "1px solid #cbd5e1",
              color: !isCameraOn ? "#be123c" : "#334155",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {isCameraOn ? "📹 Video On" : "🚫 Video Off"}
          </button>

          {/* End Call */}
          <button
            onClick={handleEndInterview}
            disabled={evaluating || chatHistory.length < 1}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#be123c",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {evaluating ? "Evaluating..." : "🔴 End Call"}
          </button>
        </div>

      </div>

    </div>
  );
}
