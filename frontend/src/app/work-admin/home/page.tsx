"use client";

import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";

const metrics = [
  { label: "Unassigned Tickets", value: 24, change: +8, trend: "up" as const, changePeriod: "vs yesterday" },
  { label: "SLA Breaches", value: 2, change: -1, trend: "down" as const, changePeriod: "vs last week" },
  { label: "Avg Resolution Time", value: "2.4 days", change: -0.3, trend: "down" as const, changePeriod: "vs last month" },
  { label: "Total Volume", value: 1450 },
];

const triageQueue = [
  { id: "REQ-9012", title: "Access to staging DB", department: "Engineering", priority: "High", age: "2 hours" },
  { id: "REQ-9014", title: "New vendor contract review", department: "Legal", priority: "Medium", age: "5 hours" },
  { id: "REQ-9018", title: "Office supply restock", department: "Facilities", priority: "Low", age: "1 day" },
];

const columns: DataTableColumn<typeof triageQueue[0]>[] = [
  { key: "id", header: "Request ID", sortable: true },
  { key: "title", header: "Subject", sortable: true },
  { key: "department", header: "Target Dept", sortable: true },
  { key: "priority", header: "Priority", sortable: true },
  { key: "age", header: "Age", sortable: true },
];

export default function WorkAdminHomePage() {
  return (
    <WorkAdminShell activePath="/work-admin/home">
      <PageHeader
        title="Operations Dashboard"
        description="Monitor system-wide work routing and SLA compliance."
      />

      <div className="core-grid-4" style={{ marginBottom: 32 }}>
        {metrics.map((m) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            change={m.change}
            trend={m.trend}
            changePeriod={m.changePeriod}
          />
        ))}
      </div>

      <DataTable
        title="Action Required: Triage Queue"
        columns={columns}
        rows={triageQueue}
        rowKey={(row) => row.id}
        rowActions={(row) => [
          { label: "Assign Route", onClick: () => console.log("route", row.id) },
          { label: "Reject", onClick: () => console.log("reject", row.id), danger: true },
        ]}
      />
    </WorkAdminShell>
  );
}
