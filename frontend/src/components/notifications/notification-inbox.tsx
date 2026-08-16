"use client";

/**
 * NotificationInbox
 *
 * The full notification inbox — All/Unread tabs, server-side pagination,
 * mark-read / mark-all-read / acknowledge, and an expandable AI-insight
 * panel per row. Embedded (unstyled shell-wise) inside each role's own
 * Shell via a thin app/{role}/notifications/page.tsx wrapper, the same
 * way every other role page wraps shared content — see
 * app/employee/my-work/page.tsx for the established pattern this mirrors.
 *
 * Real data only: built directly on lib/notifications-api.ts (the real
 * backend contract), never mock data.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import {
  acknowledgeNotification,
  adaptToNotificationItem,
  enrichNotification,
  fetchNotifications,
  hasRealSession,
  markAllNotificationsReadReal,
  markNotificationRead,
  type ApiNotification,
  type NotificationListResponse,
} from "@/lib/notifications-api";

type Tab = "all" | "unread";

interface NotificationInboxProps {
  /** First breadcrumb segment, e.g. "Employee", "Department". */
  breadcrumbRootLabel: string;
  /** Href for that first breadcrumb segment, e.g. "/employee/home". */
  breadcrumbRootHref: string;
}

function withoutId(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  next.delete(id);
  return next;
}

export function NotificationInbox({ breadcrumbRootLabel, breadcrumbRootHref }: NotificationInboxProps) {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // mirrors DataTable's own default page size
  const [data, setData] = useState<NotificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!hasRealSession(token)) {
      setSignedOut(true);
      setLoading(false);
      return;
    }
    setSignedOut(false);
    setLoading(true);
    try {
      const result = await fetchNotifications(token, tab === "unread", {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Couldn't load notifications. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [tab, page, pageSize, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 4000);
  };

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      await fn();
    } finally {
      setBusyIds((prev) => withoutId(prev, id));
    }
  };

  const handleMarkRead = (id: string) =>
    withBusy(id, async () => {
      try {
        await markNotificationRead(token, id);
        await load();
      } catch {
        showNotice("Couldn't mark as read — please try again.");
      }
    });

  const handleAcknowledge = (id: string) =>
    withBusy(id, async () => {
      try {
        await acknowledgeNotification(token, id);
        showNotice("Acknowledged.");
        await load();
      } catch {
        showNotice("Couldn't acknowledge — please try again.");
      }
    });

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllNotificationsReadReal(token);
      showNotice(`${result.updated_count} notification(s) marked as read.`);
      await load();
    } catch {
      showNotice("Couldn't mark all as read — please try again.");
    }
  };

  const handleEnrich = (id: string) => {
    setEnrichingIds((prev) => new Set(prev).add(id));
    enrichNotification(token, id)
      .then(() => load())
      .catch(() => showNotice("AI insight isn't available for this notification right now."))
      .finally(() => setEnrichingIds((prev) => withoutId(prev, id)));
  };

  const items = data?.items ?? [];

  const columns: DataTableColumn<ApiNotification>[] = useMemo(
    () => [
      {
        key: "severity",
        header: "Severity",
        render: (row) => {
          const item = adaptToNotificationItem(row);
          return <StatusBadge status={item.status} label={item.statusLabel} size="sm" />;
        },
      },
      {
        key: "message",
        header: "Notification",
        minWidth: "320px",
        render: (row) => {
          const item = adaptToNotificationItem(row);
          return (
            <div>
              <strong style={{ fontWeight: item.isRead ? 500 : 700 }}>{item.title}</strong>
              <div style={{ color: "var(--core-text-subtle)", fontSize: "var(--core-text-xs)", marginTop: 4 }}>
                {item.type}
                {item.actionRequired ? " · Action required" : ""}
              </div>
            </div>
          );
        },
      },
      {
        key: "created_at",
        header: "Received",
        minWidth: "140px",
        render: (row) => adaptToNotificationItem(row).date,
      },
    ],
    []
  );

  if (signedOut) {
    return (
      <>
        <PageHeader
          title="Notifications"
          description="Stay updated on important alerts, reminders, and assignment activity."
          breadcrumbs={[{ label: breadcrumbRootLabel, href: breadcrumbRootHref }, { label: "Notifications" }]}
        />
        <EmptyState
          icon="🔒"
          title="Sign in to see your notifications"
          body="Your notifications will appear here once you're signed in with a linked account."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Stay updated on important alerts, reminders, and assignment activity."
        breadcrumbs={[{ label: breadcrumbRootLabel, href: breadcrumbRootHref }, { label: "Notifications" }]}
        primaryAction={{
          label: "Mark All as Read",
          variant: "secondary",
          onClick: handleMarkAllRead,
          disabled: (data?.unread_count ?? 0) === 0,
        }}
      />

      {notice && (
        <div className="alert-strip alert-strip--info" role="status" style={{ marginBottom: 24 }}>
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="alert-strip alert-strip--danger" role="alert" style={{ marginBottom: 24 }}>
          <span>{error}</span>
          <button type="button" className="core-button core-button-ghost core-button-sm" onClick={() => load()}>
            Retry
          </button>
        </div>
      )}

      <div className="core-grid" style={{ marginBottom: 24 }}>
        <MetricCard label="Unread" value={data?.unread_count ?? 0} loading={loading && !data} />
        <MetricCard label="Action Required" value={data?.action_required_count ?? 0} loading={loading && !data} />
        <MetricCard label="Total" value={data?.total_count ?? 0} loading={loading && !data} />
      </div>

      <DataTable
        title="Inbox"
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        loading={loading}
        disableSearch
        totalCount={data?.total_count ?? 0}
        page={page}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        expandRow={(row) => (
          <NotificationDetail row={row} onEnrich={handleEnrich} enriching={enrichingIds.has(row.id)} />
        )}
        filtersSlot={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <label className="form-label">
              View
              <select
                className="form-select"
                value={tab}
                onChange={(event) => setTab(event.target.value as Tab)}
                style={{ height: 36, minWidth: 132 }}
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
              </select>
            </label>
          </div>
        }
        rowActions={(row) => {
          const actions = [];
          if (!row.is_read) {
            actions.push({
              label: busyIds.has(row.id) ? "Marking…" : "Mark Read",
              onClick: () => handleMarkRead(row.id),
            });
          }
          if (row.requires_acknowledgement && !row.acknowledged_at) {
            actions.push({
              label: busyIds.has(row.id) ? "Acknowledging…" : "Acknowledge",
              onClick: () => handleAcknowledge(row.id),
            });
          }
          return actions;
        }}
        emptyState={{
          icon: "🔔",
          title: tab === "unread" ? "No unread notifications" : "You're all caught up!",
          body:
            tab === "unread"
              ? "Nothing new to review right now."
              : "No notifications match the current view.",
        }}
      />
    </>
  );
}

