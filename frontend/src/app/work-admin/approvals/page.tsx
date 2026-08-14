"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getRequests } from "@/lib/api";

export type RequestItem = {
  id: string;
  title: string;
  type: string;
  submitted: string;
  status: BadgeStatus;
  statusLabel: string;
};

const columns: DataTableColumn<RequestItem>[] = [
  { key: "id", header: "Request ID", sortable: true },
  { key: "title", header: "Subject", sortable: true, minWidth: "220px" },
  { key: "type", header: "Type", sortable: true },
  { key: "submitted", header: "Submitted", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" label={row.statusLabel} />,
  },
];

export default function ApprovalsPage() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  const fetchRequests = useCallback(() => {
    if (!token) return;
    getRequests(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRequests(list.map((r: any): RequestItem => ({
          id: r.id || "",
          title: r.title || "",
          type: r.type || "IT Support",
          submitted: r.submitted || r.created_at || "",
          status: r.status || "waiting",
          statusLabel: r.statusLabel || "Pending",
        })));
      })
      .catch(() => setRequests([]));
  }, [token]);

  useEffect(() => {
    setMounted(true);
    fetchRequests();
  }, [fetchRequests]);

  const pending = useMemo(() => requests.filter((r) => r.status === "waiting"), [requests]);
  const approved = useMemo(() => requests.filter((r) => r.status === "approved"), [requests]);
  const resolved = useMemo(() => requests.filter((r) => r.status === "completed"), [requests]);

  const metrics = useMemo(() => [
    { label: "Pending Approval", value: pending.length },
    { label: "Approved This Month", value: approved.length },
    { label: "Resolved / Closed", value: resolved.length },
    { label: "Total Volume", value: requests.length },
  ], [pending, approved, resolved, requests]);

  if (!mounted) return null;

  return (
    <WorkAdminShell activePath="/work-admin/approvals">
      <PageHeader
        title="Approvals"
        description="Review pending approvals and action outstanding requests."
        breadcrumbs={[{ label: "Operations", href: "/work-admin/home" }, { label: "Approvals" }]}
      />

      {notice && (
        <div className="alert-strip alert-strip--success" style={{ marginBottom: 16 }}>
          <span>{notice}</span>
        </div>
      )}

      <div className="core-grid-4" style={{ marginBottom: 24 }}>
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      <DataTable
        title="Pending Approval Queue"
        columns={columns}
        rows={pending}
        rowKey={(r) => r.id}
        rowActions={(row) => [
          {
            label: "Approve",
            onClick: () => {
              setRequests(prev => prev.map(r => r.id === row.id ? { ...r, status: "approved", statusLabel: "Approved" } : r));
              setNotice(`Request ${row.id} approved (Simulated, backend write requires approval API).`);
              setTimeout(() => setNotice(""), 4000);
            },
          },
          {
            label: "Reject",
            onClick: () => {
              setRequests(prev => prev.map(r => r.id === row.id ? { ...r, status: "rejected", statusLabel: "Rejected" } : r));
              setNotice(`Request ${row.id} rejected (Simulated, backend write requires approval API).`);
              setTimeout(() => setNotice(""), 4000);
            },
            danger: true,
          },
        ]}
      />
    </WorkAdminShell>
  );
}
