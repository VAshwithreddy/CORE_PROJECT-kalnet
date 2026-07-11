"use client";

import { useState, type ReactNode } from "react";

interface ExecutiveShellProps {
  children: ReactNode;
  /** Active path segment to highlight nav item. */
  activePath?: string;
  breadcrumbs?: ReactNode;
  topbarActions?: ReactNode;
}

export function ExecutiveShell({
  children,
  activePath = "/executive/overview",
  breadcrumbs,
  topbarActions,
}: ExecutiveShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: "Overview", href: "/executive/overview", icon: "📈" },
    { label: "Departments", href: "/executive/departments", icon: "🏢" },
    { label: "Portfolio", href: "/executive/portfolio", icon: "📁" },
    { label: "Risks", href: "/executive/risks", icon: "🚨", badge: 1, badgeType: "danger" },
    { label: "Digest", href: "/executive/digest", icon: "📊" },
    { label: "Reports", href: "/executive/reports", icon: "📄" },
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
          <div className="app-shell__logo" style={{ background: "var(--core-executive)" }}>C</div>
          <div>
            <div className="app-shell__product-name">CORE</div>
            <div className="app-shell__role-label">Executive Office</div>
          </div>
        </div>

        <nav className="app-shell__nav" aria-label="Main navigation">
          <div className="app-shell__nav-section">
            <div className="app-shell__nav-section-label">Leadership</div>
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
                      aria-label={`${item.badge} items`}
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
            <div className="app-shell__avatar">MK</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="app-shell__user-name">Michael Kim</div>
              <div className="app-shell__user-role">CEO</div>
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
