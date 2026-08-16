"use client";

import { ExecutiveShell } from "@/components/executive-shell";
import { NotificationInbox } from "@/components/notifications/notification-inbox";

export default function ExecutiveNotificationsPage() {
  return (
    <ExecutiveShell activePath="/executive/notifications">
      <NotificationInbox breadcrumbRootLabel="Executive" breadcrumbRootHref="/executive/overview" />
    </ExecutiveShell>
  );
}
