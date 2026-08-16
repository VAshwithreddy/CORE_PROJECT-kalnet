"use client";

import { DepartmentShell } from "@/components/department-shell";
import { NotificationInbox } from "@/components/notifications/notification-inbox";

export default function DepartmentNotificationsPage() {
  return (
    <DepartmentShell activePath="/department/notifications">
      <NotificationInbox breadcrumbRootLabel="Department" breadcrumbRootHref="/department/home" />
    </DepartmentShell>
  );
}
