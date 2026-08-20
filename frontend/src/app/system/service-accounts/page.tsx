"use client";

import { useEffect, useState } from "react";
import { SystemAdminShell } from "@/components/system-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getServiceAccounts } from "@/lib/api";

type ServiceAccount = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
};

const columns: DataTableColumn<ServiceAccount>[] = [
  { key: "id", header: "Account ID", sortable: true },
  { key: "name", header: "Name", sortable: true },
  { key: "description", header: "Purpose", minWidth: "240px" },
  {
    key: "is_active",
    header: "Status",
    sortable: true,
    render: (row) => (
      <StatusBadge
        status={row.is_active ? "approved" : "archived"}
        size="sm"
        label={row.is_active ? "Active" : "Inactive"}
      />
    ),
  },
  { key: "created_at", header: "Created", sortable: true },
];

export default function ServiceAccountsPage() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<ServiceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getServiceAccounts(token)
      .then((data) => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => setError("Service accounts could not be loaded."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <SystemAdminShell activePath="/system/service-accounts">
      <PageHeader
        title="Service Accounts"
        description="Machine identities used for automated pipelines and integrations."
      />
      {error && (
        <div className="alert-strip alert-strip--error" style={{ marginBottom: 16 }}>
          <span>{error}</span>
        </div>
      )}
      <DataTable
        columns={columns}
        rows={accounts}
        loading={loading}
        rowKey={(r) => r.id}
      />
    </SystemAdminShell>
  );
}
