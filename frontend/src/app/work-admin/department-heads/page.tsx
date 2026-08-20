"use client";

import { useEffect, useState, useCallback } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";
import { useAuth } from "@/lib/auth";
import { getDepartments, getProjects } from "@/lib/api";

interface DeptHeadRow {
  id: string;
  name: string;
  department: string;
  roleLabel: string;
  email: string;
  teamSize: number;
  activeProjects: number;
}

const columns: DataTableColumn<DeptHeadRow>[] = [
  { key: "id", header: "ID", sortable: true },
  { key: "name", header: "Name", sortable: true },
  { key: "department", header: "Department", sortable: true },
  { key: "roleLabel", header: "Title", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "teamSize", header: "Team Size", sortable: true },
  { key: "activeProjects", header: "Active Projects", sortable: true },
];

export default function DepartmentHeadsPage() {
  const { token } = useAuth();
  const [deptHeads, setDeptHeads] = useState<DeptHeadRow[]>([]);
  const [selected, setSelected] = useState<DeptHeadRow | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [departments, projects] = await Promise.all([
        getDepartments(token),
        getProjects(token).catch(() => []),
      ]);

      const allDepartments = Array.isArray(departments) ? departments : [];
      const allProjects = Array.isArray(projects) ? projects : [];
      setDeptHeads(allDepartments
        .filter((department: any) => department.head_person_id && department.head_name)
        .map((department: any): DeptHeadRow => {
          const departmentId = String(department.id);
          const activeProjects = allProjects.filter((project: any) =>
            String(project.departmentId || project.department_id || "") === departmentId &&
            !["completed", "cancelled"].includes(String(project.status || "").toLowerCase()),
          ).length;
        return {
          id: String(department.head_person_id),
          name: department.head_name,
          department: department.name || "Unassigned",
          roleLabel: department.head_job_title || "Department Head",
          email: department.head_email || "—",
          teamSize: Number(department.member_count || 0),
          activeProjects,
        };
      }));
      setError(null);
    } catch (err) {
      console.error(err);
      setDeptHeads([]);
      setError(err instanceof Error ? err.message : "Unable to load department heads.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  if (!mounted) return null;

  return (
    <WorkAdminShell activePath="/work-admin/department-heads">
      <PageHeader
        title="Department Heads"
        description="View and contact all department heads in the organisation."
        breadcrumbs={[{ label: "Operations", href: "/work-admin/home" }, { label: "Department Heads" }]}
      />

      <DataTable
        title="Department heads"
        columns={columns}
        rows={deptHeads}
        loading={loading}
        rowKey={(r) => r.id}
        emptyState={{
          title: error ? "Department heads could not be loaded" : "No department heads assigned",
          body: error || "Assign a department head from System Users to display it here.",
        }}
        rowActions={(row) => [
          { label: "View Details", onClick: (r) => setSelected(r) },
        ]}
      />

      <DetailDrawer
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.department ?? ""}
      >
        {selected && (
          <DrawerSection title="Department Head Details">
            <DrawerField label="Employee ID" value={selected.id} />
            <DrawerField label="Title" value={selected.roleLabel} />
            <DrawerField label="Department" value={selected.department} />
            <DrawerField label="Email" value={selected.email} />
            <DrawerField label="Team Size" value={selected.teamSize.toString()} />
            <DrawerField label="Active Projects" value={selected.activeProjects.toString()} />
          </DrawerSection>
        )}
      </DetailDrawer>
    </WorkAdminShell>
  );
}
