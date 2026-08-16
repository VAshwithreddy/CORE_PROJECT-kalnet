"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmployeeShell } from "@/components/employee-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import type { BadgeStatus } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getNotifications, markNotificationsRead } from "@/lib/api";

type NotificationItem = {
  id: string;
  type: "info" | "alert" | "success" | "warning";
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
  actionRequired?: boolean;
};



function notifTypeToBadge(type: NotificationItem["type"]): BadgeStatus {
  switch (type) {
    case "alert":   return "blocked";
    case "warning": return "waiting";
    case "success": return "approved";
    default:        return "new";
  }
}

const columns: DataTableColumn<NotificationItem>[] = [
  {
    key: "type",
    header: "Urgency",
    sortable: true,
    render: (row) => <StatusBadge status={notifTypeToBadge(row.type)} size="sm" label={row.type} />,
  },
  {
    key: "title",
    header: "Notification",
    sortable: true,
    minWidth: "300px",
    render: (row) => (
      <div>
        <strong style={{ fontWeight: row.isRead ? 400 : 600 }}>{row.title}</strong>
        <div style={{ color: "var(--core-text-subtle)", fontSize: "var(--core-text-xs)", marginTop: 4 }}>
          {row.message}
        </div>
      </div>
    ),
  },
  { key: "timestamp", header: "Received", sortable: true },
];

const filterSelectStyle = { height: 36, minWidth: 132 } as const;

export default function NotificationsPage() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user && token) {
      getNotifications(token)
        .then((data) => {
          const items = Array.isArray(data) ? data : (data?.items ?? []);
          setNotifications(items.map((n: any) => ({
            id: n.id,
            type: n.severity === "critical" ? "alert" : n.severity === "warning" ? "warning" : "info",
            title: n.type ? n.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Notification",
            message: n.message,
            isRead: Boolean(n.is_read),
            timestamp: n.created_at ? new Date(n.created_at).toLocaleString() : "",
            actionUrl: n.action_url ?? undefined,
            actionRequired: Boolean(n.requires_acknowledgement) && !n.acknowledged_at,
          })));
        })
        .catch((err) => {
          console.error("Failed to load notifications:", err);
          setNotifications([]);
        });
    }
  }, [user, token]);

  const handleMarkAsRead = (selectedKeys: string[]) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (selectedKeys.includes(n.id) ? { ...n, isRead: true } : n))
    );
    setNotice(`${selectedKeys.length} notification(s) marked as read.`);
    setTimeout(() => setNotice(""), 4000);
    // Persist to backend (best-effort)
    if (token) markNotificationsRead(selectedKeys, token).catch(() => null);
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setNotice("All notifications marked as read.");
    setTimeout(() => setNotice(""), 4000);
    // Persist to backend (best-effort)
    if (token && unreadIds.length) markNotificationsRead(unreadIds, token).catch(() => null);
  };

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    if (filter === "action") return notifications.filter((n) => n.actionRequired);
    return notifications;
  }, [notifications, filter]);

  const metrics = useMemo(
    () => [
      {
        label: "Unread",
        value: notifications.filter((n) => !n.isRead).length,
      },
      {
        label: "Action Required",
        value: notifications.filter((n) => n.actionRequired).length,
      },
      {
        label: "Total This Week",
        value: notifications.length,
      },
    ],
    [notifications]
  );

  if (!mounted) {
    return (
      <EmployeeShell activePath="/employee/notifications">
        <PageHeader
          title="Notifications"
          description="Stay updated on important alerts, reminders, and assignment activity."
          breadcrumbs={[
            { label: "Employee", href: "/employee/home" },
            { label: "Notifications" },
          ]}
        />
        <div style={{ padding: 40, textAlign: "center", color: "var(--core-text-subtle)" }}>
          Loading notifications...
        </div>
      </EmployeeShell>
    );
  }

  return (
    <EmployeeShell activePath="/employee/notifications">
      <PageHeader
        title="Notifications"
        description="Stay updated on important alerts, reminders, and assignment activity."
        breadcrumbs={[
          { label: "Employee", href: "/employee/home" },
          { label: "Notifications" },
        ]}
        primaryAction={{
          label: "Mark All as Read",
          variant: "secondary",
          onClick: handleMarkAllAsRead,
        }}
        secondaryActions={[
          {
            label: "Clear Filter",
            variant: "ghost",
            onClick: () => setFilter("all"),
          },
        ]}
      />

      {notice && (
        <div className="alert-strip alert-strip--info" role="status" style={{ marginBottom: 24 }}>
          <span>{notice}</span>
        </div>
      )}

      <div className="core-grid" style={{ marginBottom: 24 }}>
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <DataTable
        title="Inbox"
        columns={columns}
        rows={filteredNotifications}
        rowKey={(row) => row.id}
        selectable
        batchActions={[
          {
            label: "Mark as Read",
            onClick: handleMarkAsRead,
          },
        ]}
        filtersSlot={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <label className="form-label">
              View
              <select
                className="form-select"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="action">Action Required</option>
              </select>
            </label>
          </div>
        }
        rowActions={(row) => [
          {
            label: row.isRead ? "Mark Unread" : "Mark Read",
            onClick: () => {
              const next = !row.isRead;
              setNotifications((prev) =>
                prev.map((n) => (n.id === row.id ? { ...n, isRead: next } : n))
              );
              // Persist read → backend (mark-read only; unread is local)
              if (token && next) markNotificationsRead([row.id], token).catch(() => null);
            },
          },
        ]}
        emptyState={{
          title: "You're all caught up!",
          body: "No notifications match the current view.",
        }}
      />
    </EmployeeShell>
  );
}



