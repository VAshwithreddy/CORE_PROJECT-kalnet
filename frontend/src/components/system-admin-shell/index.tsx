"use client";

import { useState, type ReactNode } from "react";

interface SystemAdminShellProps {
  children: ReactNode;
  activePath?: string;
  breadcrumbs?: ReactNode;
  topbarActions?: ReactNode;
}

export function SystemAdminShell({
  children,
  activePath = "/system/users",
  breadcrumbs,
  topbarActions,
}: SystemAdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: "Users", href: "/system/users", icon: "👥" },
    { label: "Roles", href: "/system/roles", icon: "🛡️" },
    { label: "Permissions", href: "/system/permissions", icon: "🔐" },
    { label: "Service Accounts", href: "/system/service-accounts", icon: "🖥️" },
    { label: "Audit", href: "/system/audit", icon: "📜" },
    { label: "Settings", href: "/system/settings", icon: "⚙️" },
  ];

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 90 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`app-shell__sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="app-shell__sidebar-header">
          <div className="app-shell__logo" style={{ background: "var(--core-border-strong)" }}>C</div>
          <div>
            <div className="app-shell__product-name">CORE</div>
            <div className="app-shell__role-label">System Administration</div>
          </div>
        </div>

        <nav className="app-shell__nav" aria-label="Main navigation">
          <div className="app-shell__nav-section">
            <div className="app-shell__nav-section-label">Configuration</div>
            {navItems.map((item) => {
              const isActive = activePath.startsWith(item.href);
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`app-shell__nav-link ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="app-shell__nav-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>

        <div className="app-shell__sidebar-footer">
          <button type="button" className="app-shell__user-button">
            <div className="app-shell__avatar">SY</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="app-shell__user-name">System Admin</div>
              <div className="app-shell__user-role">IT Operations</div>
            </div>
            <span aria-hidden="true" style={{ color: "var(--core-text-subtle)" }}>⋮</span>
          </button>
        </div>
      </aside>

      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <button
            type="button"
            className="core-button core-button-ghost core-button-icon app-shell__menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            ☰
          </button>

          <div className="app-shell__topbar-breadcrumb">
            {breadcrumbs}
          </div>

          <button type="button" className="app-shell__search-trigger" aria-label="Search command palette">
            <span aria-hidden="true">🔍</span> Search CORE...
            <span className="app-shell__search-kbd">Ctrl K</span>
          </button>

          {topbarActions && (
            <div className="app-shell__topbar-actions">
              {topbarActions}
            </div>
          )}
        </header>

        <main className="app-shell__content">
          {children}
        </main>
      </div>
    </div>
  );
}
