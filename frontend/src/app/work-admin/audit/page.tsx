"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getAuditEvents } from "@/lib/api";

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  outcome: BadgeStatus;
  outcomeLabel: string;
};

const columns: DataTableColumn<AuditEvent>[] = [
  { key: "id", header: "Event ID", sortable: true },
  { key: "timestamp", header: "Timestamp", sortable: true },
  { key: "actor", header: "Actor", sortable: true },
  { key: "action", header: "Action", sortable: true },
  { key: "target", header: "Target", sortable: true, minWidth: "200px" },
  {
    key: "outcome",
    header: "Outcome",
    sortable: true,
    render: (row) => <StatusBadge status={row.outcome} size="sm" label={row.outcomeLabel} />,
  },
];

export default function AuditPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getAuditEvents(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setEvents(list.map((e: any): AuditEvent => ({
          id: e.id || "",
          timestamp: e.timestamp || e.created_at || "",
          actor: e.actor || "System",
          action: e.action || "",
          target: e.target || e.details || "—",
          outcome: e.outcome === "success" ? "approved" : "rejected",
          outcomeLabel: e.outcome === "success" ? "Success" : "Unknown",
        })));
        setError(null);
      })
      .catch((err) => {
        setEvents([]);
        setError(err instanceof Error ? err.message : "Unable to load audit events.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    setMounted(true);
    fetchEvents();
  }, [fetchEvents]);

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          e.actor.toLowerCase().includes(search.toLowerCase()) ||
          e.action.toLowerCase().includes(search.toLowerCase()) ||
          e.target.toLowerCase().includes(search.toLowerCase())
      ),
    [search, events]
  );

  if (!mounted) return null;

  return (
    <WorkAdminShell activePath="/work-admin/audit">
      <PageHeader
        title="Audit Log"
        description="A tamper-evident log of all significant actions taken within the Work Admin workspace."
        breadcrumbs={[{ label: "Operations", href: "/work-admin/home" }, { label: "Audit" }]}
      />

      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search actor, action, or target..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "var(--core-radius-sm)",
            border: "1px solid var(--core-border)",
            background: "var(--core-surface)",
            fontSize: "14px",
            color: "var(--core-text)",
            width: "100%",
            maxWidth: 400,
          }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        rowKey={(e) => e.id}
        emptyState={{
          title: error ? "Audit log could not be loaded" : "No audit events yet",
          body: error || "Recorded work actions will appear here.",
        }}
      />
    </WorkAdminShell>
  );
}
