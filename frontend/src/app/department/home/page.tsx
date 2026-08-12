"use client";

import { useEffect, useState, useMemo } from "react";
import { DepartmentShell } from "@/components/department-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getProjects, getBlockers, getPeople } from "@/lib/api";

type ProjectHealth = "On Track" | "At Risk" | "Off Track" | "Delivered";

type ProjectItem = {
  id: string;
  name: string;
  departmentId: string;
  ownerId: string;
  owner: string;
  status: "new" | "waiting" | "in-progress" | "blocked" | "completed" | "archived";
  statusLabel: string;
  health: ProjectHealth;
  nextMilestone?: string;
};

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
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [blockerCount, setBlockerCount] = useState(0);
  const [departmentMembers, setDepartmentMembers] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token || !user) return;

    Promise.all([
      getProjects(token).catch(() => []),
      getBlockers(token).catch(() => []),
      getPeople(token).catch(() => []),
    ]).then(([projData, blockerData, teamData]) => {
      const allProjects = Array.isArray(projData) ? projData : [];
      setProjects(allProjects.filter((p: any) => p.departmentId === user.departmentId));

      const allBlockers = Array.isArray(blockerData) ? blockerData : [];
      setBlockerCount(allBlockers.length);

      const allTeam = Array.isArray(teamData) ? teamData : [];
      setDepartmentMembers(allTeam.filter((m: any) => !m.departmentId || m.departmentId === user.departmentId));
    });
  }, [token, user]);

  const metrics = useMemo(() => {
    if (!mounted) return [];
    return [
      { label: "Active Projects", value: projects.filter(p => p.status !== "completed").length },
      { label: "Active Blockers", value: blockerCount },
      { label: "Team Members", value: departmentMembers.length },
      { label: "On Time Delivery", value: "92%" },
    ];
  }, [projects, blockerCount, departmentMembers, mounted]);

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

  const activeProjects = projects.filter((project) => project.status !== "completed").length;

  return (
    <DepartmentShell activePath="/department/home">
      <PageHeader
        title={`${user?.departmentName || "Department"} Overview`}
        description={`Welcome back, ${user?.name?.split(' ')[0] || "User"}. Here is the high-level status of your department.`}
        meta={
          <>
            <span>{activeProjects} active projects</span>
            <span>{blockerCount} blockers</span>
            <span>{departmentMembers.length} team members</span>
          </>
        }
        primaryAction={{ label: "New Project", href: "/department/projects?new=true" }}
      />

      <div className="workbench-grid">
        <div className="core-panel">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div>
              <h2>Priority Project Queue</h2>
              <p>Projects needing department-head attention this week.</p>
            </div>
            <a className="core-button core-button-sm" href="/department/projects">Open Projects</a>
          </div>
          <ul className="mini-list">
            {projects
              .filter((project) => project.status !== "completed")
              .slice(0, 4)
              .map((project) => (
                <li key={project.id} className="mini-list__item">
                  <span>
                    <span className="mini-list__title">{project.name}</span>
                    <span className="mini-list__meta">{project.owner} - {project.nextMilestone}</span>
                  </span>
                  <StatusBadge status={healthStatusMap[project.health]} size="sm" label={project.health} />
                </li>
              ))}
          </ul>
        </div>

        <div className="core-panel">
          <h2>Capacity Snapshot</h2>
          <p>Team availability bands from the live workspace model.</p>
          {[
            {
              label: "Healthy",
              value: departmentMembers.filter((member) => member.loadBand === "healthy").length,
              className: "",
            },
            {
              label: "Near full",
              value: departmentMembers.filter((member) => member.loadBand === "full").length,
              className: "capacity-fill--warning",
            },
            {
              label: "Overload",
              value: departmentMembers.filter((member) => member.loadBand === "overloaded").length,
              className: "capacity-fill--danger",
            },
          ].map((row) => {
            const total = Math.max(1, departmentMembers.length);
            return (
              <div className="capacity-row" key={row.label}>
                <span>{row.label}</span>
                <span className="capacity-track">
                  <span className={`capacity-fill ${row.className}`} style={{ width: `${(row.value / total) * 100}%` }} />
                </span>
                <strong>{row.value}</strong>
              </div>
            );
          })}
        </div>
      </div>

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
