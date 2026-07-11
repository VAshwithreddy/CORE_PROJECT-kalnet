"use client";

import { ExecutiveShell } from "@/components/executive-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";

const metrics = [
  { label: "Company OKR Progress", value: "68%", change: +12, trend: "up" as const, changePeriod: "vs last month" },
  { label: "Total Headcount", value: "1,240", change: +45, trend: "up" as const, changePeriod: "vs Q1" },
  { label: "Critical Blockers", value: 3, change: -2, trend: "down" as const, changePeriod: "vs last week" },
  { label: "Budget Variance", value: "-2%", change: +1, trend: "down" as const, changePeriod: "vs plan" },
];

const initiatives = [
  { name: "Expand to EMEA", sponsor: "Michael K.", progress: "45%", status: "On Track" },
  { name: "AI Integration", sponsor: "Sarah W.", progress: "20%", status: "At Risk" },
  { name: "Cost Reduction", sponsor: "David L.", progress: "85%", status: "On Track" },
];

const columns: DataTableColumn<typeof initiatives[0]>[] = [
  { key: "name", header: "Initiative", sortable: true },
  { key: "sponsor", header: "Exec Sponsor", sortable: true },
  { key: "progress", header: "Progress", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => (
      <span style={{ color: row.status === "At Risk" ? "var(--core-danger)" : "var(--core-success)" }}>
        {row.status === "At Risk" ? "🚨 " : "✅ "}
        {row.status}
      </span>
    )
  },
];

export default function ExecutiveOverviewPage() {
  return (
    <ExecutiveShell activePath="/executive/overview">
      <PageHeader
        title="Company Overview"
        description="High-level metrics and strategic initiatives."
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
        title="Strategic Initiatives"
        columns={columns}
        rows={initiatives}
        rowKey={(row) => row.name}
      />
    </ExecutiveShell>
  );
}
