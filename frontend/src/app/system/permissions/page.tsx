"use client";

import { SystemAdminShell } from "@/components/system-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { rolePermissions } from "@/lib/permissions";

type PermRow = { permission: string; employee: string; department: string; executive: string; workAdmin: string; systemAdmin: string };

const allPerms = ["assignments:read", "assignments:write", "projects:read", "projects:write", "people:read", "people:write", "system:admin"];

const rows: PermRow[] = allPerms.map((perm) => ({
  permission: perm,
  employee: rolePermissions.employee.includes(perm as any) ? "✅" : "—",
  department: rolePermissions.department.includes(perm as any) ? "✅" : "—",
  executive: rolePermissions.executive.includes(perm as any) ? "✅" : "—",
  workAdmin: rolePermissions["work-admin"].includes(perm as any) ? "✅" : "—",
  systemAdmin: rolePermissions["system-admin"].includes(perm as any) ? "✅" : "—",
}));

const columns: DataTableColumn<PermRow>[] = [
  { key: "permission", header: "Permission", minWidth: "200px" },
  { key: "employee", header: "Employee" },
  { key: "department", header: "Department" },
  { key: "executive", header: "Executive" },
  { key: "workAdmin", header: "Work Admin" },
  { key: "systemAdmin", header: "System Admin" },
];

export default function PermissionsPage() {
  return (
    <SystemAdminShell activePath="/system/permissions">
      <PageHeader
        title="Permissions Matrix"
        description="Live permission matrix derived from permissions.ts — showing what each role can do across the system."
      />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.permission} />
    </SystemAdminShell>
  );
}
