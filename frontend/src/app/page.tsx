"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USERS, setCurrentUser } from "@/lib/mock-session";
import { ROLE_HOME_PATHS } from "@/lib/roles";

export default function RootPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--core-bg)", color: "var(--core-text)" }}>
      <header style={{ padding: "24px 48px", borderBottom: "1px solid var(--core-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "var(--core-primary)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "20px"
        }}>
          C
        </div>
        <h1 style={{ fontSize: "20px", fontWeight: 600, letterSpacing: "-0.5px" }}>CORE Management Platform</h1>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-1px", marginBottom: 16 }}>
          Select a Persona to Begin
        </h2>
        <p style={{ fontSize: "18px", color: "var(--core-text-muted)", maxWidth: 600, marginBottom: 48, lineHeight: 1.5 }}>
          Experience the CORE platform from multiple perspectives. Each persona has access to different workspaces, data scopes, and capabilities.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", maxWidth: 1000 }}>
          {DEMO_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                setCurrentUser(user);
                router.push(ROLE_HOME_PATHS[user.role]);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: 24,
                background: "var(--core-surface)",
                border: "1px solid var(--core-border)",
                borderRadius: "var(--core-radius-md)",
                boxShadow: "var(--core-shadow-sm)",
                cursor: "pointer",
                textAlign: "left",
                width: 280,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "var(--core-shadow-lg)";
                e.currentTarget.style.borderColor = "var(--core-border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--core-shadow-sm)";
                e.currentTarget.style.borderColor = "var(--core-border)";
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 24,
                background: "var(--core-surface-inverted)", color: "var(--core-text-inverted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 600, fontSize: "18px", marginBottom: 16
              }}>
                {user.initials}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: 4 }}>{user.name}</h3>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--core-primary)", marginBottom: 8 }}>
                {user.roleLabel}
              </div>
              <p style={{ fontSize: "13px", color: "var(--core-text-muted)", margin: 0, lineHeight: 1.4 }}>
                Department: {user.departmentName}
              </p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