function NotificationDetail({
  row,
  onEnrich,
  enriching,
}: {
  row: ApiNotification;
  onEnrich: (id: string) => void;
  enriching: boolean;
}) {
  return (
    <div style={{ padding: "12px 16px", background: "var(--core-surface-muted)" }}>
      <div style={{ fontSize: "var(--core-text-sm)", marginBottom: 10, whiteSpace: "pre-wrap" }}>
        {row.message}
      </div>

      {row.requires_acknowledgement && (
        <div style={{ fontSize: "var(--core-text-xs)", color: "var(--core-text-subtle)", marginBottom: 10 }}>
          {row.acknowledged_at ? "Acknowledged." : "This notification requires acknowledgement."}
        </div>
      )}

      {row.enrichment ? (
        <div
          style={{
            border: "1px solid var(--core-border)",
            borderRadius: "var(--core-radius-sm)",
            padding: 10,
            background: "var(--core-surface)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--core-text-muted)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            AI insight (advisory — not a substitute for the notification above)
          </div>
          {row.enrichment.ai_summary && (
            <div style={{ fontSize: "var(--core-text-sm)", marginBottom: 6 }}>{row.enrichment.ai_summary}</div>
          )}
          {row.enrichment.recommended_action && (
            <div style={{ fontSize: "var(--core-text-sm)", marginBottom: 6 }}>
              <strong>Recommended:</strong> {row.enrichment.recommended_action}
            </div>
          )}
          <div style={{ fontSize: "var(--core-text-xs)", color: "var(--core-text-subtle)" }}>
            {row.enrichment.risk_level && <span>Risk: {row.enrichment.risk_level} · </span>}
            {row.enrichment.confidence != null && (
              <span>Confidence: {Math.round(row.enrichment.confidence * 100)}% · </span>
            )}
            {row.enrichment.escalation_recommended && <span>Escalation recommended</span>}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="core-button core-button-ghost core-button-sm"
          onClick={() => onEnrich(row.id)}
          disabled={enriching}
        >
          {enriching ? "Analyzing…" : "Get AI insight"}
        </button>
      )}
    </div>
  );
}
