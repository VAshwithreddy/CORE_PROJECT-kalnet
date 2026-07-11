"use client";

import { EmployeeShell } from "@/components/employee-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";

// Mock data
const metrics = [
  { label: "Active Assignments", value: 3, change: +1, trend: "up" as const, changePeriod: "vs yesterday" },
  { label: "Waiting on Others", value: 1, change: -2, trend: "down" as const, changePeriod: "vs last week" },
  { label: "Completed This Week", value: 12, change: +4, trend: "up" as const, changePeriod: "vs last week" },
  { label: "Upcoming Deadlines", value: 2 },
];

const assignments = [
  { id: "A-1023", title: "Update employee onboarding docs", status: "in-progress" as BadgeStatus, priority: "High", due: "Today" },
  { id: "A-1025", title: "Review Q3 marketing budget", status: "waiting" as BadgeStatus, priority: "Medium", due: "Tomorrow" },
  { id: "A-1029", title: "Fix login button styling", status: "blocked" as BadgeStatus, priority: "High", due: "In 2 days" },
  { id: "A-1031", title: "Draft weekly update", status: "new" as BadgeStatus, priority: "Low", due: "Next week" },
];

const columns: DataTableColumn<typeof assignments[0]>[] = [
  { key: "id", header: "ID", sortable: true },
  { key: "title", header: "Title", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" />
  },
  { key: "priority", header: "Priority", sortable: true },
  { key: "due", header: "Due Date", sortable: true },
];

export default function EmployeeHomePage() {
  return (
    <EmployeeShell activePath="/employee/home">
      <PageHeader
        title="Welcome back, Jane!"
        description="Here is an overview of your current work."
        primaryAction={{ label: "New Request", href: "/employee/requests/new" }}
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
        title="My Assignments"
        columns={columns}
        rows={assignments}
        rowKey={(row) => row.id}
        rowActions={(row) => [
          { label: "View Details", onClick: () => console.log("view", row.id) },
          { label: "Update Status", onClick: () => console.log("update", row.id) },
        ]}
      />
    </EmployeeShell>
  );
}
