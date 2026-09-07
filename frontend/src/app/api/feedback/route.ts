import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface FeedbackItem {
  id: string;
  author: string;
  role: string;
  rating: number;
  tag: string;
  quote: string;
  createdAt: string;
  likes: number;
}

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "feedbacks.json");

const fallbackFeedbacks: FeedbackItem[] = [
  {
    id: "fb-1",
    author: "Devi Prasad",
    role: "React Developer Intern",
    rating: 5,
    tag: "ATS Resume Scorer",
    quote: "The ATS scorer's phrase weakness feedback is spot on! It helped me fix vague sentences and tailor my project descriptions to pass top screening rounds.",
    createdAt: "2026-09-04T10:30:00.000Z",
    likes: 16,
  },
  {
    id: "fb-2",
    author: "Ananya Rao",
    role: "Cloud Architect Associate",
    rating: 5,
    tag: "HR Voice Interview",
    quote: "HR voice mode felt exactly like speaking to a real interviewer over Zoom. The instant speech transcriptions and 5-dimension scorecard gave me confidence before my real round.",
    createdAt: "2026-09-03T15:20:00.000Z",
    likes: 22,
  },
  {
    id: "fb-3",
    author: "Rohan Das",
    role: "Backend Engineer @ FinTech",
    rating: 5,
    tag: "Technical Skill Quizzes",
    quote: "The MCQ quizzes have really challenging questions with clear explanations. It is a fantastic tool to test algorithmic depth before technical interviews.",
    createdAt: "2026-09-02T08:45:00.000Z",
    likes: 11,
  },
  {
    id: "fb-4",
    author: "Priya Sharma",
    role: "B.Tech CSE, Final Year",
    rating: 5,
    tag: "Career Roadmap",
    quote: "The Career Roadmap broke down my entire 6-month prep into bite-sized weekly milestones. The recommended portfolio projects and platforms were incredibly helpful!",
    createdAt: "2026-09-01T18:10:00.000Z",
    likes: 19,
  },
];

function readFeedbacks(): FeedbackItem[] {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileData = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      return JSON.parse(fileData);
    }
    // Write default if not found
    fs.mkdirSync(path.dirname(DATA_FILE_PATH), { recursive: true });
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(fallbackFeedbacks, null, 2), "utf-8");
    return fallbackFeedbacks;
  } catch (err) {
    console.error("Error reading feedbacks file:", err);
    return fallbackFeedbacks;
  }
}

function writeFeedbacks(feedbacks: FeedbackItem[]): boolean {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE_PATH), { recursive: true });
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(feedbacks, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing feedbacks file:", err);
    return false;
  }
}

function computeStats(feedbacks: FeedbackItem[]) {
  const total = feedbacks.length;
  if (total === 0) {
    return {
      average: 5.0,
      total: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const fb of feedbacks) {
    const r = Math.min(5, Math.max(1, Math.round(fb.rating || 5)));
    breakdown[r] = (breakdown[r] || 0) + 1;
    sum += fb.rating || 5;
  }

  const average = Number((sum / total).toFixed(1));

  return {
    average,
    total,
    breakdown,
  };
}

export async function GET() {
  const feedbacks = readFeedbacks();
  const stats = computeStats(feedbacks);
  return NextResponse.json({ feedbacks, stats });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { author, role, rating, tag, quote } = body;

    if (!author || typeof author !== "string" || !author.trim()) {
      return NextResponse.json({ error: "Author name is required." }, { status: 400 });
    }

    if (!quote || typeof quote !== "string" || !quote.trim()) {
      return NextResponse.json({ error: "Feedback review text is required." }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 });
    }

    const feedbacks = readFeedbacks();

    const newFeedback: FeedbackItem = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author: author.trim(),
      role: role && typeof role === "string" ? role.trim() : "Placement Candidate",
      rating: Math.round(numericRating),
      tag: tag && typeof tag === "string" && tag.trim() ? tag.trim() : "General Experience",
      quote: quote.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    feedbacks.unshift(newFeedback);
    writeFeedbacks(feedbacks);

    const stats = computeStats(feedbacks);

    return NextResponse.json({
      success: true,
      feedback: newFeedback,
      stats,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json({ error: "Failed to save feedback." }, { status: 500 });
  }
}
