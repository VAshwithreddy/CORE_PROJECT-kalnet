"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-shell";

interface SystemAdminShellProps {
  children: ReactNode;
  activePath?: string;
  breadcrumbs?: ReactNode;
  topbarActions?: ReactNode;
}

export function SystemAdminShell({
  children,
  activePath = "/system/users",
  breadcrumbs,
  topbarActions,
}: SystemAdminShellProps) {
  const navItems: NavItem[] = [
    { label: "Users", href: "/system/users", icon: "👥" },
    { label: "Roles", href: "/system/roles", icon: "🛡️" },
    { label: "Permissions", href: "/system/permissions", icon: "🔐" },
    { label: "Service Accounts", href: "/system/service-accounts", icon: "🖥️" },
    { label: "Audit", href: "/system/audit", icon: "📜" },
    { label: "Settings", href: "/system/settings", icon: "⚙️" },
  ];

  return (
    <AppShell
      activePath={activePath}
      breadcrumbs={breadcrumbs}
      topbarActions={topbarActions}
      navSections={[{ label: "Configuration", items: navItems }]}
      brand={{
        logoLetter: "C",
        logoColor: "var(--core-border-strong)",
        productName: "CORE",
        roleLabel: "System Administration",
      }}
    >
      {children}
    </AppShell>
  );
}
