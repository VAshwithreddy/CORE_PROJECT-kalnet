"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { SystemAdminShell } from "@/components/system-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getAuditEvents } from "@/lib/api";

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  outcome: BadgeStatus;
  outcomeLabel: string;
};

const columns: DataTableColumn<AuditEvent>[] = [
  { key: "id", header: "Event ID", sortable: true },
  { key: "timestamp", header: "Timestamp", sortable: true },
  { key: "actor", header: "Actor", sortable: true },
  { key: "role", header: "Role", sortable: true },
  { key: "action", header: "Action", sortable: true },
  { key: "target", header: "Target", minWidth: "200px" },
  {
    key: "outcome",
    header: "Outcome",
    sortable: true,
    render: (row) => <StatusBadge status={row.outcome} size="sm" label={row.outcomeLabel} />,
  },
];

export default function SystemAuditPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
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
        setEvents(list.map((e: any) => ({
          id: e.id || "",
          timestamp: e.timestamp || e.created_at || "",
          actor: e.actor || "System",
          role: e.role || "system",
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
      events.filter((e) => {
        const matchesSearch =
          e.actor.toLowerCase().includes(search.toLowerCase()) ||
          e.action.toLowerCase().includes(search.toLowerCase()) ||
          e.target.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || e.role === roleFilter;
        return matchesSearch && matchesRole;
      }),
    [search, roleFilter, events]
  );

  if (!mounted) return null;

  return (
    <SystemAdminShell activePath="/system/audit">
      <PageHeader
        title="System Audit Log"
        description="Immutable record of all security-relevant events across all roles and workspaces."
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search actor, action or target..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "8px 14px",
            borderRadius: "var(--core-radius-sm)",
            border: "1px solid var(--core-border)",
            background: "var(--core-surface)",
            fontSize: "14px",
            color: "var(--core-text)",
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "var(--core-radius-sm)",
            border: "1px solid var(--core-border)",
            background: "var(--core-surface)",
            color: "var(--core-text)",
            fontSize: "14px",
          }}
        >
          <option value="all">All Roles</option>
          <option value="employee">Employee</option>
          <option value="department_head">Department Head</option>
          <option value="executive">Executive</option>
          <option value="work_admin">Work Admin</option>
          <option value="system_admin">System Admin</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        rowKey={(e) => e.id}
        emptyState={{
          title: error ? "Audit log could not be loaded" : "No audit events yet",
          body: error || "Recorded actions will appear here.",
        }}
      />
    </SystemAdminShell>
  );
}
