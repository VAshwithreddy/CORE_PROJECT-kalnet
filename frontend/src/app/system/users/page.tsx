"use client";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { SystemAdminShell } from "@/components/system-admin-shell";

const users = [
  { id: "U-001", name: "Jane Doe", role: "Employee", status: "Active", lastLogin: "2 mins ago" },
  { id: "U-002", name: "Sarah Wong", role: "Department Head", status: "Active", lastLogin: "1 hour ago" },
  { id: "U-003", name: "Michael Kim", role: "Executive", status: "Active", lastLogin: "5 hours ago" },
  { id: "U-004", name: "Alex Johnson", role: "Work Admin", status: "Active", lastLogin: "Yesterday" },
  { id: "U-005", name: "Inactive User", role: "Employee", status: "Suspended", lastLogin: "3 months ago" },
];

const columns: DataTableColumn<typeof users[0]>[] = [
  { key: "id", header: "User ID", sortable: true },
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "System Role", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => (
      <span style={{ color: row.status === "Suspended" ? "var(--core-danger)" : "var(--core-success)" }}>
        {row.status}
      </span>
    ),
  },
  { key: "lastLogin", header: "Last Login", sortable: true },
];

export default function SystemUsersPage() {
  return (
    <SystemAdminShell activePath="/system/users">
      <PageHeader
        title="User Management"
        description="Manage system access, roles, and security policies."
        primaryAction={{ label: "Invite User", href: "/system/users/new" }}
      />

      <DataTable
        title="Directory"
        columns={columns}
        rows={users}
        rowKey={(row) => row.id}
        selectable
        batchActions={[
          { label: "Suspend Users", onClick: (keys) => console.log("suspend", keys), danger: true },
          { label: "Reset Passwords", onClick: (keys) => console.log("reset", keys) },
        ]}
        rowActions={(row) => [
          { label: "Edit Profile", onClick: () => console.log("edit", row.id) },
          { label: "View Audit Log", onClick: () => console.log("audit", row.id) },
        ]}
      />
    </SystemAdminShell>
  );
}
