"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";
import { StatusBadge } from "@/components/status-badge";
import { getBlockers, subscribe, type BlockerItem } from "@/lib/mock-db";

const columns: DataTableColumn<BlockerItem>[] = [
  { key: "id", header: "Blocker ID", sortable: true },
  { key: "title", header: "Blocked Item", sortable: true, minWidth: "240px" },
  { key: "project", header: "Project", sortable: true },
  { key: "owner", header: "Owner", sortable: true },
  {
    key: "severity",
    header: "Severity",
    sortable: true,
    render: (row) => (
      <span style={{
        color: row.severity === "High" ? "var(--core-danger)" : row.severity === "Medium" ? "var(--core-warning)" : "var(--core-text-muted)",
        fontWeight: 600,
      }}>
        {row.severity}
      </span>
    ),
  },
  {
    key: "daysBlocked",
    header: "Days Blocked",
    sortable: true,
    render: (row) => (
      <span style={{ color: row.daysBlocked > 3 ? "var(--core-danger)" : "inherit" }}>
        {row.daysBlocked}d
      </span>
    ),
  },
];

export default function EscalationsPage() {
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [selected, setSelected] = useState<BlockerItem | null>(null);
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBlockers(getBlockers());
    return subscribe(() => setBlockers(getBlockers()));
  }, []);

  const highSeverity = useMemo(() => blockers.filter((b) => b.severity === "High"), [blockers]);
  const longRunning = useMemo(() => blockers.filter((b) => b.daysBlocked > 3), [blockers]);

  const metrics = useMemo(() => [
    { label: "Total Escalations", value: blockers.length },
    { label: "High Severity", value: highSeverity.length },
    { label: "Long Running (>3 days)", value: longRunning.length },
    { label: "Avg Days Blocked", value: blockers.length ? Math.round(blockers.reduce((s, b) => s + b.daysBlocked, 0) / blockers.length) : 0 },
  ], [blockers, highSeverity, longRunning]);

  if (!mounted) return null;

  return (
    <WorkAdminShell activePath="/work-admin/escalations">
      <PageHeader
        title="Escalations"
        description="Org-wide blockers requiring Work Admin intervention or executive escalation."
        breadcrumbs={[{ label: "Operations", href: "/work-admin/home" }, { label: "Escalations" }]}
      />

      {notice && (
        <div className="alert-strip alert-strip--info" style={{ marginBottom: 16 }}>
          <span>{notice}</span>
        </div>
      )}

      <div className="core-grid-4" style={{ marginBottom: 24 }}>
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      <DataTable
        title="Active Escalations"
        columns={columns}
        rows={blockers}
        rowKey={(b) => b.id}
        rowActions={(row) => [
          { label: "View Details", onClick: (r) => setSelected(r) },
          { label: "Escalate to Executive", onClick: () => setNotice(`${row.id} has been escalated to executive review.`) },
        ]}
      />

      <DetailDrawer
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        subtitle={`${selected?.project} • ${selected?.id}`}
      >
        {selected && (
          <DrawerSection title="Escalation Details">
            <DrawerField label="Project" value={selected.project} />
            <DrawerField label="Owner" value={selected.owner} />
            <DrawerField label="Severity" value={selected.severity} />
            <DrawerField label="Days Blocked" value={`${selected.daysBlocked} days`} />
            <DrawerField label="Reason" value={selected.reason} />
          </DrawerSection>
        )}
      </DetailDrawer>
    </WorkAdminShell>
  );
}
