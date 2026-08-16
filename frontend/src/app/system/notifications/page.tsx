"use client";

import { SystemAdminShell } from "@/components/system-admin-shell";
import { NotificationInbox } from "@/components/notifications/notification-inbox";

export default function SystemNotificationsPage() {
  return (
    <SystemAdminShell activePath="/system/notifications">
      <NotificationInbox breadcrumbRootLabel="System Admin" breadcrumbRootHref="/system/users" />
    </SystemAdminShell>
  );
}
