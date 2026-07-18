"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmployeeShell } from "@/components/employee-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getNotificationsByUser, markNotificationsRead, markAllNotificationsRead, subscribe, type NotificationItem } from "@/lib/mock-db";
import { getCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";

const columns: DataTableColumn<NotificationItem>[] = [
  {
    key: "status",
    header: "Urgency",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" label={row.statusLabel} />,
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
  { key: "type", header: "Category", sortable: true },
  { key: "date", header: "Received", sortable: true },
];

const filterSelectStyle = { height: 36, minWidth: 132 } as const;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CoreUser>(getCurrentUser());
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNotifications(getNotificationsByUser(getCurrentUser().id));

    const unsubSession = subscribeSession((user) => {
      setCurrentUser(user);
      setNotifications(getNotificationsByUser(user.id));
    });

    const unsubDb = subscribe(() => {
      setNotifications(getNotificationsByUser(getCurrentUser().id));
    });

    return () => {
      unsubSession();
      unsubDb();
    };
  }, []);

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

  const handleMarkAsRead = (selectedKeys: string[]) => {
    markNotificationsRead(selectedKeys);
    setNotice(`${selectedKeys.length} notification(s) marked as read.`);
    setTimeout(() => setNotice(""), 4000);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead();
    setNotice("All notifications marked as read.");
    setTimeout(() => setNotice(""), 4000);
  };

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
              if (row.isRead) {
                const nextNotifs = getNotificationsByUser(currentUser.id).map(n => n.id === row.id ? { ...n, isRead: false } : n);
                localStorage.setItem("core_db_notifications", JSON.stringify(nextNotifs));
                window.dispatchEvent(new Event("storage"));
              } else {
                markNotificationsRead([row.id]);
              }
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
