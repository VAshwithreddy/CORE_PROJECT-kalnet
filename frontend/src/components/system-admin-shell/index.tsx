"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-shell";
import { Icon } from "@/components/core-icons";
import { useUnreadNotifications } from "@/components/notifications/use-unread-notifications";

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
  const { unreadCount: notificationCount } = useUnreadNotifications(1);

  const navItems: NavItem[] = [
    { label: "Users", href: "/system/users", icon: <Icon name="users" /> },
    { label: "Roles", href: "/system/roles", icon: <Icon name="shield" /> },
    { label: "Permissions", href: "/system/permissions", icon: <Icon name="lock" /> },
    { label: "Service Accounts", href: "/system/service-accounts", icon: <Icon name="monitor" /> },
    { label: "Audit", href: "/system/audit", icon: <Icon name="report" /> },
    { label: "Settings", href: "/system/settings", icon: <Icon name="settings" /> },
    { label: "Notifications", href: "/system/notifications", icon: <Icon name="bell" />, badge: notificationCount > 0 ? notificationCount : undefined },
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
        accentColor: "var(--core-text-muted)",
        accentSoft: "var(--core-surface-muted)",
        productName: "CORE",
        roleLabel: "System Administration",
      }}
    >
      {children}
    </AppShell>
  );
}
