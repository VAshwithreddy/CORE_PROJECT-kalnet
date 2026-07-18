"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";
import { StatusBadge } from "@/components/status-badge";
import { getTeamMembers, subscribe, type TeamMember } from "@/lib/mock-db";
import { DEMO_USERS } from "@/lib/mock-session";

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
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<DeptHeadRow | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMembers(getTeamMembers());
    return subscribe(() => setMembers(getTeamMembers()));
  }, []);

  const deptHeads: DeptHeadRow[] = useMemo(() => {
    return DEMO_USERS
      .filter((u) => u.role === "department")
      .map((u) => {
        const teamSize = members.filter((m) => m.departmentId === u.departmentId || !m.departmentId).length;
        return {
          id: u.id,
          name: u.name,
          department: u.departmentName,
          roleLabel: u.roleLabel,
          teamSize,
          activeProjects: 0,
          loadBand: "healthy",
        };
      });
  }, [members]);

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
