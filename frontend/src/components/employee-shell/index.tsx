"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-shell";
import { Icon } from "@/components/core-icons";
import { DEMO_USERS, getCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";
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
  const [currentUser, setCurrentUser] = useState<CoreUser>(DEMO_USERS[0]);
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
    { label: "Home", href: "/employee/home", icon: <Icon name="home" /> },
    { label: "My Work", href: "/employee/my-work", icon: <Icon name="clipboard" />, badge: assignmentCount > 0 ? assignmentCount : undefined },
    { label: "Requests", href: "/employee/requests", icon: <Icon name="inbox" /> },
    { label: "Notifications", href: "/employee/notifications", icon: <Icon name="bell" />, badge: notificationCount > 0 ? notificationCount : undefined },
    { label: "Profile", href: "/employee/profile", icon: <Icon name="user" /> },
  ];

  return (
    <AppShell
      activePath={activePath}
      breadcrumbs={breadcrumbs}
      topbarActions={topbarActions}
      navSections={[{ label: "Personal", items: navItems }]}
      brand={{
        logoLetter: "C",
        logoColor: "var(--core-info)",
        accentColor: "var(--core-info)",
        accentSoft: "var(--core-info-soft)",
        productName: "CORE",
        roleLabel: "Employee Workspace"
      }}
    >
      {children}
    </AppShell>
  );
}
