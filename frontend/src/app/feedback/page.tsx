"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface FeedbackItem {
  id: string;
  author: string;
  role: string;
  rating: number;
  tag: string;
  quote: string;
  createdAt: string;
  likes: number;
}

interface FeedbackStats {
  average: number;
  total: number;
  breakdown: Record<number, number>;
}

export default function FeedbackPage() {
  const { data: session } = useSession();

  // Reviews & Stats state
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    average: 4.9,
    total: 4,
    breakdown: { 5: 4, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<number | "all">("all");

  // Form state
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState("Overall Platform");
  const [quote, setQuote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [likedIds, setLikedIds] = useState<string[]>([]);

  const availableTags = [
    "Overall Platform",
    "ATS Resume Scorer",
    "HR Voice Interview",
    "Skill Quizzes",
    "Career Roadmap",
  ];

  const ratingDescriptions: Record<number, string> = {
    1: "Poor - Needs major improvements",
    2: "Fair - Decent but had issues",
    3: "Good - Useful for preparation",
    4: "Very Good - Helped significantly",
    5: "Outstanding - Highly recommended!",
  };

  // Auto-fill author name from session if available
  useEffect(() => {
    if (session?.user?.name && !authorName) {
      setAuthorName(session.user.name);
    }
  }, [session, authorName]);

  // Fetch feedbacks
  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!authorName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!quote.trim()) {
      setErrorMessage("Please enter your feedback review.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: authorName.trim(),
          role: authorRole.trim() || "Placement Candidate",
          rating,
          tag: selectedTag,
          quote: quote.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setSuccessMessage("🎉 Thank you! Your review has been published successfully.");
      setQuote("");
      if (!session?.user?.name) {
        setAuthorName("");
      }
      setAuthorRole("");
      setRating(5);

      // Refresh list
      fetchFeedbacks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = (id: string) => {
    if (likedIds.includes(id)) {
      setLikedIds(likedIds.filter((item) => item !== id));
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, likes: Math.max(0, f.likes - 1) } : f))
      );
    } else {
      setLikedIds([...likedIds, id]);
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, likes: f.likes + 1 } : f))
      );
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (selectedFilter === "all") return true;
    return f.rating === selectedFilter;
  });

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="bg-animated" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", color: "#0f172a" }}>
      
      {/* ── Top Navbar ────────────────────────────────────────────────────── */}
      <nav
        style={{
          borderBottom: "1px solid rgba(226, 232, 240, 0.9)",
          background: "rgba(255, 255, 255, 0.9)",
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
          {/* Brand */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src="/logo.jpg"
              alt="CareerNex Logo"
              style={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                objectFit: "cover",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
              }}
            />
            <div>
              <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#0f172a" }}>CareerNex</span>
              <span style={{ fontSize: "0.6875rem", color: "#2563eb", fontWeight: 700, marginLeft: "0.5rem", textTransform: "uppercase" }}>
                Reviews
              </span>
            </div>
          </Link>

          {/* Nav Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button
                className="btn-pop"
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.75rem",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ← Back to Home
              </button>
            </Link>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <button className="btn-gradient btn-pop" style={{ padding: "0.55rem 1.4rem", fontSize: "0.875rem" }}>
                Dashboard →
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Main Container ────────────────────────────────────────────────── */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem 5rem", width: "100%", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        
        {/* ── Page Header & Rating Stats Banner ────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "9999px",
                padding: "0.35rem 1rem",
                fontSize: "0.8125rem",
                color: "#1d4ed8",
                fontWeight: 700,
                marginBottom: "0.75rem",
              }}
            >
              ⭐ Candidate Experience & Feedback Wall
            </div>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
              Loved by Candidates Worldwide
            </h1>
            <p style={{ color: "#64748b", fontSize: "1.0625rem", marginTop: "0.35rem", maxWidth: "720px", lineHeight: 1.6 }}>
              Read genuine reviews from engineering students and developers who used CareerNex to crack ATS screening and ace real HR voice interview rounds.
            </p>
          </div>

          {/* Big Rating Summary Banner */}
          <div
            className="glass-card box-pop animate-smooth-in"
            style={{
              padding: "2rem 2.5rem",
              background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
              border: "1px solid #bfdbfe",
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: "2.5rem",
              alignItems: "center",
            }}
          >
            {/* Score box */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minWidth: "160px" }}>
              <div style={{ fontSize: "3.5rem", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                {stats.average}
              </div>
              <div style={{ display: "flex", gap: "3px", margin: "0.5rem 0", color: "#f59e0b", fontSize: "1.375rem" }}>
                {"★".repeat(Math.round(stats.average))}
                {"☆".repeat(5 - Math.round(stats.average))}
              </div>
              <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>
                from {stats.total} verified reviews
              </span>
            </div>

            {/* Rating breakdown bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.breakdown[stars] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={stars} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8125rem" }}>
                    <span style={{ width: "45px", color: "#475569", fontWeight: 600 }}>{stars} stars</span>
                    <div style={{ flex: 1, height: "8px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${percentage}%`,
                          background: stars >= 4 ? "#2563eb" : stars === 3 ? "#0284c7" : "#d97706",
                          borderRadius: "9999px",
                          transition: "width 0.5s ease",
                        }}
                      ></div>
                    </div>
                    <span style={{ width: "35px", color: "#64748b", textAlign: "right" }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Quick trust metrics */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderLeft: "1px solid #e2e8f0", paddingLeft: "2rem" }} className="mobile-hide">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#059669", fontWeight: 700, fontSize: "0.9375rem" }}>
                <span>✓</span> 100% Real Candidates
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#2563eb", fontWeight: 700, fontSize: "0.9375rem" }}>
                <span>⚡</span> Instant Live Updates
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontWeight: 600, fontSize: "0.875rem" }}>
                <span>🛡️</span> Zero Fake/Paid Reviews
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-Column Layout: Form (Left) & Reviews (Right) ──────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.6fr", gap: "2rem" }}>
          
          {/* ── Left Column: Feedback Submission Form ───────────────────────── */}
          <div>
            <div
              className="glass-card box-pop"
              style={{
                padding: "2.25rem",
                background: "#ffffff",
                position: "sticky",
                top: "92px",
              }}
            >
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
                ✍️ Share Your Feedback
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>
                Your feedback helps us continuously refine the AI questions, speech evaluations, and ATS models.
              </p>

              {successMessage && (
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "0.75rem",
                    padding: "0.875rem 1rem",
                    color: "#065f46",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "1.25rem",
                  }}
                >
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "0.75rem",
                    padding: "0.875rem 1rem",
                    color: "#dc2626",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginBottom: "1.25rem",
                  }}
                >
                  ⚠️ {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                
                {/* Interactive Star Rating Selector */}
                <div>
                  <label className="form-label" style={{ marginBottom: "0.4rem" }}>
                    Select Your Rating <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "2rem",
                            cursor: "pointer",
                            padding: "0 2px",
                            color: isFilled ? "#f59e0b" : "#cbd5e1",
                            transform: (hoverRating || rating) >= star ? "scale(1.15)" : "scale(1)",
                            transition: "all 0.15s ease",
                          }}
                          aria-label={`Rate ${star} star`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#2563eb", fontWeight: 700 }}>
                    {ratingDescriptions[hoverRating || rating]}
                  </div>
                </div>

                {/* Candidate Name */}
                <div>
                  <label className="form-label" htmlFor="feedback-author">
                    Your Full Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    id="feedback-author"
                    type="text"
                    placeholder="e.g. Devi Prasad Singh"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                {/* Candidate Role / College */}
                <div>
                  <label className="form-label" htmlFor="feedback-role">
                    Your Role or College
                  </label>
                  <input
                    id="feedback-role"
                    type="text"
                    placeholder="e.g. React Developer Intern / B.Tech CSE"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Feature Tag Selector */}
                <div>
                  <label className="form-label">
                    What Feature Did You Use Most?
                  </label>
                  <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                    {availableTags.map((tag) => {
                      const isSelected = selectedTag === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTag(tag)}
                          className="pill-pop"
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "0.5rem",
                            background: isSelected ? "#eff6ff" : "#ffffff",
                            border: isSelected ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                            color: isSelected ? "#1d4ed8" : "#475569",
                            fontSize: "0.75rem",
                            fontWeight: isSelected ? 700 : 500,
                            cursor: "pointer",
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Review Textarea */}
                <div>
                  <label className="form-label" htmlFor="feedback-quote">
                    Your Review & Experience <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    id="feedback-quote"
                    placeholder="Tell us how CareerNex helped your placement preparation, ATS score improvement, or mock interview readiness..."
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    className="form-textarea"
                    rows={4}
                    required
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem", fontSize: "0.75rem", color: "#94a3b8" }}>
                    {quote.length} characters
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gradient btn-pop"
                  style={{
                    padding: "0.85rem 1.5rem",
                    borderRadius: "0.75rem",
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin-slow">⏳</span> Submitting Review...
                    </>
                  ) : (
                    <>
                      Publish Feedback 🚀
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* ── Right Column: Reviews List & Filtering ──────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Filter Bar */}
            <div
              className="glass-card"
              style={{
                padding: "1rem 1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
                background: "#ffffff",
              }}
            >
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>
                Verified Candidate Reviews ({filteredFeedbacks.length})
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => setSelectedFilter("all")}
                  className="pill-pop"
                  style={{
                    padding: "0.35rem 0.8rem",
                    borderRadius: "0.5rem",
                    background: selectedFilter === "all" ? "#2563eb" : "#f1f5f9",
                    color: selectedFilter === "all" ? "#ffffff" : "#475569",
                    border: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  All ({feedbacks.length})
                </button>
                {[5, 4, 3].map((star) => (
                  <button
                    key={star}
                    onClick={() => setSelectedFilter(star)}
                    className="pill-pop"
                    style={{
                      padding: "0.35rem 0.8rem",
                      borderRadius: "0.5rem",
                      background: selectedFilter === star ? "#2563eb" : "#f1f5f9",
                      color: selectedFilter === star ? "#ffffff" : "#475569",
                      border: "none",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {star} ★ ({stats.breakdown[star] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                Loading verified candidate reviews...
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredFeedbacks.length === 0 && (
              <div
                className="glass-card"
                style={{
                  padding: "3rem 2rem",
                  textAlign: "center",
                  background: "#ffffff",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💬</div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>No reviews found for this filter</h3>
                <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  Be the first to submit a review with this rating!
                </p>
              </div>
            )}

            {/* Reviews Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {filteredFeedbacks.map((fb) => {
                const isLiked = likedIds.includes(fb.id);
                return (
                  <div
                    key={fb.id}
                    className="glass-card box-pop animate-smooth-in"
                    style={{
                      padding: "1.75rem",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {/* Review Header: User avatar, name, stars, date */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.9375rem",
                            boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                          }}
                        >
                          {getInitials(fb.author)}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>{fb.author}</span>
                            <span
                              style={{
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                                background: "#ecfdf5",
                                color: "#047857",
                                border: "1px solid #a7f3d0",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "9999px",
                              }}
                            >
                              ✓ Verified
                            </span>
                          </div>
                          <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>{fb.role}</div>
                        </div>
                      </div>

                      {/* Stars and Date */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div style={{ display: "flex", gap: "2px", color: "#f59e0b", fontSize: "1.0625rem" }}>
                          {"★".repeat(fb.rating)}
                          {"☆".repeat(5 - fb.rating)}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                          {formatDate(fb.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Tag Badge */}
                    {fb.tag && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            color: "#2563eb",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: "0.375rem",
                            padding: "0.15rem 0.5rem",
                          }}
                        >
                          📌 {fb.tag}
                        </span>
                      </div>
                    )}

                    {/* Review Quote */}
                    <p style={{ fontSize: "0.9375rem", color: "#334155", lineHeight: 1.65, fontStyle: "normal" }}>
                      "{fb.quote}"
                    </p>

                    {/* Review Footer: Like button */}
                    <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                      <button
                        onClick={() => handleLike(fb.id)}
                        className="pill-pop"
                        style={{
                          background: isLiked ? "#eff6ff" : "transparent",
                          border: isLiked ? "1px solid #93c5fd" : "1px solid #e2e8f0",
                          borderRadius: "9999px",
                          padding: "0.3rem 0.75rem",
                          fontSize: "0.8125rem",
                          color: isLiked ? "#2563eb" : "#64748b",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <span>{isLiked ? "❤️" : "🤍"}</span>
                        <span>Helpful ({fb.likes})</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid #e2e8f0",
          background: "#ffffff",
          padding: "2.5rem 1.5rem",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.8125rem",
            color: "#94a3b8",
          }}
        >
          <span>© {new Date().getFullYear()} CareerNex. Real candidate feedback & ratings.</span>
          <Link href="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
            Back to Homepage →
          </Link>
        </div>
      </footer>

    </div>
  );
}
