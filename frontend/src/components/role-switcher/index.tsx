"use client";

import { useEffect, useState } from "react";
import { DEMO_USERS, getCurrentUser, setCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUserState] = useState<CoreUser>(DEMO_USERS[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentUserState(getCurrentUser());
    return subscribeSession((user) => {
      setCurrentUserState(user);
    });
  }, []);

  if (!mounted) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 8,
    }}>
      {open && (
        <div style={{
          background: "var(--core-surface)",
          border: "1px solid var(--core-border)",
          borderRadius: "var(--core-radius-md)",
          boxShadow: "var(--core-shadow-lg)",
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          minWidth: 200,
        }}>
          <div style={{ padding: "4px 8px", fontSize: "11px", fontWeight: 600, color: "var(--core-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Demo Personas
          </div>
          {DEMO_USERS.map(user => (
            <button
              key={user.id}
              onClick={() => {
                setCurrentUser(user);
                setOpen(false);
                
                // Redirect if the new role doesn't match the current URL scope
                const currentPath = window.location.pathname;
                if (user.role === "employee" && !currentPath.startsWith("/employee")) {
                  window.location.href = "/employee/home";
                } else if (user.role === "department" && !currentPath.startsWith("/department")) {
                  window.location.href = "/department/home";
                } else if (user.role === "executive" && !currentPath.startsWith("/executive")) {
                  window.location.href = "/executive/overview";
                } else if (user.role === "work-admin" && !currentPath.startsWith("/work-admin")) {
                  window.location.href = "/work-admin/home";
                } else if (user.role === "system-admin" && !currentPath.startsWith("/system")) {
                  window.location.href = "/system/users";
                }
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "8px 12px",
                background: user.id === currentUser.id ? "var(--core-surface-muted)" : "transparent",
                border: "none",
                borderRadius: "var(--core-radius-sm)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 500, fontSize: "13px", color: "var(--core-text)" }}>
                {user.name} <span style={{ fontWeight: 400, color: "var(--core-text-subtle)" }}>({user.role})</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--core-text-muted)", marginTop: 2 }}>
                {user.roleLabel} • {user.departmentName}
              </div>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--core-surface-inverted)",
          color: "var(--core-text-inverted)",
          border: "none",
          padding: "8px 16px",
          borderRadius: 999,
          cursor: "pointer",
          boxShadow: "var(--core-shadow-md)",
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        <span style={{ opacity: 0.8, fontSize: "12px" }}>Demo Mode:</span>
        <span>{currentUser.name}</span>
        <span style={{
          background: "rgba(255,255,255,0.2)",
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: "11px",
          marginLeft: 4,
        }}>
          {currentUser.role}
        </span>
      </button>
    </div>
  );
}
