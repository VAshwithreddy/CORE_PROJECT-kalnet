"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-shell";

interface ExecutiveShellProps {
  children: ReactNode;
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
  const navItems: NavItem[] = [
    { label: "Overview", href: "/executive/overview", icon: "📈" },
    { label: "Departments", href: "/executive/departments", icon: "🏢" },
    { label: "Portfolio", href: "/executive/portfolio", icon: "📁" },
    { label: "Risks", href: "/executive/risks", icon: "🚨", badge: 1, badgeType: "danger" },
    { label: "Digest", href: "/executive/digest", icon: "📊" },
    { label: "Reports", href: "/executive/reports", icon: "📄" },
  ];

  return (
    <AppShell
      activePath={activePath}
      breadcrumbs={breadcrumbs}
      topbarActions={topbarActions}
      navSections={[{ label: "Leadership", items: navItems }]}
      brand={{
        logoLetter: "C",
        logoColor: "var(--core-executive)",
        productName: "CORE",
        roleLabel: "Executive Office"
      }}
    >
      {children}
    </AppShell>
  );
}
