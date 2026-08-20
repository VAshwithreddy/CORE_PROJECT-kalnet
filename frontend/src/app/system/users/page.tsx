"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { SystemAdminShell } from "@/components/system-admin-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";
import { StatusBadge } from "@/components/status-badge";
import { SelectInput, TextInput } from "@/components/form-controls";
import { useAuth } from "@/lib/auth";
import { createPerson, getDepartments, getPeople, getSystemUsers, updatePersonOrganization } from "@/lib/api";

export type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  departmentId: string;
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
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [organizationRole, setOrganizationRole] = useState("employee");
  const [organizationDepartment, setOrganizationDepartment] = useState("");
  const [organizationManager, setOrganizationManager] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTitle, setInviteTitle] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteDepartment, setInviteDepartment] = useState("");
  const [inviteManager, setInviteManager] = useState("");

  const fetchUsers = useCallback(() => {
    if (!token) return;
    Promise.all([getSystemUsers(token), getPeople(token), getDepartments(token)])
      .then(([systemData, peopleData, departmentData]) => {
        const peopleById = new Map((Array.isArray(peopleData) ? peopleData : []).map((person: any) => [person.id, person]));
        const list = Array.isArray(systemData) ? systemData : [];
        setUsers(list.map((u: any): SystemUser => {
          const person: any = peopleById.get(u.id) || {};
          return {
          id: u.id || "",
          name: person.full_name || u.username || u.name || "",
          email: u.email || "",
          role: person.role || "employee",
          roleLabel: person.job_title || "Member",
          departmentId: person.department_id || "",
          departmentName: person.department_name || "Unassigned",
          status: u.is_active !== false ? "approved" : "blocked",
          lastLogin: u.last_login || u.lastLogin || "—",
          };
        }));
        setDepartments((Array.isArray(departmentData) ? departmentData : []).map((department: any) => ({ id: department.id, name: department.name })));
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
  const assignedRoleCount = new Set(users.map((u) => u.role).filter(Boolean)).size;

  const openOrganizationEditor = (person: SystemUser) => {
    setSelected(person);
    setOrganizationRole(person.role);
    setOrganizationDepartment(person.departmentId);
    setOrganizationManager("");
  };

  const saveOrganization = async () => {
    if (!selected || !organizationDepartment) {
      setNotice("Choose a department before saving.");
      return;
    }
    try {
      await updatePersonOrganization(selected.id, {
        role: organizationRole,
        department_id: organizationDepartment,
        manager_id: organizationRole === "department_head" ? null : organizationManager || null,
      }, token || undefined);
      setNotice(`${selected.name}'s organization assignment was saved.`);
      setSelected(null);
      fetchUsers();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save the organization assignment.");
    }
  };

  const inviteUser = async () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !inviteDepartment) {
      setNotice("Name, company email, and department are required.");
      return;
    }
    try {
      const created = await createPerson({
        full_name: inviteName,
        email: inviteEmail,
        job_title: inviteTitle || undefined,
        role: inviteRole,
        department_id: inviteDepartment,
        manager_id: inviteRole === "department_head" ? undefined : inviteManager || undefined,
      }, token || undefined);
      setNotice(`${created.full_name} was added and can sign in immediately.`);
      setIsInviting(false);
      setInviteName("");
      setInviteEmail("");
      setInviteTitle("");
      setInviteRole("employee");
      setInviteDepartment("");
      setInviteManager("");
      fetchUsers();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to add this employee.");
    }
  };

  if (!mounted) return null;

  return (
    <SystemAdminShell activePath="/system/users">
      <PageHeader
        title="User Management"
        description="Manage system users, view their roles, and control access status."
        primaryAction={{ label: "Invite User", onClick: () => setIsInviting(true) }}
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
        <MetricCard label="Roles Assigned" value={assignedRoleCount} />
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
          { label: "Manage Organization", onClick: (r) => openOrganizationEditor(r) },
          {
            label: "View Profile",
            onClick: (r) => openOrganizationEditor(r),
          },
        ]}
      />

      <DetailDrawer
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={`${selected?.role} • ${selected?.id}`}
        footerRight={
          <>
            <button type="button" className="core-button" onClick={() => setSelected(null)}>Cancel</button>
            <button type="button" className="core-button core-button-primary" onClick={() => void saveOrganization()}>Save Organization Assignment</button>
          </>
        }
      >
        {selected && (
          <>
          <DrawerSection title="User Details">
            <DrawerField label="Employee ID" value={selected.id} />
            <DrawerField label="Email" value={selected.email} />
            <DrawerField label="System Role" value={selected.role} />
            <DrawerField label="Job Title" value={selected.roleLabel} />
            <DrawerField label="Department" value={selected.departmentName} />
            <DrawerField label="Last Login" value={selected.lastLogin} />
          </DrawerSection>
          <DrawerSection title="Organization Assignment">
            <SelectInput
              label="System Role"
              value={organizationRole}
              onChange={(event) => setOrganizationRole(event.target.value)}
              options={[
                { value: "employee", label: "Employee" },
                { value: "manager", label: "Manager" },
                { value: "team_leader", label: "Team Leader" },
                { value: "department_head", label: "Department Head" },
              ]}
            />
            <div style={{ marginTop: 16 }}>
              <SelectInput
                label="Department"
                value={organizationDepartment}
                onChange={(event) => setOrganizationDepartment(event.target.value)}
                options={[{ value: "", label: "Select a department...", disabled: true }, ...departments.map((department) => ({ value: department.id, label: department.name }))]}
                required
              />
            </div>
            {organizationRole !== "department_head" && (
              <div style={{ marginTop: 16 }}>
                <SelectInput
                  label="Reports To"
                  value={organizationManager}
                  onChange={(event) => setOrganizationManager(event.target.value)}
                  options={[{ value: "", label: "No manager assigned" }, ...users.filter((person) => person.id !== selected.id && person.departmentId === organizationDepartment && ["department_head", "manager", "team_leader"].includes(person.role)).map((person) => ({ value: person.id, label: `${person.name} (${person.role.replace("_", " ")})` }))]}
                />
              </div>
            )}
            {organizationRole === "department_head" && <p className="form-helper">Saving appoints this employee as the head of the selected department.</p>}
          </DrawerSection>
          </>
        )}
      </DetailDrawer>

      <DetailDrawer
        isOpen={isInviting}
        onClose={() => setIsInviting(false)}
        title="Invite User"
        subtitle="Create an employee record and assign their organization access."
        footerRight={
          <>
            <button type="button" className="core-button" onClick={() => setIsInviting(false)}>Cancel</button>
            <button type="button" className="core-button core-button-primary" onClick={() => void inviteUser()}>Create User</button>
          </>
        }
      >
        <DrawerSection title="Employee Details">
          <TextInput label="Full Name" value={inviteName} onChange={(event) => setInviteName(event.target.value)} required />
          <div style={{ marginTop: 16 }}>
            <TextInput label="Company Email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required />
          </div>
          <div style={{ marginTop: 16 }}>
            <TextInput label="Job Title" value={inviteTitle} onChange={(event) => setInviteTitle(event.target.value)} placeholder="e.g. Software Engineer" />
          </div>
        </DrawerSection>
        <DrawerSection title="Organization Access">
          <SelectInput
            label="System Role"
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value)}
            options={[
              { value: "employee", label: "Employee" },
              { value: "manager", label: "Manager" },
              { value: "team_leader", label: "Team Leader" },
              { value: "department_head", label: "Department Head" },
            ]}
          />
          <div style={{ marginTop: 16 }}>
            <SelectInput
              label="Department"
              value={inviteDepartment}
              onChange={(event) => setInviteDepartment(event.target.value)}
              options={[{ value: "", label: "Select a department...", disabled: true }, ...departments.map((department) => ({ value: department.id, label: department.name }))]}
              required
            />
          </div>
          {inviteRole !== "department_head" && (
            <div style={{ marginTop: 16 }}>
              <SelectInput
                label="Reports To"
                value={inviteManager}
                onChange={(event) => setInviteManager(event.target.value)}
                options={[{ value: "", label: "No manager assigned" }, ...users.filter((person) => person.departmentId === inviteDepartment && ["department_head", "manager", "team_leader"].includes(person.role)).map((person) => ({ value: person.id, label: `${person.name} (${person.role.replace("_", " ")})` }))]}
              />
            </div>
          )}
        </DrawerSection>
      </DetailDrawer>
    </SystemAdminShell>
  );
}
