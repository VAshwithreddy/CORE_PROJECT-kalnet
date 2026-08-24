"use client";

import { useEffect, useState } from "react";
import { SystemAdminShell } from "@/components/system-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { getSystemRoles } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type RoleRow = {
  id: string;
  name: string;
  system_slug: string;
  description: string;
  members: number;
  permissions: number;
};

const columns: DataTableColumn<RoleRow>[] = [
  { key: "name", header: "Role Name", sortable: true },
  { key: "system_slug", header: "System Slug", sortable: true },
  { key: "description", header: "Description", minWidth: "280px" },
  { key: "members", header: "Members", sortable: true },
  { key: "permissions", header: "Permissions", sortable: true },
];

export default function RolesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      try {
        setLoading(true);
        const data = await getSystemRoles(token ?? undefined);
        const apiRoles: RoleRow[] = (Array.isArray(data) ? data : []).map(
          (r: any) => ({
            id: r.id,
            name: r.name,
            system_slug: r.system_slug,
            description: r.description,
            members: r.members ?? 0,
            permissions: Array.isArray(r.permissions) ? r.permissions.length : 0,
          })
        );
        setRows(apiRoles);
      } catch (err: any) {
        setError(err.message || "Failed to load roles");
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, [token]);

  return (
    <SystemAdminShell activePath="/system/roles">
      <PageHeader
        title="Roles"
        description="System-defined roles that control workspace access and capabilities."
      />
      {loading && (
        <p style={{ color: "#64748b", fontSize: 14, padding: "16px 0" }}>
          Loading roles…
        </p>
      )}
      {error && (
        <p style={{ color: "#dc2626", fontSize: 14, padding: "16px 0" }}>
          {error}
        </p>
      )}
      {!loading && !error && (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      )}
    </SystemAdminShell>
  );
}
