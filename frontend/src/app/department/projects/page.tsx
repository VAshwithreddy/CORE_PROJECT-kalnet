"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DepartmentShell } from "@/components/department-shell";
import { DetailDrawer, DrawerField, DrawerSection } from "@/components/detail-drawer";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { TextInput, SelectInput } from "@/components/form-controls";
import { useAuth } from "@/lib/auth";
import { getProjects, getPeople, createProject } from "@/lib/api";

export type ProjectHealth = "On Track" | "At Risk" | "Off Track" | "Delivered";

export type ProjectItem = {
  id: string;
  name: string;
  departmentId: string;
  ownerId: string;
  owner: string;
  status: "new" | "waiting" | "in-progress" | "blocked" | "completed" | "archived";
  statusLabel: string;
  health: ProjectHealth;
  dueDate: string;
  progress: number;
  nextMilestone: string;
  blockers: number;
};

const healthStatusMap: Record<ProjectHealth, BadgeStatus> = {
  "On Track": "approved",
  "At Risk": "waiting",
  "Off Track": "blocked",
  "Delivered": "completed",
};

function parseDueDate(dueStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueStr)) {
    return dueStr;
  }
  // If it contains Q1/Q2/Q3/Q4
  if (dueStr.includes("Q4")) {
    const yearMatch = dueStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
    return `${year}-12-31`;
  }
  if (dueStr.includes("Q3")) {
    const yearMatch = dueStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
    return `${year}-09-30`;
  }
  if (dueStr.includes("Q2")) {
    const yearMatch = dueStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
    return `${year}-06-30`;
  }
  if (dueStr.includes("Q1")) {
    const yearMatch = dueStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
    return `${year}-03-31`;
  }
  return `${new Date().getFullYear()}-12-31`;
}

const columns: DataTableColumn<ProjectItem>[] = [
  {
    key: "name",
    header: "Project",
    sortable: true,
    minWidth: "260px",
    render: (row) => (
      <div>
        <strong>{row.name}</strong>
        <div style={{ color: "var(--core-text-subtle)", fontSize: "var(--core-text-xs)", marginTop: 3 }}>
          {row.id}
        </div>
      </div>
    ),
  },
  {
    key: "status",
    header: "Phase",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" label={row.statusLabel} />,
  },
  {
    key: "health",
    header: "Health",
    sortable: true,
    render: (row) => <StatusBadge status={healthStatusMap[row.health]} size="sm" label={row.health} />,
  },
  { key: "owner", header: "Owner", sortable: true },
  { key: "dueDate", header: "Due Date", sortable: true },
  {
    key: "progress",
    header: "Progress",
    sortable: true,
    minWidth: "120px",
    render: (row) => (
      <ProgressBar
        value={row.progress}
        color={
          row.health === "Off Track"
            ? "var(--core-danger)"
            : row.health === "At Risk"
              ? "var(--core-warning)"
              : "var(--core-brand)"
        }
      />
    ),
  },
];

const filterSelectStyle = { height: 36, minWidth: 132 } as const;

