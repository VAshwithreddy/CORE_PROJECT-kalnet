"use client";

import { useEffect, useState, useMemo } from "react";
import { DepartmentShell } from "@/components/department-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { getProjectsByDepartment, getBlockers, getTeamMembers, resetDB, subscribe, type ProjectItem } from "@/lib/mock-db";
import { getCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";

const healthStatusMap = {
  "On Track": "approved" as BadgeStatus,
  "At Risk": "waiting" as BadgeStatus,
  "Off Track": "blocked" as BadgeStatus,
  "Delivered": "completed" as BadgeStatus,
};

const columns: DataTableColumn<ProjectItem>[] = [
  { key: "id", header: "Project ID", sortable: true },
  { key: "name", header: "Name", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" label={row.statusLabel} />
  },
  {
    key: "health",
    header: "Health",
    sortable: true,
    render: (row) => <StatusBadge status={healthStatusMap[row.health]} size="sm" label={row.health} />
  },
  { key: "owner", header: "Lead", sortable: true },
];

export default function DepartmentHomePage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [blockerCount, setBlockerCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<CoreUser>(getCurrentUser());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProjects(getProjectsByDepartment(getCurrentUser().departmentId));
    setBlockerCount(getBlockers().length); // In a real app, filter blockers by department
    setTeamCount(getTeamMembers().filter(m => !m.departmentId || m.departmentId === getCurrentUser().departmentId).length);

    const unsubSession = subscribeSession((user) => {
      setCurrentUser(user);
      setProjects(getProjectsByDepartment(user.departmentId));
      setTeamCount(getTeamMembers().filter(m => !m.departmentId || m.departmentId === user.departmentId).length);
    });

    const unsubDb = subscribe(() => {
      setProjects(getProjectsByDepartment(getCurrentUser().departmentId));
      setBlockerCount(getBlockers().length);
      setTeamCount(getTeamMembers().filter(m => !m.departmentId || m.departmentId === getCurrentUser().departmentId).length);
    });

    return () => {
      unsubSession();
      unsubDb();
    };
  }, []);

  const metrics = useMemo(() => {
    if (!mounted) return [];
    return [
      { label: "Active Projects", value: projects.filter(p => p.status !== "completed").length },
      { label: "Active Blockers", value: blockerCount },
      { label: "Team Members", value: teamCount },
      { label: "On Time Delivery", value: "92%" },
    ];
  }, [projects, blockerCount, teamCount, mounted]);

  const handleReset = () => {
    resetDB();
    alert("Demo database has been reset to defaults.");
  };

  if (!mounted) {
    return (
      <DepartmentShell activePath="/department/home">
        <PageHeader
          title="Engineering Department"
          description="Department overview and active projects."
          primaryAction={{ label: "New Project", href: "/department/projects?new=true" }}
        />
        <div style={{ padding: 40, textAlign: "center", color: "var(--core-text-subtle)" }}>
          Loading department...
        </div>
      </DepartmentShell>
    );
  }

  return (
    <DepartmentShell activePath="/department/home">
      <PageHeader
        title={`${currentUser.departmentName} Overview`}
        description={`Welcome back, ${currentUser.name.split(' ')[0]}. Here is the high-level status of your department.`}
        primaryAction={{ label: "New Project", href: "/department/projects?new=true" }}
        secondaryActions={[
          { label: "Reset Demo Data", onClick: handleReset, variant: "ghost" }
        ]}
      />

      <div className="core-grid-4" style={{ marginBottom: 32 }}>
        {metrics.map((m) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
          />
        ))}
      </div>

      <DataTable
        title="Active Projects"
        columns={columns}
        rows={projects.filter(p => p.status !== "completed")}
        rowKey={(row) => row.id}
        rowActions={(row) => [
          {
            label: "Open Dashboard",
            onClick: () => {
              window.location.href = `/department/projects`;
            }
          },
        ]}
      />
    </DepartmentShell>
  );
}
