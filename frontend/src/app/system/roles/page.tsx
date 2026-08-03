"use client";

import { SystemAdminShell } from "@/components/system-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";

const ROLES = [
  { id: "role-emp", name: "Employee", slug: "employee", description: "Normal working user. Read assignments and projects.", members: 5, permissions: 2 },
  { id: "role-dept", name: "Department Head", slug: "department", description: "Manages team, projects, and assignments within their department.", members: 2, permissions: 4 },
  { id: "role-exec", name: "Executive", slug: "executive", description: "High-level monitoring and portfolio oversight.", members: 1, permissions: 3 },
  { id: "role-wa", name: "Work Admin", slug: "work-admin", description: "Operations and work routing across departments.", members: 1, permissions: 4 },
  { id: "role-sa", name: "System Admin", slug: "system-admin", description: "Full system access including user and permission management.", members: 1, permissions: 7 },
];

const columns: DataTableColumn<typeof ROLES[0]>[] = [
  { key: "name", header: "Role Name", sortable: true },
  { key: "slug", header: "System Slug", sortable: true },
  { key: "description", header: "Description", minWidth: "280px" },
  { key: "members", header: "Members", sortable: true },
  { key: "permissions", header: "Permissions", sortable: true },
];

export default function RolesPage() {
  return (
    <SystemAdminShell activePath="/system/roles">
      <PageHeader
        title="Roles"
        description="System-defined roles that control workspace access and capabilities."
      />
      <DataTable columns={columns} rows={ROLES} rowKey={(r) => r.id} />
    </SystemAdminShell>
  );
}
