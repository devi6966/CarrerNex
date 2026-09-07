"use client";

export interface UserActivity {
  id: string;
  type: "ATS Checker" | "Skill Quiz" | "HR Interview" | "Career Roadmap";
  detail: string;
  timestamp: number;
  score?: number;
}

export interface UserMetrics {
  atsOptimization: number | null; // percentage (0-100) or null if unrated
  communicationVoice: number | null; // percentage (0-100) or null if unrated
  quizDepth: {
    level: string; // e.g. "Level-2 (React)"
    percentage: number; // 0-100
  } | null;
  overallReadiness: number | null; // composite percentage or null
}

export interface UserProfileData {
  email: string;
  activities: UserActivity[];
  metrics: UserMetrics;
  lastUpdated: number;
}

const STORAGE_PREFIX = "careernex_user_profile_";

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getUserStorageKey(email?: string | null): string {
  const sanitized = (email || "guest_user").trim().toLowerCase();
  return `${STORAGE_PREFIX}${encodeURIComponent(sanitized)}`;
}

export function getUserData(email?: string | null): UserProfileData {
  if (typeof window === "undefined") {
    return {
      email: email || "",
      activities: [],
      metrics: {
        atsOptimization: null,
        communicationVoice: null,
        quizDepth: null,
        overallReadiness: null,
      },
      lastUpdated: Date.now(),
    };
  }

  const key = getUserStorageKey(email);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        email: email || "",
        activities: Array.isArray(parsed.activities) ? parsed.activities : [],
        metrics: parsed.metrics || {
          atsOptimization: null,
          communicationVoice: null,
          quizDepth: null,
          overallReadiness: null,
        },
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
    }
  } catch (err) {
    console.error("Error reading user data:", err);
  }

  return {
    email: email || "",
    activities: [],
    metrics: {
      atsOptimization: null,
      communicationVoice: null,
      quizDepth: null,
      overallReadiness: null,
    },
    lastUpdated: Date.now(),
  };
}

export function saveUserData(email: string | null | undefined, data: UserProfileData): void {
  if (typeof window === "undefined") return;
  const key = getUserStorageKey(email);
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("careernex_user_data_updated", { detail: { email } }));
  } catch (err) {
    console.error("Error saving user data:", err);
  }
}

export function recordActivity(
  email: string | null | undefined,
  activity: {
    type: UserActivity["type"];
    detail: string;
    score?: number;
    metricUpdates?: Partial<UserMetrics>;
  }
): UserProfileData {
  const current = getUserData(email);

  const newActivity: UserActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: activity.type,
    detail: activity.detail,
    timestamp: Date.now(),
    score: activity.score,
  };

  const updatedActivities = [newActivity, ...current.activities].slice(0, 25);

  const updatedMetrics: UserMetrics = {
    ...current.metrics,
    ...(activity.metricUpdates || {}),
  };

  // Compute composite overall readiness score if metrics exist
  const scores: number[] = [];
  if (typeof updatedMetrics.atsOptimization === "number") scores.push(updatedMetrics.atsOptimization);
  if (typeof updatedMetrics.communicationVoice === "number") scores.push(updatedMetrics.communicationVoice);
  if (updatedMetrics.quizDepth?.percentage) scores.push(updatedMetrics.quizDepth.percentage);

  if (scores.length > 0) {
    updatedMetrics.overallReadiness = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  const updatedData: UserProfileData = {
    email: email || "",
    activities: updatedActivities,
    metrics: updatedMetrics,
    lastUpdated: Date.now(),
  };

  saveUserData(email, updatedData);
  return updatedData;
}

export function seedDemoActivity(email: string | null | undefined): UserProfileData {
  const data: UserProfileData = {
    email: email || "",
    activities: [
      {
        id: `act_${Date.now()}_1`,
        type: "ATS Checker",
        detail: "Checked 'Full Stack Developer' Resume - Score: 78.0%",
        timestamp: Date.now() - 1000 * 60 * 25, // 25 mins ago
        score: 78,
      },
      {
        id: `act_${Date.now()}_2`,
        type: "Skill Quiz",
        detail: "Completed Full Stack (Intermediate) Quiz - Score: 8/10 (80%)",
        timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
        score: 80,
      },
      {
        id: `act_${Date.now()}_3`,
        type: "HR Interview",
        detail: "Finished Real-Time Voice Simulation round - Score: 85%",
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        score: 85,
      },
    ],
    metrics: {
      atsOptimization: 78,
      communicationVoice: 85,
      quizDepth: {
        level: "Intermediate (Full Stack)",
        percentage: 80,
      },
      overallReadiness: 81,
    },
    lastUpdated: Date.now(),
  };

  saveUserData(email, data);
  return data;
}

export function clearUserHistory(email: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const key = getUserStorageKey(email);
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent("careernex_user_data_updated", { detail: { email } }));
}
