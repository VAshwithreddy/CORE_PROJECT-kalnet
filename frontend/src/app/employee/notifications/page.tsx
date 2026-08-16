"use client";

import { EmployeeShell } from "@/components/employee-shell";
import { NotificationInbox } from "@/components/notifications/notification-inbox";

export default function NotificationsPage() {
  return (
    <EmployeeShell activePath="/employee/notifications">
      <NotificationInbox breadcrumbRootLabel="Employee" breadcrumbRootHref="/employee/home" />
    </EmployeeShell>
  );
}
