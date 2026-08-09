"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-shell";
import { Icon } from "@/components/core-icons";

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
    { label: "Overview", href: "/executive/overview", icon: <Icon name="trend" /> },
    { label: "Departments", href: "/executive/departments", icon: <Icon name="building" /> },
    { label: "Portfolio", href: "/executive/portfolio", icon: <Icon name="folder" /> },
    { label: "Risks", href: "/executive/risks", icon: <Icon name="alert" />, badge: 1, badgeType: "danger" },
    { label: "Digest", href: "/executive/digest", icon: <Icon name="chart" /> },
    { label: "Reports", href: "/executive/reports", icon: <Icon name="report" /> },
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
        accentColor: "var(--core-executive)",
        accentSoft: "var(--core-executive-soft)",
        productName: "CORE",
        roleLabel: "Executive Office",
      }}
    >
      {children}
    </AppShell>
  );
}
