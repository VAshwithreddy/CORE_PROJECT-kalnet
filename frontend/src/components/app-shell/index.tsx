"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RoleSwitcher } from "@/components/role-switcher";
import { getCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";
import { canAccessRoute } from "@/lib/route-policy";

export interface NavItem {
  label: string;
  href: string;
  icon: string | ReactNode;
  badge?: number | string;
  badgeType?: "danger" | "warning" | "success" | "info" | "neutral";
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export interface AppShellUser {
  initials: string;
  name: string;
  role: string;
}

export interface AppShellBrand {
  logoLetter: string;
  logoColor?: string;
  productName: string;
  roleLabel: string;
}

export interface AppShellProps {
  children: ReactNode;
  /** Sections of navigation items */
  navSections: NavSection[];
  /** Active path segment to highlight nav item */
  activePath?: string;
  /** Current user information (optional, falls back to mock-session) */
  user?: AppShellUser;
  /** Branding configuration for the sidebar header */
  brand: AppShellBrand;
  /** Breadcrumb elements for the topbar */
  breadcrumbs?: ReactNode;
  /** Custom actions for the topbar */
  topbarActions?: ReactNode;
  /** Optional scope bar to render below the topbar */
  scopeBar?: ReactNode;
}

export function AppShell({
  children,
  navSections,
  activePath = "/",
  user,
  brand,
  breadcrumbs,
  topbarActions,
  scopeBar,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CoreUser>(getCurrentUser());
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    return subscribeSession((newUser) => setCurrentUser(newUser));
  }, []);

  useEffect(() => {
    // Only guard routes if we're not already on the forbidden page
    if (pathname && !pathname.startsWith("/forbidden")) {
      if (!canAccessRoute(pathname, currentUser.role)) {
        router.replace("/forbidden");
      }
    }
  }, [pathname, currentUser.role, router]);

  const displayUser = user || currentUser;

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "var(--core-overlay-bg)", backdropFilter: "var(--core-overlay-blur)", zIndex: 90 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-shell__sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="app-shell__sidebar-header">
          <div className="app-shell__logo" style={brand.logoColor ? { background: brand.logoColor } : undefined}>
            {brand.logoLetter}
          </div>
          <div>
            <div className="app-shell__product-name">{brand.productName}</div>
            <div className="app-shell__role-label">{brand.roleLabel}</div>
          </div>
        </div>

        <nav className="app-shell__nav" aria-label="Main navigation">
          {navSections.map((section, idx) => (
            <div key={idx} className="app-shell__nav-section">
              {section.label && <div className="app-shell__nav-section-label">{section.label}</div>}
              {section.items.map((item) => {
                const isActive = activePath.startsWith(item.href);
                return (
                  <Link
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
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="app-shell__sidebar-footer">
          <button type="button" className="app-shell__user-button">
            <div className="app-shell__avatar">{displayUser.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="app-shell__user-name">{displayUser.name}</div>
              <div className="app-shell__user-role">
                {(displayUser as any).roleLabel || displayUser.role}
              </div>
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

        {scopeBar && (
          <div className="app-shell__scope-bar">
            {scopeBar}
          </div>
        )}

        <main className="app-shell__content">
          {children}
        </main>
      </div>
      <RoleSwitcher />
    </div>
  );
}
