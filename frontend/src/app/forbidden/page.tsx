"use client";

import Link from "next/link";
import { RoleSwitcher } from "@/components/role-switcher";

export default function ForbiddenPage() {
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

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: 24 }}>🛡️</div>
        <h2 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-1px", marginBottom: 16 }}>
          Access Denied
        </h2>
        <p style={{ fontSize: "16px", color: "var(--core-text-muted)", maxWidth: 500, marginBottom: 32, lineHeight: 1.5 }}>
          Your current role does not have permission to access this workspace. Use the Role Switcher to change your active persona or return home.
        </p>

        <Link href="/" className="core-button core-button-primary">
          Return to Dashboard
        </Link>
      </main>

      <RoleSwitcher />
    </div>
  );
}
