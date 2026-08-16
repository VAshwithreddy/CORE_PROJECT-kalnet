"use client";

import { WorkAdminShell } from "@/components/work-admin-shell";
import { NotificationInbox } from "@/components/notifications/notification-inbox";

export default function WorkAdminNotificationsPage() {
  return (
    <WorkAdminShell activePath="/work-admin/notifications">
      <NotificationInbox breadcrumbRootLabel="Work Admin" breadcrumbRootHref="/work-admin/home" />
    </WorkAdminShell>
  );
}
