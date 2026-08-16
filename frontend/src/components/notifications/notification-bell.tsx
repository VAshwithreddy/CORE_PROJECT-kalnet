"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/core-icons";
import { SkeletonLine } from "@/components/loading-skeleton";
import { useAuth } from "@/lib/auth";
import { ROLE_NOTIFICATIONS_PATHS } from "@/lib/roles";
import {
  adaptToNotificationItem,
  markAllNotificationsReadReal,
  markNotificationRead,
  type ApiNotification,
} from "@/lib/notifications-api";
import { useUnreadNotifications } from "./use-unread-notifications";

const SEVERITY_DOT_COLOR: Record<ApiNotification["severity"], string> = {
  critical: "var(--core-danger)",
  warning: "var(--core-warning)",
  info: "var(--core-info)",
};

function PreviewRow({
  notification,
  onOpen,
}: {
  notification: ApiNotification;
  onOpen: (notification: ApiNotification) => void;
}) {
  const item = adaptToNotificationItem(notification);
  return (
    <button
      type="button"
      className="notification-bell__item"
      onClick={() => onOpen(notification)}
    >
      <span
        className="notification-bell__item-dot"
        style={{ background: SEVERITY_DOT_COLOR[notification.severity] }}
        aria-hidden="true"
      />
      <span className="notification-bell__item-body">
        <span className="notification-bell__item-title" style={{ fontWeight: item.isRead ? 500 : 700 }}>
          {item.title}
        </span>
        <span className="notification-bell__item-meta">
          {item.type} &middot; {item.date}
          {item.actionRequired ? " · Action required" : ""}
        </span>
      </span>
      {!item.isRead && <span className="notification-bell__item-unread" aria-label="Unread" />}
    </button>
  );
}

export function NotificationBell() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { status, unreadCount, preview, error, refresh } = useUnreadNotifications(5);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open, refresh]);

  // Don't render on unauthenticated pages (login, etc.) — AppShell can
  // render a "Guest User" fallback before auth resolves, so gate on a
  // real signed-in user rather than always showing.
  if (authLoading || !user || !token) return null;

  const notificationsHref = ROLE_NOTIFICATIONS_PATHS[user.role] || "/employee/notifications";

  const handleOpenNotification = async (notification: ApiNotification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(token, notification.id);
        refresh();
      } catch {
        // Best-effort — still navigate even if the read-mark fails.
      }
    }
    setOpen(false);
    if (notification.action_url) {
      router.push(notification.action_url);
    } else {
      router.push(notificationsHref);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsReadReal(token);
      refresh();
    } catch {
      // Best-effort — dropdown stays open so the user can retry.
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="overflow-menu notification-bell" ref={containerRef}>
      <button
        type="button"
        className="core-button core-button-ghost core-button-icon"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 149 }} onClick={() => setOpen(false)} />
          <div className="overflow-menu__dropdown notification-bell__panel" role="menu">
            <div className="notification-bell__panel-header">
              <span>Notifications</span>
              <button
                type="button"
                className="core-button core-button-ghost core-button-sm"
                onClick={handleMarkAllRead}
                disabled={markingAll || unreadCount === 0}
              >
                Mark all as read
              </button>
            </div>

            <div className="notification-bell__panel-body">
              {status === "loading" && (
                <div style={{ padding: "12px 14px" }}>
                  <SkeletonLine width="80%" style={{ marginBottom: 8 }} />
                  <SkeletonLine width="60%" />
                </div>
              )}

              {status === "signed-out" && (
                <div className="notification-bell__empty">
                  Sign in to see your notifications.
                </div>
              )}

              {status === "error" && (
                <div className="notification-bell__empty">
                  {error || "Couldn't load notifications."}
                  <button type="button" className="core-button core-button-ghost core-button-sm" onClick={() => refresh()}>
                    Retry
                  </button>
                </div>
              )}

              {status === "ready" && preview.length === 0 && (
                <div className="notification-bell__empty">You're all caught up!</div>
              )}

              {status === "ready" &&
                preview.map((n) => (
                  <PreviewRow key={n.id} notification={n} onOpen={handleOpenNotification} />
                ))}
            </div>

            <div className="notification-bell__panel-footer">
              <a href={notificationsHref} onClick={() => setOpen(false)}>
                View all notifications
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
