"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-shell";
import { Icon } from "@/components/core-icons";
import { useAuth } from "@/lib/auth";

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
  const { user } = useAuth();

  const effectiveDepartmentName = departmentName || user?.departmentName || "Loading...";

  const navItems: NavItem[] = [
    { label: "Home", href: "/department/home", icon: <Icon name="home" /> },
    { label: "Team", href: "/department/team", icon: <Icon name="users" /> },
    { label: "Projects", href: "/department/projects", icon: <Icon name="folder" /> },
    { label: "Assignments", href: "/department/assignments", icon: <Icon name="clipboard" /> },
    { label: "Planner", href: "/department/planner", icon: <Icon name="calendar" /> },
    { label: "Blockers", href: "/department/blockers", icon: <Icon name="alert" />, badge: 2, badgeType: "danger" },
    { label: "Digest", href: "/department/digest", icon: <Icon name="chart" /> },
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
        accentColor: "var(--core-brand)",
        accentSoft: "var(--core-brand-soft)",
        productName: "CORE",
        roleLabel: "Department Head"
      }}
      scopeBar={
        <>
          <Icon name="building" size={16} />
          <span>Department Scope:</span>
          <span className="app-shell__scope-label">{effectiveDepartmentName}</span>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
