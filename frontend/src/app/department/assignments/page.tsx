"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DepartmentShell } from "@/components/department-shell";
import { DetailDrawer, DrawerField, DrawerSection } from "@/components/detail-drawer";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { SelectInput, TextInput } from "@/components/form-controls";
import { useAuth } from "@/lib/auth";
import { createAssignment, deleteAssignment, getAssignments, getPeople, getProjects, updateAssignment } from "@/lib/api";

type Assignment = {
  id: string;
  title: string;
  project: string;
  projectId: string;
  owner: string;
  ownerId: string;
  departmentId: string;
  status: BadgeStatus;
  priority: string;
  dueDate: string;
  progress: number;
  nextStep?: string;
};

const columns: DataTableColumn<Assignment>[] = [
  {
    key: "title",
    header: "Assignment",
    sortable: true,
    minWidth: "260px",
    render: (row) => (
      <div>
        <strong>{row.title}</strong>
        <div style={{ color: "var(--core-text-subtle)", fontSize: "var(--core-text-xs)", marginTop: 3 }}>
          {row.project}
        </div>
      </div>
    ),
  },
  { key: "owner", header: "Assignee", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" label={row.status} />,
  },
  { key: "priority", header: "Priority", sortable: true },
  { key: "dueDate", header: "Due Date", sortable: true },
];

const filterSelectStyle = { height: 36, minWidth: 132 } as const;

