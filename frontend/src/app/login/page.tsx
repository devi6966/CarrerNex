"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Client-side validations
    if (!name.trim()) {
      setError("Name cannot be empty.");
      setLoading(false);
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!email.trim() || !gmailRegex.test(email.trim().toLowerCase())) {
      setError("Please enter a valid Gmail address ending with @gmail.com.");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (res?.error) {
        setError("Sign-in failed. Please verify inputs.");
        setLoading(false);
      } else {
        // Redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div
      className="bg-animated"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        color: "#0f172a",
      }}
    >
      <div
        className="glass-card animate-fadeIn"
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "2.5rem 2.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 12px 36px -4px rgba(15, 23, 42, 0.08)",
        }}
      >
        {/* Brand header */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <img
            src="/logo.jpg"
            alt="CareerNex Logo"
            style={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              objectFit: "cover",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
            }}
          />
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, marginTop: "0.5rem", color: "#0f172a", letterSpacing: "-0.025em" }}>
            Welcome to CareerNex
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Sign in to access your recruitment readiness suite
          </p>
        </div>

        {/* Validation Errors */}
        {error && (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#be123c",
              fontSize: "0.8125rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Google Authentication Button (Hero / Primary Action) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button
            onClick={handleGoogleSignIn}
            type="button"
            disabled={loading}
            className="btn-pop"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.875rem",
              padding: "1rem 1.5rem",
              borderRadius: "0.875rem",
              background: "#ffffff",
              border: "2px solid #e2e8f0",
              color: "#0f172a",
              fontSize: "1.05rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
              width: "100%",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.36 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54V6.58H1.26a11.97 11.97 0 0 0 0 10.84l4.02-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            Sign in with Google
          </button>
          
          {/* Trust features */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              padding: "0.75rem 0.5rem",
              background: "#f8fafc",
              borderRadius: "0.75rem",
              border: "1px solid #f1f5f9",
              fontSize: "0.75rem",
              color: "#64748b",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>🔒</span>
              <span>Google OAuth 2.0</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>⚡</span>
              <span>Instant 1-Click</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>🛡️</span>
              <span>Zero Password Storage</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>✨</span>
              <span>Safe & Verified</span>
            </div>
          </div>
        </div>

        {/* Collapsible Developer / Offline Demo Mode */}
        <details
          style={{
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            fontSize: "0.8125rem",
            color: "#64748b",
            cursor: "pointer",
          }}
        >
          <summary style={{ fontWeight: 600, color: "#475569", outline: "none" }}>
            🛠️ Local Testing / Offline Guest Access
          </summary>
          <p style={{ margin: "0.5rem 0 0.75rem 0", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>
            Use this fallback if you haven't added your Google Client ID & Secret to <code>.env.local</code> yet.
          </p>

          <form onSubmit={handleCredentialsSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                Name
              </label>
              <input
                type="text"
                placeholder="Devi Prasad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="form-input"
                style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                Gmail
              </label>
              <input
                type="text"
                placeholder="deviprasad@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="form-input"
                style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }}
              />
            </div>

            <button
              type="submit"
              className="btn-gradient btn-pop"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Continue as Offline Guest →"}
            </button>
          </form>
        </details>

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.5, marginTop: "0.25rem" }}>
          By continuing, you agree to CareerNex's Terms of Service and acknowledge our Privacy Policy.
        </p>
      </div>
    </div>
  );
}
