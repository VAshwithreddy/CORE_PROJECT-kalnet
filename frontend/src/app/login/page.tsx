"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import { ROLE_HOME_PATHS } from "@/lib/roles";
import { useAuth, type AuthUser } from "@/lib/auth";

const INFO_ITEMS = [
  {
    icon: "🧩",
    title: "What is CORE?",
    desc: "CORE brings your team's work intake, routing, assignments, and approvals into one unified workspace — so nothing slips through the cracks.",
  },
  {
    icon: "⚡",
    title: "Why use CORE?",
    desc: "Role-scoped dashboards, smart routing, and audit-ready history — giving every stakeholder exactly what they need, nothing more.",
  },
  {
    icon: "🎯",
    title: "Purpose of CORE",
    desc: "To simplify organisational operations with clarity, speed, and precision — from the frontline employee to the executive suite.",
  },
];

const INTEGRATIONS = [
  { label: "Slack", emoji: "💬" },
  { label: "Notion", emoji: "📝" },
  { label: "Gmail", emoji: "📧" },
  { label: "Meet", emoji: "📹" },
];

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, error: authError, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const isExecutingOAuthRef = useRef(false);
  
  useEffect(() => {
    setMounted(true);

    const isLogout = searchParams.get("logout") === "true";
    if (isLogout) {
      logout();
      return;
    }
  }, [searchParams, logout]);

  // Handle successful login redirect
  useEffect(() => {
    if (user && !authLoading) {
      const target = redirectPath || ROLE_HOME_PATHS[user.role as keyof typeof ROLE_HOME_PATHS] || "/employee/home";
      router.push(target);
    }
  }, [user, authLoading, router, redirectPath]);

  // Sync auth context error with local error
  useEffect(() => {
    if (authError) {
      setError(authError);
      setLoading(false);
    }
  }, [authError]);

  if (!mounted) return null;

  const fetchSupabaseUserByEmail = async (userEmail: string): Promise<any | null> => {
    const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/lookup?email=${encodeURIComponent(userEmail.trim().toLowerCase())}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        return data as AuthUser;
      }
    } catch (err) {
      console.warn("Backend email lookup failed:", err);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("active_login_attempt", "true");
      }
      await signInWithEmailAndPassword(firebaseAuth, email.trim().toLowerCase(), password);
      // Wait for useAuth effect / onAuthStateChanged to handle redirect and profile loading
    } catch (err: any) {
      console.error(err);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("active_login_attempt");
      }
      let errMsg = err?.message || "Authentication failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errMsg = "Invalid email or password.";
      }
      setError(errMsg);
      setLoading(false);
    }
  };


  const handleGoogleSignInClick = async () => {
    if (isExecutingOAuthRef.current || loading || authLoading) return;
    isExecutingOAuthRef.current = true;
    setLoading(true);
    setError(null);

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("active_login_attempt", "true");
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
      // useAuth effect will handle lookup and redirect
    } catch (err: any) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("active_login_attempt");
      }
      if (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request") {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(firebaseAuth, provider);
          return;
        } catch (redirectErr: any) {
          setError(redirectErr?.message || "Redirect authentication failed.");
        }
      } else {
        setError(err?.message || "Authentication failed.");
      }
      setLoading(false);
      isExecutingOAuthRef.current = false;
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    height: 48,
    padding: "0 16px 0 44px",
    borderRadius: 10,
    border: `1.5px solid ${focusedField === field ? "#0d9488" : "#e2e8f0"}`,
    background: "#fff",
    fontSize: 14,
    color: "#1e293b",
    outline: "none",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(13,148,136,0.12)" : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  });

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      fontFamily: "var(--core-font-sans)",
    }}>
      {/* ── LEFT PANEL: Original Dark Theme ─────────── */}
      <div style={{
        position: "relative",
        background: "linear-gradient(160deg, #0f172a 0%, #134e4a 50%, #1e1b4b 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px",
        overflow: "hidden",
      }}>
        {/* Background mesh grid - animated drift */}
        <div className="login-grid-drift" style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />
        {/* Animated glow orbs */}
        <div className="login-orb-teal" style={{ position: "absolute", width: 500, height: 500, top: -100, right: -100, zIndex: 0, pointerEvents: "none" }} />
        <div className="login-orb-purple" style={{ position: "absolute", width: 400, height: 400, bottom: -100, left: -100, zIndex: 0, pointerEvents: "none" }} />
        {/* Floating particles */}
        {[{l:"10%",d:"0s",dur:"7s"},{l:"25%",d:"1.5s",dur:"9s"},{l:"45%",d:"3s",dur:"6s"},{l:"60%",d:"0.8s",dur:"11s"},{l:"75%",d:"2.2s",dur:"8s"},{l:"88%",d:"4s",dur:"10s"}].map((p,i)=>(
          <div key={i} className="login-particle" style={{ left: p.l, bottom: "0", animationDelay: p.d, animationDuration: p.dur }} />
        ))}

        {/* Logo */}
        <div className="login-logo" style={{ position: "relative", zIndex: 10 }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: "linear-gradient(135deg, #0d9488, #6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--core-font-display)", fontWeight: 900, fontSize: 22, color: "#fff",
              boxShadow: "0 4px 20px rgba(13,148,136,0.4)",
            }}>C</div>
            <div>
              <div style={{ fontFamily: "var(--core-font-display)", fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.5px" }}>CORE</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Enterprise Platform</div>
            </div>
          </a>
        </div>

        {/* Main brand copy */}
        <div className="login-left-text" style={{ position: "relative", zIndex: 10 }}>
          <h2 style={{
            fontFamily: "var(--core-font-display)",
            fontSize: "clamp(36px, 4vw, 52px)",
            fontWeight: 900, letterSpacing: "-2px",
            color: "#fff", lineHeight: 1.1,
            marginBottom: 20,
          }}>
            Role-based<br />
            <span style={{ color: "#5eead4" }}>Secure Access</span><br />
            Portal.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, maxWidth: 380 }}>
            Enter your corporate credentials to launch your role-scoped workspace with strict role-based permissions.
          </p>

          {/* Live status */}
          <div className="login-left-badge" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "6px 14px" }}>
              <span className="login-dot-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>RBAC Enforcement Active</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              Phase 1 — Core Registry
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 10, fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>
          CORE — built by Team CORE for KALNET • © 2026 KALNET
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────── */}
      <div className="login-right-panel" style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "48px 40px",
        overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Card */}
          <div className="login-form-card login-card-enter" style={{
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            padding: "36px 36px 32px",
            boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
          }}>
            {/* Card Header */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontSize: 26, fontWeight: 800, color: "#0f172a",
                letterSpacing: "-0.5px", margin: 0, marginBottom: 6,
              }}>Welcome back!</h1>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                Login to continue to your CORE account
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                color: "#dc2626",
                fontSize: 13, fontWeight: 600,
                marginBottom: 20,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle("email")}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Password
                  </label>
                  <a href="#" style={{ fontSize: 12.5, color: "#0d9488", fontWeight: 600, textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle("password"), paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", padding: 4 }}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className=""
                style={{
                  width: "100%", height: 50, borderRadius: 10,
                  border: "none", color: "#fff",
                  fontWeight: 700, fontSize: 15,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: loading ? "none" : "0 6px 20px rgba(13,148,136,0.35)",
                  transition: "all 0.2s ease",
                  marginTop: 4,
                  background: loading ? "#94a3b8" : "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                }}
              >
                {loading || authLoading ? "Logging in…" : "Login →"}
              </button>
            </form>

            {/* ── Divider ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 0" }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            {/* ── Google Sign-In ── */}
            <button
              id="login-google"
              type="button"
              disabled={loading}
              className="google-btn"
              onClick={handleGoogleSignInClick}
              style={{
                width: "100%", height: 48, borderRadius: 10,
                border: "1.5px solid #e2e8f0", background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#1e293b",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                transition: "all 0.18s ease",
                marginTop: 14,
              }}
            >
              <GoogleIcon />
              Sign in with Google
            </button>

            {/* Trust Badge */}
            <div style={{ textAlign: "center", marginTop: 22 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 12.5 }}>
                <span style={{ color: "#10b981" }}><ShieldIcon /></span>
                Role-based access, enforced on every request
              </div>

            </div>

            {/* Sign up */}
            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#64748b" }}>
              Don&apos;t have an account?{" "}
              <a href="#" style={{ color: "#0d9488", fontWeight: 700, textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Contact your system admin
              </a>
            </div>
          </div>

          {/* Demo Users removed */}
        </div>
      </div>

      <style>{`
        /* ── Keyframes ─────────────────────────── */
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -20px) scale(1.05); }
          66%       { transform: translate(-20px, 15px) scale(0.97); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-25px, 20px) scale(1.08); }
          66%       { transform: translate(15px, -15px) scale(0.95); }
        }
        @keyframes gridDrift {
          0%   { background-position: 0px 0px; }
          100% { background-position: 40px 40px; }
        }
        @keyframes particleRise {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 8px #10b981, 0 0 0px rgba(16,185,129,0); }
          50%       { box-shadow: 0 0 16px #10b981, 0 0 30px rgba(16,185,129,0.3); }
        }
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes badgePop {
          0%   { opacity: 0; transform: scale(0.85) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Applied animation classes ─────────── */
        .login-orb-teal {
          animation: orbFloat 9s ease-in-out infinite;
          background: radial-gradient(circle, rgba(20,184,166,0.28) 0%, transparent 70%);
          border-radius: 50%;
        }
        .login-orb-purple {
          animation: orbFloat2 11s ease-in-out infinite;
          background: radial-gradient(circle, rgba(109,40,217,0.22) 0%, transparent 70%);
          border-radius: 50%;
        }
        .login-grid-drift {
          animation: gridDrift 8s linear infinite;
        }
        .login-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(94,234,212,0.7);
          animation: particleRise linear infinite;
          pointer-events: none;
        }
        .login-dot-pulse {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        .login-card-enter {
          animation: cardSlideUp 0.55s cubic-bezier(0.16,1,0.3,1) both;
        }
        .login-left-text {
          animation: slideRight 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both;
        }
        .login-left-badge {
          animation: badgePop 0.5s cubic-bezier(0.16,1,0.3,1) 0.5s both;
        }
        .login-logo {
          animation: fadeIn 0.5s ease 0.05s both;
        }

        /* ── Submit button (no animation) ──── */
        #login-submit:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(13,148,136,0.45) !important;
        }
        #login-submit:not(:disabled):active {
          transform: translateY(0px);
        }

        /* ── Google button ────────────────── */
        .google-btn:hover {
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.10) !important;
          transform: translateY(-1px);
        }
        .google-btn:active {
          transform: translateY(0);
        }

        /* ── Right panel bg subtle pulse ─────── */
        .login-right-panel {
          background: radial-gradient(ellipse at 70% 20%, rgba(13,148,136,0.06) 0%, transparent 60%),
                      radial-gradient(ellipse at 20% 80%, rgba(109,40,217,0.04) 0%, transparent 50%),
                      #f8fafc;
          animation: fadeIn 0.4s ease both;
        }

        /* ── Card hover lift ─────────────────── */
        .login-form-card {
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .login-form-card:hover {
          box-shadow: 0 12px 48px rgba(0,0,0,0.12) !important;
          transform: translateY(-2px);
        }

        /* ── Demo button row hover ───────────── */
        .demo-row-btn {
          transition: all 0.18s ease !important;
        }
        .demo-row-btn:hover {
          transform: translateX(4px);
        }

        @media (max-width: 860px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          .login-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f8fafc" }} />}>
      <LoginForm />
    </Suspense>
  );
}
