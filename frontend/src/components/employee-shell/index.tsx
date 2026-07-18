"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-shell";
import { getCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";
import { getAssignmentsByOwner, getNotificationsByUser, subscribe } from "@/lib/mock-db";

interface EmployeeShellProps {
  children: ReactNode;
  activePath?: string;
  breadcrumbs?: ReactNode;
  topbarActions?: ReactNode;
}

export function EmployeeShell({
  children,
  activePath = "/employee/home",
  breadcrumbs,
  topbarActions,
}: EmployeeShellProps) {
  const [currentUser, setCurrentUser] = useState<CoreUser>(getCurrentUser());
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    // Initial fetch
    setCurrentUser(getCurrentUser());
    setAssignmentCount(getAssignmentsByOwner(getCurrentUser().id).filter(a => a.status !== "completed").length);
    setNotificationCount(getNotificationsByUser(getCurrentUser().id).filter(n => !n.isRead).length);

    const unsubSession = subscribeSession((user) => {
      setCurrentUser(user);
      setAssignmentCount(getAssignmentsByOwner(user.id).filter(a => a.status !== "completed").length);
      setNotificationCount(getNotificationsByUser(user.id).filter(n => !n.isRead).length);
    });

    const unsubDb = subscribe(() => {
      setAssignmentCount(getAssignmentsByOwner(getCurrentUser().id).filter(a => a.status !== "completed").length);
      setNotificationCount(getNotificationsByUser(getCurrentUser().id).filter(n => !n.isRead).length);
    });

    return () => {
      unsubSession();
      unsubDb();
    };
  }, []);

  const navItems: NavItem[] = [
    { label: "Home", href: "/employee/home", icon: "🏠" },
    { label: "My Work", href: "/employee/my-work", icon: "📋", badge: assignmentCount > 0 ? assignmentCount : undefined },
    { label: "Requests", href: "/employee/requests", icon: "📨" },
    { label: "Notifications", href: "/employee/notifications", icon: "🔔", badge: notificationCount > 0 ? notificationCount : undefined },
    { label: "Profile", href: "/employee/profile", icon: "👤" },
  ];

  return (
    <AppShell
      activePath={activePath}
      breadcrumbs={breadcrumbs}
      topbarActions={topbarActions}
      navSections={[{ label: "Personal", items: navItems }]}
      brand={{
        logoLetter: "C",
        productName: "CORE",
        roleLabel: "Employee Workspace"
      }}
    >
      {children}
    </AppShell>
  );
}
