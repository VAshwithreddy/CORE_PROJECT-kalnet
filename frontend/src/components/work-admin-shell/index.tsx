"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-shell";
import { Icon } from "@/components/core-icons";
import { getCurrentUser, subscribeSession } from "@/lib/mock-session";
import { getRequests, subscribe } from "@/lib/mock-db";

interface WorkAdminShellProps {
  children: ReactNode;
  activePath?: string;
  breadcrumbs?: ReactNode;
  topbarActions?: ReactNode;
}

export function WorkAdminShell({
  children,
  activePath = "/work-admin/home",
  breadcrumbs,
  topbarActions,
}: WorkAdminShellProps) {
  const [intakeBadge, setIntakeBadge] = useState(0);

  useEffect(() => {
    const countPending = () =>
      getRequests().filter((r) => r.status === "waiting").length;

    setIntakeBadge(countPending());

    const unsubDb = subscribe(() => setIntakeBadge(countPending()));
    const unsubSession = subscribeSession(() => setIntakeBadge(countPending()));
    return () => { unsubDb(); unsubSession(); };
  }, []);

  const navItems: NavItem[] = [
    { label: "Home", href: "/work-admin/home", icon: <Icon name="chart" /> },
    { label: "Intake", href: "/work-admin/intake", icon: <Icon name="inbox" />, badge: intakeBadge > 0 ? intakeBadge : undefined },
    { label: "Routing", href: "/work-admin/routing", icon: <Icon name="shuffle" /> },
    { label: "Department Heads", href: "/work-admin/department-heads", icon: <Icon name="users" /> },
    { label: "Approvals", href: "/work-admin/approvals", icon: <Icon name="check" /> },
    { label: "Escalations", href: "/work-admin/escalations", icon: <Icon name="alert" />, badgeType: "danger" as const },
    { label: "Audit", href: "/work-admin/audit", icon: <Icon name="report" /> },
  ];

  const user = getCurrentUser();

  return (
    <AppShell
      activePath={activePath}
      breadcrumbs={breadcrumbs}
      topbarActions={topbarActions}
      navSections={[{ label: "Operations", items: navItems }]}
      brand={{
        logoLetter: "C",
        logoColor: "var(--core-warning)",
        accentColor: "var(--core-warning)",
        accentSoft: "var(--core-warning-soft)",
        productName: "CORE",
        roleLabel: "Work Administration",
      }}
    >
      {children}
    </AppShell>
  );
}
