"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const { data: session } = useSession();

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const getFirstName = (nameStr: string) => {
    if (!nameStr) return "User";
    return nameStr.trim().split(/\s+/)[0];
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  // Helper to map pathname to clean label list for breadcrumbs
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg) => {
      if (seg === "dashboard") return "Dashboard";
      if (seg === "ats") return "ATS Checker";
      if (seg === "quiz") return "Skill Quiz";
      if (seg === "interview") return "HR Interview";
      if (seg === "roadmap") return "Career Roadmap";
      return seg.charAt(0).toUpperCase() + seg.slice(1);
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "ATS Checker", href: "/dashboard/ats", icon: "📄" },
    { name: "Skill Quiz", href: "/dashboard/quiz", icon: "🧠" },
    { name: "HR Interview", href: "/dashboard/interview", icon: "🎙️" },
    { name: "Career Roadmap", href: "/dashboard/roadmap", icon: "🗺️" },
    { name: "Candidate Reviews", href: "/feedback", icon: "⭐" },
    { name: "Home Page", href: "/", icon: "🏠" },
  ];

  const userDisplayName = session?.user?.name || "Candidate User";
  const userGmail = session?.user?.email || "user@gmail.com";
  const rawImage = session?.user?.image;
  const userImage = rawImage && !rawImage.includes("dicebear.com") ? rawImage : null;
  const userInitials = getInitials(userDisplayName);

  return (
    <div style={{ minHeight: "100vh", display: "flex", color: "#0f172a", background: "#f8fafc" }}>
      
      {/* ── 1. Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        style={{
          width: "260px",
          borderRight: "1px solid #e2e8f0",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
        className="mobile-hide"
      >
        {/* Brand/Logo header (Clickable to Home) */}
        <Link
          href="/"
          style={{
            height: "72px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0 1.5rem",
            textDecoration: "none",
          }}
          title="CareerNex Placement Guide"
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              background: "#f4f4f5",
              border: "1px solid #e4e4e7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            🎓
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#09090b", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              CareerNex
            </div>
            <div style={{ fontSize: "0.575rem", color: "#71717a", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginTop: "0.15rem" }}>
              PLACEMENT GUIDE
            </div>
          </div>
        </Link>

        {/* Navigation list */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.375rem", padding: "1.5rem 1rem", flex: 1 }}>
          {[
            {
              name: "Dashboard",
              href: "/dashboard",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              ),
            },
            {
              name: "ATS Checker",
              href: "/dashboard/ats",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              ),
            },
            {
              name: "Skill Quiz",
              href: "/dashboard/quiz",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path>
                </svg>
              ),
            },
            {
              name: "HR Interview",
              href: "/dashboard/interview",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              ),
            },
            {
              name: "Career Roadmap",
              href: "/dashboard/roadmap",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
              ),
            },
            {
              name: "Candidate Reviews",
              href: "/feedback",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              ),
            },
            {
              name: "Home Page",
              href: "/",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              ),
            },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link href={item.href} key={item.name} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.625rem",
                    background: isActive ? "#09090b" : "transparent",
                    color: isActive ? "#ffffff" : "#3f3f46",
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 700 : 500,
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#09090b";
                      e.currentTarget.style.background = "#f4f4f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#3f3f46";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Bottom Callout Box matching reference */}
        <div
          style={{
            margin: "1rem",
            padding: "1rem 1.15rem",
            background: "#f4f4f5",
            borderRadius: "14px",
            border: "1px solid #e4e4e7",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#ffffff",
                border: "1px solid #e4e4e7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                color: "#09090b",
                fontWeight: 700,
              }}
            >
              →
            </div>
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#18181b", marginTop: "0.3rem", lineHeight: 1.35 }}>
            Practice Today<br />Get Placed Tomorrow
          </div>
          <div style={{ fontSize: "0.68rem", color: "#71717a", fontStyle: "italic", marginTop: "0.35rem", lineHeight: 1.3 }}>
            &ldquo;Consistent practice builds confident developers.&rdquo;
          </div>
          <div style={{ fontSize: "0.65rem", color: "#71717a", textAlign: "right", marginTop: "0.2rem" }}>
            — CareerNex
          </div>
        </div>

        {/* User Account Bar */}
        <div
          style={{
            padding: "0.85rem 1.25rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            {userImage && !avatarImgError ? (
              <img
                src={userImage}
                alt={userDisplayName}
                onError={() => setAvatarImgError(true)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "2px solid #09090b",
                  flexShrink: 0,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#09090b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                {userInitials}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={userDisplayName}
              >
                {userDisplayName}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={userGmail}
              >
                {userGmail}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.15rem",
              padding: "0.35rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            title="Logout"
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            🚪
          </button>
        </div>
      </aside>

      {/* ── 2. Main Content Window Frame ───────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* Top Navbar */}
        <header
          style={{
            height: "72px",
            borderBottom: "1px solid #e2e8f0",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
            zIndex: 90,
          }}
        >
          {/* Left: Title & Subtitle or Breadcrumbs */}
          {/* Left: Mobile Toggle & Page Context */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Hamburger Button for mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                color: "#0f172a",
                cursor: "pointer",
                padding: 0,
                display: "none",
              }}
              className="mobile-show"
            >
              ☰
            </button>

            {/* Back to Dashboard Button (Only on sub-pages except roadmap which has page breadcrumbs) */}
            {pathname !== "/dashboard" && pathname !== "/dashboard/roadmap" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "0.5rem",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      transition: "all 0.2s",
                      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
                    }}
                  >
                    ← Dashboard
                  </button>
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }} className="mobile-hide">
                  {breadcrumbs.map((crumb, idx) => (
                    <span key={crumb} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {idx > 0 && <span style={{ color: "#cbd5e1" }}>/</span>}
                      <span style={{ fontWeight: idx === breadcrumbs.length - 1 ? 700 : 500, color: idx === breadcrumbs.length - 1 ? "#0f172a" : "#64748b" }}>
                        {crumb}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ) : pathname === "/dashboard" ? (
              <div>
                <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#09090b", letterSpacing: "-0.02em" }}>
                  Dashboard
                </div>
                <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "0.1rem" }}>
                  Track your preparation. Achieve your goals.
                </div>
              </div>
            ) : null}
          </div>

          {/* Right: User Name Greeting, Main Page Button, User Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            {/* User Greeting with Name */}
            <span
              style={{
                fontSize: "0.875rem",
                color: "#18181b",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
              className="mobile-hide"
            >
              Hi, <strong style={{ color: "#09090b", fontWeight: 700 }}>{getFirstName(userDisplayName)}</strong> 👋
            </span>

            {/* Main Page Button */}
            <Link href="/" style={{ textDecoration: "none" }}>
              <button
                className="btn-pop"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.45rem 0.95rem",
                  borderRadius: "8px",
                  background: "#ffffff",
                  border: "1px solid #e4e4e7",
                  color: "#09090b",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Main Page</span>
              </button>
            </Link>

            {/* Solid Obsidian User Avatar */}
            {userImage && !avatarImgError ? (
              <img
                src={userImage}
                alt={userDisplayName}
                onError={() => setAvatarImgError(true)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "2px solid #09090b",
                  flexShrink: 0,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#09090b",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
                title={userDisplayName}
              >
                {userInitials[0] || "U"}
              </div>
            )}
          </div>
        </header>

        {/* ── 3. Mobile Slideout Sidebar menu ────────────────────────────────── */}
        {mobileMenuOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255, 255, 255, 0.98)",
              zIndex: 1000,
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <img
                  src="/logo.jpg"
                  alt="CareerNex Logo"
                  style={{ width: 28, height: 28, borderRadius: "6px", objectFit: "cover" }}
                />
                <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "#0f172a" }}>CareerNex</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#0f172a", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            
            <nav style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
              {navigationItems.map((item) => (
                <Link
                  href={item.href}
                  key={item.name}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontSize: "1.125rem",
                    color: pathname === item.href ? "#1d4ed8" : "#475569",
                    textDecoration: "none",
                    fontWeight: 600,
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    background: pathname === item.href ? "#eff6ff" : "transparent",
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "0.875rem",
                borderRadius: "0.75rem",
                border: "1px solid #fecdd3",
                background: "#fff1f2",
                color: "#e11d48",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              🚪 Logout
            </button>
          </div>
        )}

        {/* Scrollable Dashboard Body Viewport Slot */}
        <main style={{ flex: 1, padding: "2.5rem 2rem", overflowY: "auto" }}>
          {children}
        </main>

      </div>

      {/* Responsive layout helpers css */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-hide {
            display: none !important;
          }
          .mobile-show {
            display: block !important;
          }
        }
      `}</style>

    </div>
  );
}