export default function ProjectsPage() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<{value: string, label: string}[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [healthFilter, setHealthFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  // New Project Form State
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState<BadgeStatus>("new");
  const [formStatusLabel, setFormStatusLabel] = useState("Scoping");
  const [formHealth, setFormHealth] = useState<ProjectHealth>("On Track");
  const [formOwner, setFormOwner] = useState("");
  const [formDueDate, setFormDueDate] = useState("Q4 2026");
  const [formNextMilestone, setFormNextMilestone] = useState("Kickoff Meeting");

  useEffect(() => {
    setMounted(true);
    if (!token || !user) return;

    Promise.all([
      getProjects(token).catch(() => []),
      getPeople(token).catch(() => []),
    ]).then(([projData, teamData]) => {
      const allProjects = Array.isArray(projData) ? projData : [];
      // Filter projects by department (API returns snake_case department_id)
      setProjects(allProjects.filter((p: any) => {
        const pDept = p.department_id || p.departmentId;
        return !pDept || String(pDept) === String(user.departmentId);
      }));

      const team = Array.isArray(teamData) ? teamData : [];
      // Use String() on both sides so UUID objects compare correctly;
      // if nobody matches the dept filter, show everyone the API returned
      // (backend RBAC already restricts visibility).
      const deptTeam = team.filter((m: any) => {
        const mDept = m.department_id || m.departmentId;
        return !mDept || String(mDept) === String(user.departmentId);
      });
      const members = deptTeam.length > 0 ? deptTeam : team;
      setTeamMembers(members.map((m: any) => ({ value: m.id, label: m.full_name || m.name })));
    });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        setIsCreating(true);
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [token, user]);

  const owners = useMemo(
    () => Array.from(new Set(projects.map((p) => p.owner))),
    [projects]
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) => {
        const matchesHealth = healthFilter === "all" || p.health === healthFilter;
        const matchesOwner = ownerFilter === "all" || p.owner === ownerFilter;
        return matchesHealth && matchesOwner;
      }),
    [projects, healthFilter, ownerFilter]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Active Projects",
        value: projects.filter((p) => p.statusLabel !== "Completed").length,
      },
      {
        label: "At Risk / Off Track",
        value: projects.filter((p) => p.health === "At Risk" || p.health === "Off Track").length,
      },
      {
        label: "Total Blockers",
        value: projects.reduce((sum, p) => sum + p.blockers, 0),
      },
      {
        label: "Delivered",
        value: projects.filter((p) => p.statusLabel === "Completed").length,
      },
    ],
    [projects]
  );

  const closeDrawer = () => {
    setSelectedProject(null);
    setIsCreating(false);
    setFormName("");
    setFormNextMilestone("");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formOwner || !formDueDate) {
      alert("Please fill out Name, Owner, and Due Date");
      return;
    }

    const formattedDate = parseDueDate(formDueDate);

    createProject(
      {
        name: formName,
        department_id: user?.departmentId,
        owner_id: formOwner,
        due_date: formattedDate,
        priority: formHealth === "Off Track" ? "high" : formHealth === "At Risk" ? "medium" : "low",
        status: formStatus,
      },
      token || undefined
    )
      .then(() => getProjects(token || undefined))
      .then((projData) => {
        const allProjects = Array.isArray(projData) ? projData : [];
        setProjects(allProjects.filter((p: any) => {
          const pDept = p.department_id || p.departmentId;
          return !pDept || String(pDept) === String(user?.departmentId);
        }));
        setNotice("Project created successfully.");
        closeDrawer();
        setTimeout(() => setNotice(""), 5000);
      })
      .catch((err) => {
        console.error("Failed to create project:", err);
        alert(`Error creating project: ${err.message}`);
      });
  };

  if (!mounted) {
    return (
      <DepartmentShell activePath="/department/projects">
        <PageHeader
          title="Department Projects"
          description="Track the health and status of top-level projects across the department."
          breadcrumbs={[
            { label: "Department", href: "/department/home" },
            { label: "Projects" },
          ]}
        />
        <div style={{ padding: 40, textAlign: "center", color: "var(--core-text-subtle)" }}>
          Loading projects...
        </div>
      </DepartmentShell>
    );
  }

  return (
    <DepartmentShell activePath="/department/projects">
      <PageHeader
        title="Department Projects"
        description="Track the health and status of top-level projects across the department."
        breadcrumbs={[
          { label: "Department", href: "/department/home" },
          { label: "Projects" },
        ]}
        primaryAction={{
          label: "New Project",
          onClick: () => setIsCreating(true),
        }}
      />

      {notice && (
        <div className="alert-strip alert-strip--success" role="status" style={{ marginBottom: 24 }}>
          <span>{notice}</span>
        </div>
      )}

      <div className="core-grid-4" style={{ marginBottom: 24 }}>
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <DataTable
        title="Project Portfolio"
        columns={columns}
        rows={filteredProjects}
        rowKey={(row) => row.id}
        filtersSlot={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <label className="form-label">
              Health
              <select
                className="form-select"
                value={healthFilter}
                onChange={(event) => setHealthFilter(event.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Off Track">Off Track</option>
                <option value="Delivered">Delivered</option>
              </select>
            </label>
            <label className="form-label">
              Owner
              <select
                className="form-select"
                value={ownerFilter}
                onChange={(event) => setOwnerFilter(event.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All Owners</option>
                {owners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </label>
          </div>
        }
        rowActions={(row) => [
          {
            label: "Open Dashboard",
            onClick: () => {
              setSelectedProject(row);
              setActiveTab("Overview");
            },
          },
        ]}
      />

      <DetailDrawer
        isOpen={Boolean(selectedProject) || isCreating}
        onClose={closeDrawer}
        title={isCreating ? "New Project" : selectedProject?.name ?? "Project Details"}
        subtitle={isCreating ? "Initialize department project" : selectedProject?.id}
        status={
          !isCreating && selectedProject ? (
            <StatusBadge status={healthStatusMap[selectedProject.health]} label={selectedProject.health} />
          ) : undefined
        }
        tabs={isCreating ? [] : ["Overview", "Milestones", "Resources"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        footerRight={
          isCreating ? (
            <>
              <button type="button" className="core-button" onClick={closeDrawer}>
                Cancel
              </button>
              <button
                type="button"
                className="core-button core-button-primary"
                onClick={handleCreate}
              >
                Create Project
              </button>
            </>
          ) : (
            <button type="button" className="core-button" onClick={closeDrawer}>
              Close
            </button>
          )
        }
      >
        {isCreating && (
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
            <TextInput
              label="Project Name"
              placeholder="e.g. CORE API Scaling"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <SelectInput
                label="Phase"
                value={formStatusLabel}
                onChange={(e) => {
                  setFormStatusLabel(e.target.value);
                  const label = e.target.value;
                  if (label === "Active") setFormStatus("in-progress");
                  else if (label === "Planning") setFormStatus("waiting");
                  else if (label === "Completed") setFormStatus("completed");
                  else setFormStatus("new");
                }}
                options={[
                  { value: "Scoping", label: "Scoping" },
                  { value: "Planning", label: "Planning" },
                  { value: "Active", label: "Active" },
                ]}
              />
              <SelectInput
                label="Health"
                value={formHealth}
                onChange={(e) => setFormHealth(e.target.value as ProjectHealth)}
                options={[
                  { value: "On Track", label: "On Track" },
                  { value: "At Risk", label: "At Risk" },
                  { value: "Off Track", label: "Off Track" },
                ]}
              />
            </div>
            <SelectInput
              label="Project Lead"
              value={formOwner}
              onChange={(e) => setFormOwner(e.target.value)}
              options={[
                { value: "", label: "Select team member...", disabled: true },
                ...teamMembers
              ]}
            />
            <TextInput
              label="Due Date"
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
              required
            />
            <TextInput
              label="Next Milestone"
              placeholder="e.g. Design specification approval"
              value={formNextMilestone}
              onChange={(e) => setFormNextMilestone(e.target.value)}
            />
          </form>
        )}

        {!isCreating && selectedProject && activeTab === "Overview" && (
          <>
            <DrawerSection title="Project Details">
              <DrawerField label="Phase" value={selectedProject.statusLabel} />
              <DrawerField label="Owner" value={selectedProject.owner} />
              <DrawerField label="Due Date" value={selectedProject.dueDate} />
              <DrawerField label="Overall Progress" value={`${selectedProject.progress}%`} />
            </DrawerSection>
            <DrawerSection title="Current Status">
              <DrawerField label="Next Milestone" value={selectedProject.nextMilestone} />
              <DrawerField
                label="Blockers"
                value={selectedProject.blockers > 0 ? `${selectedProject.blockers} active blocker(s)` : "No active blockers"}
              />
            </DrawerSection>
          </>
        )}

        {!isCreating && selectedProject && activeTab === "Milestones" && (
          <DrawerSection title="Upcoming Milestones">
            <p style={{ margin: 0, color: "var(--core-text-muted)", lineHeight: 1.5 }}>
              Currently focusing on: <strong>{selectedProject.nextMilestone}</strong>.
            </p>
          </DrawerSection>
        )}

        {!isCreating && selectedProject && activeTab === "Resources" && (
          <DrawerSection title="Team Allocation">
            <p style={{ margin: 0, color: "var(--core-text-muted)", lineHeight: 1.5 }}>
              Active Owner/Lead: <strong>{selectedProject.owner}</strong>. Additional contributors will be managed via assignment allocation.
            </p>
          </DrawerSection>
        )}
      </DetailDrawer>
    </DepartmentShell>
  );
}
