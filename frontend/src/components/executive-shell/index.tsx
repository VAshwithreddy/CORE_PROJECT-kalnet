"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-shell";
import { Icon } from "@/components/core-icons";
import { useUnreadNotifications } from "@/components/notifications/use-unread-notifications";
import { useAuth } from "@/lib/auth";
import { getBlockers } from "@/lib/api";

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
  const { token } = useAuth();
  const { unreadCount: notificationCount } = useUnreadNotifications(1);
  const [riskCount, setRiskCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    getBlockers(token)
      .then((blockers) => setRiskCount(Array.isArray(blockers) ? blockers.length : 0))
      .catch(() => setRiskCount(0));
  }, [token]);

  const navItems: NavItem[] = [
    { label: "Overview", href: "/executive/overview", icon: <Icon name="trend" /> },
    { label: "Departments", href: "/executive/departments", icon: <Icon name="building" /> },
    { label: "Portfolio", href: "/executive/portfolio", icon: <Icon name="folder" /> },
    { label: "Risks", href: "/executive/risks", icon: <Icon name="alert" />, badge: riskCount || undefined, badgeType: "danger" },
    { label: "Digest", href: "/executive/digest", icon: <Icon name="chart" /> },
    { label: "Reports", href: "/executive/reports", icon: <Icon name="report" /> },
    { label: "Notifications", href: "/executive/notifications", icon: <Icon name="bell" />, badge: notificationCount > 0 ? notificationCount : undefined },
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
