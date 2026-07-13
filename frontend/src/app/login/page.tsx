"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    // Simulate database check & session setup delay
    setTimeout(() => {
      setIsLoading(false);
      
      // Scoped redirection logic based on user selection
      switch (role) {
        case "employee":
          router.push("/employee/home");
          break;
        case "department":
          router.push("/department/home");
          break;
        case "executive":
          router.push("/executive/home");
          break;
        case "work-admin":
          router.push("/work-admin/home");
          break;
        case "system-admin":
          router.push("/system/home");
          break;
        default:
          router.push("/employee/home");
      }
    }, 800);
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">C</div>
          <h1 className="auth-title">Access CORE</h1>
          <p className="auth-subtitle">KALNET Internal Operations Platform</p>
        </div>

        {error && (
          <div className="alert-strip alert-strip--danger" role="alert" style={{ marginBottom: "20px" }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email field */}
          <div className="form-field">
            <label className="form-label" htmlFor="email-input">
              Work Email <span style={{ color: "var(--core-danger)" }}>*</span>
            </label>
            <input
              id="email-input"
              type="email"
              className={`form-input ${error && !email ? "form-input--error" : ""}`}
              placeholder="e.g. rahul@kalnet.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Password field */}
          <div className="form-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label" htmlFor="password-input">
                Password <span style={{ color: "var(--core-danger)" }}>*</span>
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Please contact the Platform Admin to reset your password.");
                }}
                className="form-helper"
                style={{ color: "var(--core-brand)", fontWeight: 500 }}
              >
                Forgot?
              </a>
            </div>
            <input
              id="password-input"
              type="password"
              className={`form-input ${error && !password ? "form-input--error" : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Role selector - for demo and onboarding purposes */}
          <div className="form-field" style={{ marginBottom: "24px" }}>
            <label className="form-label" htmlFor="role-select">
              System Role / Scope <span style={{ color: "var(--core-danger)" }}>*</span>
            </label>
            <select
              id="role-select"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
            >
              <option value="employee">Team Member (Employee)</option>
              <option value="department">Department Head</option>
              <option value="executive">CTO / CEO (Executive)</option>
              <option value="work-admin">Work Intake Admin</option>
              <option value="system-admin">Platform Admin</option>
            </select>
          </div>

          {/* Demo Info Box */}
          <div className="demo-credentials-box">
            <strong>💡 Demo Tip:</strong> You can enter any mock email and password. Select a role above to jump directly to its custom dashboard.
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              type="submit"
              className="core-button core-button-primary"
              style={{ width: "100%" }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
            <a
              href="/"
              className="core-button"
              style={{ width: "100%" }}
            >
              Cancel & Return
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
