"use client";

import { useState, type ReactNode } from "react";

interface DepartmentShellProps {
  children: ReactNode;
  /** Active path segment to highlight nav item. e.g. "/department/assignments" */
  activePath?: string;
  /** Breadcrumb elements for the topbar */
  breadcrumbs?: ReactNode;
  /** Custom actions for the topbar */
  topbarActions?: ReactNode;
  /** The department name for the scope bar */
  departmentName?: string;
}

export function DepartmentShell({
  children,
  activePath = "/department/home",
  breadcrumbs,
  topbarActions,
  departmentName = "Engineering",
}: DepartmentShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/department/home", icon: "🏠" },
    { label: "Team", href: "/department/team", icon: "👥" },
    { label: "Projects", href: "/department/projects", icon: "📁" },
    { label: "Assignments", href: "/department/assignments", icon: "📋" },
    { label: "Planner", href: "/department/planner", icon: "🗓️" },
    { label: "Blockers", href: "/department/blockers", icon: "🚧", badge: 2, badgeType: "danger" },
    { label: "Digest", href: "/department/digest", icon: "📊" },
  ];

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 90 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-shell__sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="app-shell__sidebar-header">
          <div className="app-shell__logo" style={{ background: "var(--core-brand)" }}>C</div>
          <div>
            <div className="app-shell__product-name">CORE</div>
            <div className="app-shell__role-label">Department Head</div>
          </div>
        </div>

        <nav className="app-shell__nav" aria-label="Main navigation">
          <div className="app-shell__nav-section">
            <div className="app-shell__nav-section-label">Department</div>
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
                  {item.badge ? (
                    <span
                      className={`app-shell__nav-badge${item.badgeType ? ` app-shell__nav-badge--${item.badgeType}` : ""}`}
                      aria-label={`${item.badge} unread items`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </a>
              );
            })}
          </div>
        </nav>

        <div className="app-shell__sidebar-footer">
          <button type="button" className="app-shell__user-button">
            <div className="app-shell__avatar">SW</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="app-shell__user-name">Sarah Wong</div>
              <div className="app-shell__user-role">Head of Engineering</div>
            </div>
            <span aria-hidden="true" style={{ color: "var(--core-text-subtle)" }}>⋮</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
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

        <div className="app-shell__scope-bar">
          <span aria-hidden="true">🏢</span>
          <span>Department Scope:</span>
          <span className="app-shell__scope-label">{departmentName}</span>
        </div>

        <main className="app-shell__content">
          {children}
        </main>
      </div>
    </div>
  );
}
