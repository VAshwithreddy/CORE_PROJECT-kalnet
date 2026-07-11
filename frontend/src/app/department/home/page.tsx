"use client";

import { DepartmentShell } from "@/components/department-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";

const metrics = [
  { label: "Team Velocity", value: "85%", change: +5, trend: "up" as const, changePeriod: "vs last sprint" },
  { label: "Active Blockers", value: 2, change: -1, trend: "down" as const, changePeriod: "vs yesterday" },
  { label: "Open Roles", value: 3 },
  { label: "On Time Delivery", value: "92%", change: +2, trend: "up" as const, changePeriod: "vs Q2" },
];

const projects = [
  { id: "P-442", title: "Cloud Migration", status: "in-progress" as BadgeStatus, health: "On Track", lead: "Alex J." },
  { id: "P-443", title: "Q3 Planning", status: "blocked" as BadgeStatus, health: "At Risk", lead: "Sarah W." },
  { id: "P-445", title: "Design System 2.0", status: "completed" as BadgeStatus, health: "Delivered", lead: "Jane D." },
];

const columns: DataTableColumn<typeof projects[0]>[] = [
  { key: "id", header: "Project ID", sortable: true },
  { key: "title", header: "Name", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" />
  },
  { key: "health", header: "Health", sortable: true },
  { key: "lead", header: "Lead", sortable: true },
];

export default function DepartmentHomePage() {
  return (
    <DepartmentShell activePath="/department/home">
      <PageHeader
        title="Engineering Department"
        description="Department overview and active projects."
        primaryAction={{ label: "New Project", href: "/department/projects/new" }}
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
        title="Active Projects"
        columns={columns}
        rows={projects}
        rowKey={(row) => row.id}
        rowActions={(row) => [
          { label: "View Dashboard", onClick: () => console.log("view", row.id) },
        ]}
      />
    </DepartmentShell>
  );
}
