"use client";

import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { canAccessRoute } from "@/lib/route-policy";
import { Icon } from "@/components/core-icons";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { NotificationBell } from "@/components/notifications/notification-bell";

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
  accentColor?: string;
  accentSoft?: string;
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user: authUser, logout } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
    }
    setSessionReady(true);
  }, [authUser]);

  useEffect(() => {
    if (!sessionReady || !currentUser) return;

    if (
      pathname &&
      !pathname.startsWith("/forbidden") &&
      !pathname.startsWith("/login") &&
      pathname !== "/"
    ) {
      if (!canAccessRoute(pathname, currentUser.role)) {
        router.replace("/forbidden");
      }
    }
  }, [pathname, currentUser, router, sessionReady]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout error", e);
    }

    router.replace("/login");
  };

  const displayUser = user || currentUser || {
    initials: "??",
    name: "Guest User",
    role: "employee",
  };

  const shellStyle = {
    ["--core-shell-accent" as any]:
      brand.accentColor || brand.logoColor || "var(--core-brand)",
    ["--core-shell-accent-soft" as any]:
      brand.accentSoft || "var(--core-brand-soft)",
  } as CSSProperties;

  return (
    <div className="app-shell" style={shellStyle}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--core-overlay-bg)",
            backdropFilter: "var(--core-overlay-blur)",
            zIndex: 90,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-shell__sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="app-shell__sidebar-header">
          <div
            className="app-shell__logo"
            style={
              brand.logoColor
                ? { background: brand.logoColor }
                : undefined
            }
          >
            {brand.logoLetter}
          </div>

          <div>
            <div className="app-shell__product-name">
              {brand.productName}
            </div>

            <div className="app-shell__role-label">
              {brand.roleLabel}
            </div>
          </div>
        </div>

        <nav
          className="app-shell__nav"
          aria-label="Main navigation"
        >
          {navSections.map((section, idx) => (
            <div
              key={idx}
              className="app-shell__nav-section"
            >
              {section.label && (
                <div className="app-shell__nav-section-label">
                  {section.label}
                </div>
              )}

              {section.items.map((item) => {
                const isActive = activePath.startsWith(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`app-shell__nav-link ${
                      isActive ? "active" : ""
                    }`}
                    aria-current={
                      isActive ? "page" : undefined
                    }
                  >
                    <span
                      className="app-shell__nav-icon"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>

                    {item.label}

                    {item.badge ? (
                      <span
                        className={`app-shell__nav-badge${
                          item.badgeType
                            ? ` app-shell__nav-badge--${item.badgeType}`
                            : ""
                        }`}
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

        <div
          className="app-shell__sidebar-footer"
          style={{ position: "relative" }}
        >
          {userMenuOpen && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 12,
                right: 12,
                marginBottom: 8,
                background: "var(--core-surface)",
                border: "1px solid var(--core-border)",
                borderRadius: "var(--core-radius-md)",
                boxShadow: "var(--core-shadow-lg)",
                padding: 6,
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: "6px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--core-text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Session Controls
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  background: "var(--core-danger-soft)",
                  color: "var(--core-danger)",
                  border: "none",
                  borderRadius: "var(--core-radius-sm)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                <Icon name="logout" size={15} />
                Sign Out
              </button>
            </div>
          )}

          <button
            type="button"
            className="app-shell__user-button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="app-shell__avatar">
              {displayUser.initials}
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <div className="app-shell__user-name">
                {displayUser.name}
              </div>

              <div className="app-shell__user-role">
                {(displayUser as any).roleLabel ||
                  displayUser.role}
              </div>
            </div>

            <Icon
              name="more"
              size={16}
              style={{
                color: "var(--core-text-subtle)",
              }}
            />
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
            <Icon name="menu" size={18} />
          </button>

          <div className="app-shell__topbar-breadcrumb">
            {breadcrumbs}
          </div>

          {/* Notifications */}
          <NotificationBell />

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
    </div>
  );
}
