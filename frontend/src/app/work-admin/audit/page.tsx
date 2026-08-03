"use client";

import { useMemo, useState } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { useEffect } from "react";
import { getAuditEvents, subscribe, type AuditEvent } from "@/lib/mock-db";

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
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEvents(getAuditEvents());
    return subscribe(() => setEvents(getAuditEvents()));
  }, []);

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

      <DataTable columns={columns} rows={filtered} rowKey={(e) => e.id} />
    </WorkAdminShell>
  );
}
