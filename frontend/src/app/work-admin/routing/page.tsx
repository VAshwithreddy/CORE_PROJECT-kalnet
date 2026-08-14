"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { SelectInput } from "@/components/form-controls";
import { useAuth } from "@/lib/auth";
import { getRequests } from "@/lib/api";

type RequestItem = {
  id: string;
  title: string;
  type: string;
  submitted: string;
  status: BadgeStatus;
  statusLabel: string;
  assignee: string;
  description: string;
  updated: string;
};

interface RoutingRow extends RequestItem {
  targetDept: string;
  routedTo: string;
}

function inferRouting(r: RequestItem): RoutingRow {
  const targetDept = r.type === "IT Support" || r.type === "Access" ? "IT Operations" : r.type === "Time Off" ? "People Ops" : "HR";
  const routedTo = r.assignee || targetDept;
  return { ...r, targetDept, routedTo };
}

const columns: DataTableColumn<RoutingRow>[] = [
  { key: "id", header: "Request ID", sortable: true },
  { key: "title", header: "Subject", sortable: true, minWidth: "220px" },
  { key: "type", header: "Type", sortable: true },
  { key: "targetDept", header: "Target Dept", sortable: true },
  { key: "routedTo", header: "Routed To", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" label={row.statusLabel} />,
  },
];

export default function RoutingPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [mounted, setMounted] = useState(false);

  const fetchRequests = useCallback(() => {
    if (!token) return;
    getRequests(token)
      .then((data: any) => {
        const all = Array.isArray(data) ? data : [];
        setRequests(all.map((r: any): RequestItem => ({
          id: r.id || "",
          title: r.title || r.reason || "Unknown Request",
          type: r.type || "General",
          submitted: r.submitted || r.created_at || new Date().toISOString().split("T")[0],
          status: r.status === "approved" ? "approved" : r.status === "rejected" ? "rejected" : "waiting",
          statusLabel: r.status || "Pending",
          assignee: r.assignee || "Unassigned",
          description: r.description || "No description provided",
          updated: r.updated || r.updated_at || new Date().toISOString().split("T")[0],
        })));
      })
      .catch(() => setRequests([]));
  }, [token]);

  useEffect(() => {
    setMounted(true);
    fetchRequests();
  }, [fetchRequests]);

  const rows = useMemo(() => requests.map(inferRouting), [requests]);

  const filtered = useMemo(
    () => rows.filter((r) => deptFilter === "all" || r.targetDept === deptFilter),
    [rows, deptFilter]
  );

  const metrics = useMemo(() => [
    { label: "Total Routed", value: rows.length },
    { label: "IT Operations", value: rows.filter((r) => r.targetDept === "IT Operations").length },
    { label: "People Ops", value: rows.filter((r) => r.targetDept === "People Ops").length },
    { label: "HR", value: rows.filter((r) => r.targetDept === "HR").length },
  ], [rows]);

  if (!mounted) return null;

  return (
    <WorkAdminShell activePath="/work-admin/routing">
      <PageHeader
        title="Work Routing"
        description="View how incoming requests have been routed to departments and handlers."
        breadcrumbs={[{ label: "Operations", href: "/work-admin/home" }, { label: "Routing" }]}
      />

      <div className="core-grid-4" style={{ marginBottom: 24 }}>
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <SelectInput
          label=""
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          options={[
            { value: "all", label: "All Departments" },
            { value: "IT Operations", label: "IT Operations" },
            { value: "People Ops", label: "People Ops" },
            { value: "HR", label: "HR" },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
      />
    </WorkAdminShell>
  );
}
