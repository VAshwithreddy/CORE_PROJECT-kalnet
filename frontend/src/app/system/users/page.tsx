"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { SystemAdminShell } from "@/components/system-admin-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getSystemUsers } from "@/lib/api";

export type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  departmentName: string;
  status: "approved" | "blocked";
  lastLogin: string;
};

const columns: DataTableColumn<SystemUser>[] = [
  { key: "id", header: "User ID", sortable: true },
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "System Role", sortable: true },
  { key: "departmentName", header: "Department", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => (
      <StatusBadge
        status={row.status === "approved" ? "approved" : "blocked"}
        size="sm"
        label={row.status === "approved" ? "Active" : "Suspended"}
      />
    ),
  },
  { key: "lastLogin", header: "Last Login", sortable: true },
];

export default function SystemUsersPage() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SystemUser | null>(null);
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  const fetchUsers = useCallback(() => {
    if (!token) return;
    getSystemUsers(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setUsers(list.map((u: any): SystemUser => ({
          id: u.id || "",
          name: u.username || u.name || "",
          email: u.email || "",
          role: u.role || "employee",
          roleLabel: u.roleLabel || u.title || "Member",
          departmentName: u.departmentName || u.department || "General",
          status: u.is_active !== false ? "approved" : "blocked",
          lastLogin: u.last_login || u.lastLogin || "—",
        })));
      })
      .catch(() => setUsers([]));
  }, [token]);

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.role.toLowerCase().includes(search.toLowerCase()) ||
          u.id.toLowerCase().includes(search.toLowerCase())
      ),
    [search, users]
  );

  const activeCount = users.filter((u) => u.status === "approved").length;
  const suspendedCount = users.filter((u) => u.status === "blocked").length;

  if (!mounted) return null;

  return (
    <SystemAdminShell activePath="/system/users">
      <PageHeader
        title="User Management"
        description="Manage system users, view their roles, and control access status."
        primaryAction={{ label: "Invite User", href: "#" }}
      />

      {notice && (
        <div className="alert-strip alert-strip--info" style={{ marginBottom: 16 }}>
          <span>{notice}</span>
        </div>
      )}

      <div className="core-grid-4" style={{ marginBottom: 24 }}>
        <MetricCard label="Total Users" value={users.length} />
        <MetricCard label="Active" value={activeCount} />
        <MetricCard label="Suspended" value={suspendedCount} />
        <MetricCard label="Roles Assigned" value={5} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search by name, ID, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "var(--core-radius-sm)",
            border: "1px solid var(--core-border)",
            background: "var(--core-surface)",
            fontSize: "14px",
            color: "var(--core-text)",
            width: "100%",
            maxWidth: 400,
          }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(u) => u.id}
        rowActions={(row) => [
          { label: "View Profile", onClick: (r) => setSelected(r) },
          {
            label: row.status === "approved" ? "Suspend User" : "Reactivate User",
            onClick: () => {
              const newStatus = row.status === "approved" ? "blocked" : "approved";
              setUsers(prev => prev.map(u => u.id === row.id ? { ...u, status: newStatus } : u));
              setNotice(`${row.name}'s status has been updated (Simulated, backend write requires higher admin scope).`);
              setTimeout(() => setNotice(""), 4000);
            },
            danger: row.status === "approved",
          },
        ]}
      />

      <DetailDrawer
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={`${selected?.role} • ${selected?.id}`}
      >
        {selected && (
          <DrawerSection title="User Details">
            <DrawerField label="Employee ID" value={selected.id} />
            <DrawerField label="Email" value={selected.email} />
            <DrawerField label="System Role" value={selected.role} />
            <DrawerField label="Job Title" value={selected.roleLabel} />
            <DrawerField label="Department" value={selected.departmentName} />
            <DrawerField label="Last Login" value={selected.lastLogin} />
          </DrawerSection>
        )}
      </DetailDrawer>
    </SystemAdminShell>
  );
}
