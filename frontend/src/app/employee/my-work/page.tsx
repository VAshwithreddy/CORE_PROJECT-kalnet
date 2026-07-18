"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerField, DrawerSection } from "@/components/detail-drawer";
import { EmployeeShell } from "@/components/employee-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { getAssignmentsByOwner, updateAssignment, addBlocker, resolveBlocker, subscribe, type Assignment } from "@/lib/mock-db";
import { getCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";

const columns: DataTableColumn<Assignment>[] = [
  {
    key: "title",
    header: "Assignment",
    sortable: true,
    minWidth: "240px",
    render: (row) => (
      <div>
        <strong>{row.title}</strong>
        <div style={{ color: "var(--core-text-subtle)", fontSize: "var(--core-text-xs)", marginTop: 3 }}>
          {row.project}
        </div>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" />,
  },
  { key: "priority", header: "Priority", sortable: true },
  { key: "dueDate", header: "Due", sortable: true, minWidth: "140px" },
  {
    key: "progress",
    header: "Progress",
    sortable: true,
    minWidth: "120px",
    render: (row) => (
      <ProgressBar
        value={row.progress}
        color={row.status === "blocked" ? "var(--core-danger)" : "var(--core-brand)"}
      />
    ),
  },
];

const filterSelectStyle = { height: 36, minWidth: 132 } as const;

export default function MyWorkPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentUser, setCurrentUser] = useState<CoreUser>(getCurrentUser());

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("Details");

  // Form states
  const [progressInput, setProgressInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [blockerReason, setBlockerReason] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [notice, setNotice] = useState("1 blocked assignment needs attention before the end of today.");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAssignments(getAssignmentsByOwner(getCurrentUser().id));

    const unsubSession = subscribeSession((user) => {
      setCurrentUser(user);
      setAssignments(getAssignmentsByOwner(user.id));
      setSelectedAssignment(null);
    });

    const unsubDb = subscribe(() => {
      setAssignments(getAssignmentsByOwner(getCurrentUser().id));
    });

    return () => {
      unsubSession();
      unsubDb();
    };
  }, []);

  // Update selectedAssignment ref when assignments update in DB
  useEffect(() => {
    if (selectedAssignment) {
      const fresh = getAssignmentsByOwner(getCurrentUser().id).find((a) => a.id === selectedAssignment.id);
      if (fresh) {
        setSelectedAssignment(fresh);
      }
    }
  }, [assignments, selectedAssignment]);

  const projects = useMemo(
    () => Array.from(new Set(assignments.map((assignment) => assignment.project))),
    [assignments],
  );

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || assignment.priority === priorityFilter;
        const matchesDue = dueFilter === "all" || assignment.dueBucket === dueFilter;
        const matchesProject = projectFilter === "all" || assignment.project === projectFilter;
        return matchesStatus && matchesPriority && matchesDue && matchesProject;
      }),
    [assignments, dueFilter, priorityFilter, projectFilter, statusFilter],
  );

  const metrics = useMemo(
    () => [
      {
        label: "Assigned Today",
        value: assignments.filter((assignment) => assignment.dueBucket === "today").length,
      },
      {
        label: "Due This Week",
        value: assignments.filter((assignment) => assignment.dueBucket === "week").length,
      },
      {
        label: "Blocked",
        value: assignments.filter((assignment) => assignment.status === "blocked").length,
      },
      {
        label: "Completed",
        value: assignments.filter((assignment) => assignment.status === "completed").length,
      },
    ],
    [assignments],
  );

  const handleUpdateStatus = (assignmentId: string, status: BadgeStatus, progress?: number) => {
    const isCompleted = status === "completed";
    const statusNote = `Status changed to ${status.replace("-", " ")} just now.`;
    
    updateAssignment(assignmentId, {
      status,
      progress: isCompleted ? 100 : (progress !== undefined ? progress : 50),
      lastUpdate: statusNote,
      ...(isCompleted ? { blocker: "None" } : {})
    });

    setNotice(`Assignment ${assignmentId} was updated to ${status.replace("-", " ")}.`);
    setTimeout(() => setNotice(""), 5000);
  };

  const handleRaiseBlocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!blockerReason.trim()) {
      alert("Please provide a reason for the blocker.");
      return;
    }

    const blockerId = `BLK-${Date.now()}`;
    addBlocker({
      id: blockerId,
      title: `Blocked: ${selectedAssignment.title}`,
      project: selectedAssignment.project,
      owner: currentUser.name,
      severity: "High",
      daysBlocked: 0,
      reason: blockerReason,
    });

    // Update assignment status
    updateAssignment(selectedAssignment.id, {
      status: "blocked",
      blocker: blockerReason,
      lastUpdate: `Blocker raised: ${blockerReason}`
    });

    setBlockerReason("");
    setNotice(`Blocker raised on assignment ${selectedAssignment.id}`);
    setTimeout(() => setNotice(""), 5000);
  };

  const handleSaveProgressNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!progressNote.trim()) {
      alert("Please enter a note.");
      return;
    }

    updateAssignment(selectedAssignment.id, {
      lastUpdate: `Progress note added: ${progressNote}`
    });

    setProgressNote("");
    setNotice("Progress note updated successfully.");
    setTimeout(() => setNotice(""), 5000);
  };

  if (!mounted) {
    return (
      <EmployeeShell activePath="/employee/my-work">
        <PageHeader
          title="My Work"
          description="Search, filter, and update the assignments currently owned by you."
          breadcrumbs={[
            { label: "Employee", href: "/employee/home" },
            { label: "My Work" },
          ]}
        />
        <div style={{ padding: 40, textAlign: "center", color: "var(--core-text-subtle)" }}>
          Loading your work...
        </div>
      </EmployeeShell>
    );
  }

  return (
    <EmployeeShell activePath="/employee/my-work">
      <PageHeader
        title="My Work"
        description="Search, filter, and update the assignments currently owned by you."
        breadcrumbs={[
          { label: "Employee", href: "/employee/home" },
          { label: "My Work" },
        ]}
        meta={<span>Personal scope only</span>}
        primaryAction={{
          label: "Filter Blocked",
          onClick: () => {
            setStatusFilter("blocked");
            setNotice("Showing blocked assignments so you can add detail or follow up.");
          },
        }}
        secondaryActions={[
          {
            label: "Due This Week",
            variant: "secondary",
            onClick: () => setDueFilter("week"),
          },
        ]}
      />

      {notice && (
        <div className="alert-strip alert-strip--warning" role="status">
          <span>{notice}</span>
        </div>
      )}

      <div className="core-grid-4" style={{ marginBottom: 24 }}>
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>

      <DataTable
        title="Assignments"
        columns={columns}
        rows={filteredAssignments}
        rowKey={(row) => row.id}
        selectable
        batchActions={[
          {
            label: "Mark In Progress",
            onClick: (selectedKeys) => {
              selectedKeys.forEach((key) => handleUpdateStatus(key, "in-progress"));
            },
          },
          {
            label: "Mark Blocked",
            onClick: (selectedKeys) => {
              selectedKeys.forEach((key) => handleUpdateStatus(key, "blocked"));
            },
            danger: true,
          },
        ]}
        filtersSlot={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                <option value="in-progress">In progress</option>
                <option value="waiting">Waiting</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="form-label">
              Priority
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label className="form-label">
              Due
              <select
                className="form-select"
                value={dueFilter}
                onChange={(event) => setDueFilter(event.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="overdue">Overdue</option>
                <option value="later">Later</option>
              </select>
            </label>
            <label className="form-label">
              Project
              <select
                className="form-select"
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
                style={{ ...filterSelectStyle, minWidth: 170 }}
              >
                <option value="all">All</option>
                {projects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </label>
          </div>
        }
        rowActions={(row) => [
          {
            label: "Open",
            onClick: () => {
              setSelectedAssignment(row);
              setActiveTab("Details");
            },
          },
          {
            label: row.status === "completed" ? "Reopen" : "Complete",
            onClick: () =>
              handleUpdateStatus(row.id, row.status === "completed" ? "in-progress" : "completed"),
          },
        ]}
        emptyState={{
          title: "No assignments match these filters",
          body: "Clear one or more filters to return to your full work list.",
        }}
      />

      <DetailDrawer
        isOpen={Boolean(selectedAssignment)}
        onClose={() => setSelectedAssignment(null)}
        title={selectedAssignment?.title ?? "Assignment"}
        subtitle={selectedAssignment?.id}
        status={selectedAssignment ? <StatusBadge status={selectedAssignment.status} /> : undefined}
        tabs={["Details", "Progress", "Raise Blocker", "Files"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        footerRight={
          selectedAssignment && (
            <>
              {selectedAssignment.status === "blocked" ? (
                <button
                  type="button"
                  className="core-button core-button-primary"
                  onClick={() => {
                    resolveBlocker(selectedAssignment.id);
                    setNotice(`Blocker on ${selectedAssignment.id} resolved.`);
                  }}
                >
                  Resolve Blocker
                </button>
              ) : (
                <button
                  type="button"
                  className="core-button"
                  onClick={() => setActiveTab("Raise Blocker")}
                >
                  Mark Blocked
                </button>
              )}
              <button
                type="button"
                className="core-button core-button-primary"
                onClick={() => handleUpdateStatus(selectedAssignment.id, "completed")}
                disabled={selectedAssignment.status === "completed"}
              >
                Complete
              </button>
            </>
          )
        }
      >
        {selectedAssignment && activeTab === "Details" && (
          <>
            <DrawerSection title="Assignment Details">
              <DrawerField label="Project" value={selectedAssignment.project} />
              <DrawerField label="Priority" value={selectedAssignment.priority} />
              <DrawerField label="Due Date" value={selectedAssignment.dueDate} />
              <DrawerField label="Owner" value={selectedAssignment.owner} />
            </DrawerSection>
            <DrawerSection title="Current Context">
              <DrawerField label="Progress" value={`${selectedAssignment.progress}%`} />
              <DrawerField label="Next Step" value={selectedAssignment.nextStep} />
              <DrawerField label="Blocker" value={selectedAssignment.blocker} />
              <DrawerField label="Last Update" value={selectedAssignment.lastUpdate} />
            </DrawerSection>
          </>
        )}

        {selectedAssignment && activeTab === "Progress" && (
          <form onSubmit={handleSaveProgressNote} className="form-section">
            <h2 className="form-section__heading">Progress Note</h2>
            <p className="form-section__description" style={{ marginBottom: 12 }}>
              Add a note about your latest progress.
            </p>
            <label className="form-label" htmlFor="progress-note">
              Note
            </label>
            <textarea
              id="progress-note"
              className="form-textarea"
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              rows={4}
              required
            />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="core-button core-button-primary">
                Save Progress Note
              </button>
            </div>
          </form>
        )}

        {selectedAssignment && activeTab === "Raise Blocker" && (
          <form onSubmit={handleRaiseBlocker} className="form-section">
            <h2 className="form-section__heading">Raise Blocker</h2>
            <p className="form-section__description" style={{ marginBottom: 12 }}>
              Describe the blocker preventing this assignment from moving forward.
            </p>
            <label className="form-label" htmlFor="blocker-reason">
              Blocker Reason
            </label>
            <textarea
              id="blocker-reason"
              className="form-textarea"
              value={blockerReason}
              onChange={(e) => setBlockerReason(e.target.value)}
              rows={4}
              required
            />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="core-button core-button-danger">
                Submit Blocker
              </button>
            </div>
          </form>
        )}

        {selectedAssignment && activeTab === "Files" && (
          <DrawerSection title="Supporting Material">
            <DrawerField label="Primary Link" value={selectedAssignment.supportLink} />
          </DrawerSection>
        )}
      </DetailDrawer>
    </EmployeeShell>
  );
}
