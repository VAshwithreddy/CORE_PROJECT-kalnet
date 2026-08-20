"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getBlockers, getRequests } from "@/lib/api";

type TriageItem = {
  id: string;
  title: string;
  department: string;
  type: string;
  submitted: string;
  status: BadgeStatus;
  statusLabel: string;
};

const columns: DataTableColumn<TriageItem>[] = [
  { key: "id", header: "Request ID", sortable: true },
  { key: "title", header: "Subject", sortable: true, minWidth: "240px" },
  { key: "department", header: "Target Dept", sortable: true },
  { key: "type", header: "Type", sortable: true },
  { key: "submitted", header: "Submitted", sortable: true },
  { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} size="sm" label={row.statusLabel} /> },
];

function mapRequest(request: any): TriageItem {
  const status = request.status === "approved" ? "approved" : request.status === "rejected" ? "blocked" : request.status === "resolved" ? "completed" : "waiting";
  return {
    id: String(request.id),
    title: request.title || "Untitled request",
    department: request.department_name || "Unassigned",
    type: request.type || "General",
    submitted: request.created_at ? new Date(request.created_at).toLocaleDateString() : "Not recorded",
    status,
    statusLabel: request.status === "pending" ? "Pending" : request.status?.replace("_", " ") || "Pending",
  };
}

export default function WorkAdminHomePage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [blockers, setBlockers] = useState<any[]>([]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const [requestData, blockerData] = await Promise.all([
      getRequests(token).catch(() => []),
      getBlockers(token).catch(() => []),
    ]);
    setRequests(Array.isArray(requestData) ? requestData : []);
    setBlockers(Array.isArray(blockerData) ? blockerData : []);
  }, [token]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15_000);
    const refreshOnFocus = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [refresh]);

  const triageQueue = useMemo(() => requests
    .filter((request) => request.status === "pending" || request.status === "in_review")
    .map(mapRequest), [requests]);
  const unassignedCount = useMemo(() => triageQueue.filter((request) => request.department === "Unassigned").length, [triageQueue]);
  const metrics = useMemo(() => [
    { label: "Unassigned Requests", value: unassignedCount },
    { label: "Pending Requests", value: triageQueue.length },
    { label: "Open Blockers", value: blockers.length },
    { label: "Total Requests", value: requests.length },
  ], [blockers, requests, triageQueue, unassignedCount]);

  return (
    <WorkAdminShell activePath="/work-admin/home">
      <PageHeader
        title="Operations Dashboard"
        description="Monitor live work routing, intake, and escalations across the organisation."
        meta={<><span>{triageQueue.length} triage items</span><span>{blockers.length} open blockers</span><span>Live routing view</span></>}
      />
      <div className="core-grid-4" style={{ marginBottom: 32 }}>
        {metrics.map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.value} />)}
      </div>
      <DataTable
        title="Action Required: Triage Queue"
        columns={columns}
        rows={triageQueue}
        rowKey={(row) => row.id}
        rowActions={() => [{ label: "Open Intake", onClick: () => { window.location.href = "/work-admin/intake"; } }]}
        emptyState={{ title: "No requests need triage", body: "New pending requests will appear here automatically." }}
      />
    </WorkAdminShell>
  );
}
