"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";
import { useAuth } from "@/lib/auth";
import { getSystemUsers, getPeople } from "@/lib/api";

interface DeptHeadRow {
  id: string;
  name: string;
  department: string;
  roleLabel: string;
  teamSize: number;
  activeProjects: number;
  loadBand: string;
}

const columns: DataTableColumn<DeptHeadRow>[] = [
  { key: "id", header: "ID", sortable: true },
  { key: "name", header: "Name", sortable: true },
  { key: "department", header: "Department", sortable: true },
  { key: "roleLabel", header: "Title", sortable: true },
  { key: "teamSize", header: "Team Size", sortable: true },
];

export default function DepartmentHeadsPage() {
  const { token } = useAuth();
  const [deptHeads, setDeptHeads] = useState<DeptHeadRow[]>([]);
  const [selected, setSelected] = useState<DeptHeadRow | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [users, people] = await Promise.all([
        getSystemUsers(token).catch(() => []),
        getPeople(token).catch(() => [])
      ]);
      
      const heads = (Array.isArray(users) ? users : []).filter((u: any) => u.role === "department");
      const allPeople = Array.isArray(people) ? people : [];
      
      setDeptHeads(heads.map((u: any): DeptHeadRow => {
        // Count how many people belong to this department
        const teamSize = allPeople.filter((p: any) => p.departmentId === u.departmentId || p.departmentName === u.departmentName).length;
        
        return {
          id: u.id || "",
          name: u.username || u.name || "",
          department: u.departmentName || u.department || "",
          roleLabel: u.roleLabel || u.title || "Department Head",
          teamSize,
          activeProjects: 0,
          loadBand: "healthy",
        };
      }));
    } catch (err) {
      console.error(err);
      setDeptHeads([]);
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
        columns={columns}
        rows={deptHeads}
        rowKey={(r) => r.id}
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
            <DrawerField label="Team Size" value={selected.teamSize.toString()} />
          </DrawerSection>
        )}
      </DetailDrawer>
    </WorkAdminShell>
  );
}
