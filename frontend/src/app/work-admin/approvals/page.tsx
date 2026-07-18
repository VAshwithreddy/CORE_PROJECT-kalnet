"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { getRequests, subscribe, type RequestItem, approveRequest, rejectRequest, createAuditEvent } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/mock-session";

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
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRequests(getRequests());
    return subscribe(() => setRequests(getRequests()));
  }, []);

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
              approveRequest(row.id);
              createAuditEvent({
                actor: getCurrentUser().name,
                role: getCurrentUser().role,
                action: "Approved Request",
                target: row.id,
                outcome: "approved",
                outcomeLabel: "Approved",
              });
              setNotice(`Request ${row.id} approved.`);
              setTimeout(() => setNotice(""), 3000);
            },
          },
          {
            label: "Reject",
            onClick: () => {
              rejectRequest(row.id);
              createAuditEvent({
                actor: getCurrentUser().name,
                role: getCurrentUser().role,
                action: "Rejected Request",
                target: row.id,
                outcome: "rejected",
                outcomeLabel: "Rejected",
              });
              setNotice(`Request ${row.id} rejected.`);
              setTimeout(() => setNotice(""), 3000);
            },
            danger: true,
          },
        ]}
      />
    </WorkAdminShell>
  );
}
