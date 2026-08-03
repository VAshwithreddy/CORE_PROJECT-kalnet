"use client";

import { useState } from "react";
import { SystemAdminShell } from "@/components/system-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";

const SERVICE_ACCOUNTS = [
  { id: "svc-ci", name: "core-ci-runner", purpose: "CI/CD Pipeline", scope: "assignments:read, projects:read", status: "active" as const, lastUsed: "2 mins ago" },
  { id: "svc-notif", name: "core-notification-svc", purpose: "Notification Delivery", scope: "assignments:read", status: "active" as const, lastUsed: "5 mins ago" },
  { id: "svc-report", name: "core-report-export", purpose: "Automated Reports", scope: "projects:read, people:read", status: "active" as const, lastUsed: "1 hour ago" },
  { id: "svc-dep", name: "core-legacy-sync", purpose: "Legacy Data Sync", scope: "assignments:read", status: "inactive" as const, lastUsed: "3 months ago" },
];

const columns: DataTableColumn<typeof SERVICE_ACCOUNTS[0]>[] = [
  { key: "id", header: "Account ID", sortable: true },
  { key: "name", header: "Name", sortable: true },
  { key: "purpose", header: "Purpose", sortable: true },
  { key: "scope", header: "Scope", minWidth: "240px" },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => (
      <StatusBadge
        status={row.status === "active" ? "approved" : "archived"}
        size="sm"
        label={row.status === "active" ? "Active" : "Inactive"}
      />
    ),
  },
  { key: "lastUsed", header: "Last Used", sortable: true },
];

export default function ServiceAccountsPage() {
  const [notice, setNotice] = useState("");

  return (
    <SystemAdminShell activePath="/system/service-accounts">
      <PageHeader
        title="Service Accounts"
        description="Machine identities used for automated pipelines and integrations."
        primaryAction={{ label: "Create Account", href: "#" }}
      />
      {notice && (
        <div className="alert-strip alert-strip--info" style={{ marginBottom: 16 }}>
          <span>{notice}</span>
        </div>
      )}
      <DataTable
        columns={columns}
        rows={SERVICE_ACCOUNTS}
        rowKey={(r) => r.id}
        rowActions={(row) => [
          { label: "Rotate Key", onClick: () => setNotice(`Key rotation initiated for ${row.name}.`) },
          { label: "Revoke", onClick: () => setNotice(`${row.name} would be revoked. (Demo mode.)`), danger: true },
        ]}
      />
    </SystemAdminShell>
  );
}