export default function AssignmentsPage() {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [projects, setProjects] = useState<{value: string, label: string}[]>([]);
  const [teamMembers, setTeamMembers] = useState<{value: string, label: string}[]>([]);
  
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("Details");
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [newTaskDueBucket, setNewTaskDueBucket] = useState<"today" | "week" | "later" | "overdue">("week");

  useEffect(() => {
    setMounted(true);
    if (!token || !user) return;
    const deptId = user.departmentId;

    Promise.all([
      getAssignments(token).catch(() => []),
      getProjects(token).catch(() => []),
      getPeople(token).catch(() => []),
    ]).then(([aData, pData, tData]) => {
      const all = Array.isArray(aData) ? aData : [];
      setAssignments(all.filter((a: any) => !a.departmentId || a.departmentId === deptId));

      const allP = Array.isArray(pData) ? pData : [];
      setProjects(allP.filter((p: any) => !p.departmentId || p.departmentId === deptId).map((p: any) => ({ value: p.id, label: p.name })));

      const allT = Array.isArray(tData) ? tData : [];
      setTeamMembers(allT.filter((m: any) => !m.departmentId || m.departmentId === deptId).map((m: any) => ({ value: m.id, label: m.name })));
    });
  }, [token, user]);

  // Keep drawer in sync if list updates
  useEffect(() => {
    if (selectedAssignment) {
      const fresh = assignments.find((a) => a.id === selectedAssignment.id);
      setSelectedAssignment(fresh || null);
    }
  }, [assignments, selectedAssignment]);

  const owners = useMemo(
    () => Array.from(new Set(assignments.map((a) => a.owner))),
    [assignments]
  );

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((a) => {
        const matchesOwner = ownerFilter === "all" || a.owner === ownerFilter;
        const matchesStatus = statusFilter === "all" || a.status === statusFilter;
        return matchesOwner && matchesStatus;
      }),
    [assignments, ownerFilter, statusFilter]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Total Active",
        value: assignments.filter((a) => a.status !== "completed").length,
      },
      {
        label: "Blocked",
        value: assignments.filter((a) => a.status === "blocked").length,
      },
      {
        label: "Unassigned",
        value: assignments.filter((a) => a.owner === "Unassigned" || a.owner === "unassigned").length,
      },
    ],
    [assignments]
  );

  const handleReassign = async (newOwnerId: string) => {
    if (!selectedAssignment) return;
    const ownerName = teamMembers.find(m => m.value === newOwnerId)?.label || "Unknown";
    try {
      const updated = await updateAssignment(selectedAssignment.id, { person_id: newOwnerId }, token || undefined);
      setAssignments((items) => items.map((item) => item.id === updated.id ? updated : item));
      setNotice(`Assignment reassigned to ${ownerName}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to reassign this assignment.");
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle || !newTaskProject || !newTaskOwner) {
      alert("Please fill in all required fields.");
      return;
    }
    const daysByBucket = { today: 0, week: 7, later: 30, overdue: -1 };
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysByBucket[newTaskDueBucket]);
    try {
      const created = await createAssignment({
        project_id: newTaskProject,
        person_id: newTaskOwner,
        role: newTaskTitle,
        status: "active",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
      }, token || undefined);
      setAssignments((items) => [created, ...items]);
      setNotice(`Assignment "${newTaskTitle}" created.`);
      setIsNewTaskOpen(false);
      setNewTaskTitle("");
      setNewTaskProject("");
      setNewTaskOwner("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create this assignment.");
    }
  };

  const handleDeleteTask = async (assignment: Assignment) => {
    if (!window.confirm(`Delete "${assignment.title}"? Its status updates will also be removed.`)) return;
    try {
      await deleteAssignment(assignment.id, token || undefined);
      setAssignments((items) => items.filter((item) => item.id !== assignment.id));
      setSelectedAssignment(null);
      setNotice(`Assignment "${assignment.title}" deleted.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to delete this assignment.");
    }
  };

  if (!mounted) {
    return (
      <DepartmentShell activePath="/department/assignments">
        <PageHeader
          title="Department Assignments"
          description="Track all active work and manage resource allocation across the department."
          breadcrumbs={[
            { label: "Department", href: "/department/home" },
            { label: "Assignments" },
          ]}
        />
        <div style={{ padding: 40, textAlign: "center", color: "var(--core-text-subtle)" }}>
          Loading assignments...
        </div>
      </DepartmentShell>
    );
  }

  return (
    <DepartmentShell activePath="/department/assignments">
      <PageHeader
        title="Department Assignments"
        description="Track all active work and manage resource allocation across the department."
        breadcrumbs={[
          { label: "Department", href: "/department/home" },
          { label: "Assignments" },
        ]}
        primaryAction={{
          label: "New Task",
          onClick: () => setIsNewTaskOpen(true),
        }}
      />

      {notice && (
        <div className="alert-strip alert-strip--success" role="status" style={{ marginBottom: 24 }}>
          <span>{notice}</span>
        </div>
      )}

      <div className="core-grid" style={{ marginBottom: 24 }}>
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <DataTable
        title="All Assignments"
        columns={columns}
        rows={filteredAssignments}
        rowKey={(row) => row.id}
        filtersSlot={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <label className="form-label">
              Assignee
              <select
                className="form-select"
                value={ownerFilter}
                onChange={(event) => setOwnerFilter(event.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                {owners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Status
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="in-progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>
          </div>
        }
        rowActions={(row) => [
          {
            label: "Manage",
            onClick: () => {
              setSelectedAssignment(row);
              setActiveTab("Details");
            },
          },
          {
            label: "Delete Task",
            onClick: () => void handleDeleteTask(row),
          },
        ]}
      />

      <DetailDrawer
        isOpen={Boolean(selectedAssignment)}
        onClose={() => setSelectedAssignment(null)}
        title={selectedAssignment?.title ?? "Assignment"}
        subtitle={selectedAssignment?.id}
        status={
          selectedAssignment ? (
            <StatusBadge status={selectedAssignment.status} label={selectedAssignment.status} />
          ) : undefined
        }
        tabs={["Details", "Reassign"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {selectedAssignment && activeTab === "Details" && (
          <>
            <DrawerSection title="Assignment Context">
              <DrawerField label="Project" value={selectedAssignment.project} />
              <DrawerField label="Priority" value={selectedAssignment.priority} />
              <DrawerField label="Due Date" value={selectedAssignment.dueDate} />
              <DrawerField label="Assignee" value={selectedAssignment.owner} />
              <DrawerField label="Progress" value={`${selectedAssignment.progress}%`} />
            </DrawerSection>
          </>
        )}

        {selectedAssignment && activeTab === "Reassign" && (
          <DrawerSection title="Transfer Assignment">
            <p style={{ margin: "0 0 16px", color: "var(--core-text-muted)", lineHeight: 1.5 }}>
              Select a new owner for this assignment. Transferring an assignment updates their personal worklist instantly.
            </p>
            <SelectInput
              label="New Assignee"
              value={selectedAssignment.ownerId || ""}
              onChange={(e) => handleReassign(e.target.value)}
              options={[
                { value: "", label: "Unassigned", disabled: true },
                ...teamMembers,
              ]}
            />
          </DrawerSection>
        )}
      </DetailDrawer>

      <DetailDrawer
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        title="Create New Task"
        subtitle={`Department: ${user?.departmentName ?? '—'}`}
      >
        <DrawerSection title="Task Details">
          <TextInput
            label="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="e.g. Write architecture document"
            required
          />
          <div style={{ marginTop: 16 }}>
            <SelectInput
              label="Project"
              value={newTaskProject}
              onChange={(e) => setNewTaskProject(e.target.value)}
              options={[
                { value: "", label: "Select a project...", disabled: true },
                ...projects
              ]}
              required
            />
          </div>
        </DrawerSection>
        <DrawerSection title="Assignment">
          <SelectInput
            label="Assignee"
            value={newTaskOwner}
            onChange={(e) => setNewTaskOwner(e.target.value)}
            options={[
              { value: "", label: "Select team member...", disabled: true },
              ...teamMembers
            ]}
            required
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <SelectInput
              label="Priority"
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as any)}
              options={[
                { value: "Low", label: "Low" },
                { value: "Medium", label: "Medium" },
                { value: "High", label: "High" },
                { value: "Critical", label: "Critical" },
              ]}
            />
            <SelectInput
              label="Timeline"
              value={newTaskDueBucket}
              onChange={(e) => setNewTaskDueBucket(e.target.value as any)}
              options={[
                { value: "today", label: "Due Today" },
                { value: "week", label: "Due This Week" },
                { value: "later", label: "Due Later" },
              ]}
            />
          </div>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="core-button" onClick={() => setIsNewTaskOpen(false)}>
              Cancel
            </button>
            <button className="core-button core-button-primary" onClick={handleCreateTask}>
              Create Task
            </button>
          </div>
        </DrawerSection>
      </DetailDrawer>
    </DepartmentShell>
  );
}
