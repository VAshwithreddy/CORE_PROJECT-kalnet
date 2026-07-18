"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-shell";
import { getCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";

interface DepartmentShellProps {
  children: ReactNode;
  activePath?: string;
  breadcrumbs?: ReactNode;
  topbarActions?: ReactNode;
  departmentName?: string;
}

export function DepartmentShell({
  children,
  activePath = "/department/home",
  breadcrumbs,
  topbarActions,
  departmentName,
}: DepartmentShellProps) {
  const [currentUser, setCurrentUser] = useState<CoreUser>(getCurrentUser());

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    return subscribeSession((newUser) => setCurrentUser(newUser));
  }, []);

  const effectiveDepartmentName = departmentName || currentUser.departmentName;

  const navItems: NavItem[] = [
    { label: "Home", href: "/department/home", icon: "🏠" },
    { label: "Team", href: "/department/team", icon: "👥" },
    { label: "Projects", href: "/department/projects", icon: "📁" },
    { label: "Assignments", href: "/department/assignments", icon: "📋" },
    { label: "Planner", href: "/department/planner", icon: "🗓️" },
    { label: "Blockers", href: "/department/blockers", icon: "🚧", badge: 2, badgeType: "danger" },
    { label: "Digest", href: "/department/digest", icon: "📊" },
  ];

  return (
    <AppShell
      activePath={activePath}
      breadcrumbs={breadcrumbs}
      topbarActions={topbarActions}
      navSections={[{ label: "Department", items: navItems }]}
      brand={{
        logoLetter: "C",
        logoColor: "var(--core-brand)",
        productName: "CORE",
        roleLabel: "Department Head"
      }}
      scopeBar={
        <>
          <span aria-hidden="true">🏢</span>
          <span>Department Scope:</span>
          <span className="app-shell__scope-label">{effectiveDepartmentName}</span>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
