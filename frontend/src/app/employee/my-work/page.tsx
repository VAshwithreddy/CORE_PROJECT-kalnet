"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerField, DrawerSection } from "@/components/detail-drawer";
import { EmployeeShell } from "@/components/employee-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { createStatusUpdate, getAssignments, resolveBlocker } from "@/lib/api";

type Assignment = {
  id: string;
  title: string;
  project: string;
  status: BadgeStatus;
  priority: string;
  assignedDate: string;
  dueDate: string;
  dueBucket: string;
  progress: number;
  owner: string;
  ownerId: string;
  nextStep: string;
  lastUpdate: string;
  blocker: string;
  supportLink: string;
  projectId: string;
};
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
  { key: "assignedDate", header: "Assigned", sortable: true, minWidth: "140px" },
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

function getDueBucket(dueDate: string): string {
  const due = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(due.getTime())) return "later";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  if (due < today) return "overdue";
  if (due.toDateString() === today.toDateString()) return "today";
  if (due <= weekEnd) return "week";
  return "later";
}

function isToday(value: string): boolean {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function mapAssignment(item: any): Assignment {
  return {
    id: String(item.id),
    title: item.title || item.role || "Task",
    project: item.project || item.project_name || "Unknown Project",
    status: item.status === "completed" || item.status === "done" ? "completed" : item.status === "blocked" ? "blocked" : item.status === "waiting" ? "waiting" : "in-progress",
    priority: item.priority || "Medium",
    assignedDate: item.start_date || item.startDate || item.created_at || "Not set",
    dueDate: item.end_date || item.dueDate || "Not set",
    dueBucket: getDueBucket(item.end_date || item.dueDate || ""),
    progress: item.progress ?? (item.status === "completed" || item.status === "done" ? 100 : 50),
    owner: item.owner || "Me",
    ownerId: item.ownerId || item.person_id || "",
    nextStep: "Continue work",
    lastUpdate: item.updated_at || "No updates yet",
    blocker: item.status === "blocked" ? "Blocker reported" : "None",
    supportLink: "#",
    projectId: item.projectId || item.project_id || "",
  };
}

export default function MyWorkPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

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
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [requestedAssignmentId, setRequestedAssignmentId] = useState("");
  const handledDeepLink = useRef(false);

  const loadAssignments = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getAssignments(token);
      setAssignments((Array.isArray(data) ? data : []).map(mapAssignment));
    } catch (error) {
      console.error("Unable to refresh assignments", error);
    }
  }, [token]);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    setFocusMode(params.get("focus") === "active");
    setRequestedAssignmentId(params.get("assignment") || "");
    
    if (user && !authLoading) {
      void loadAssignments();
    }
  }, [user, authLoading, loadAssignments]);

  useEffect(() => {
    if (!token) return;
    const interval = window.setInterval(() => void loadAssignments(), 15_000);
    const refreshOnFocus = () => { if (!document.hidden) void loadAssignments(); };
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [token, loadAssignments]);

  useEffect(() => {
    if (!requestedAssignmentId || handledDeepLink.current || assignments.length === 0) return;
    const assignment = assignments.find((item) => item.id === requestedAssignmentId);
    if (assignment) {
      setSelectedAssignment(assignment);
      setActiveTab("Details");
      setNotice(`Opened ${assignment.title} from your calendar deadline.`);
    } else {
      setNotice("That assignment is no longer available in your work list.");
    }
    handledDeepLink.current = true;
  }, [assignments, requestedAssignmentId]);

  // Update selectedAssignment ref when assignments update in DB
  useEffect(() => {
    if (selectedAssignment) {
      const fresh = assignments.find((a) => a.id === selectedAssignment.id);
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
    () => {
      const result = assignments.filter((assignment) => {
        const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || assignment.priority === priorityFilter;
        const matchesDue = dueFilter === "all" || assignment.dueBucket === dueFilter;
        const matchesProject = projectFilter === "all" || assignment.project === projectFilter;
        const matchesFocus = !focusMode || assignment.status !== "completed";
        return matchesStatus && matchesPriority && matchesDue && matchesProject && matchesFocus;
      });
      return focusMode ? [...result].sort((left, right) => left.dueDate.localeCompare(right.dueDate)) : result;
    },
    [assignments, dueFilter, focusMode, priorityFilter, projectFilter, statusFilter],
  );

  const metrics = useMemo(
    () => [
      {
        label: "Assigned Today",
        value: assignments.filter((assignment) => isToday(assignment.assignedDate)).length,
      },
      {
        label: "Due This Week",
        value: assignments.filter((assignment) => assignment.status !== "completed" && (assignment.dueBucket === "today" || assignment.dueBucket === "week")).length,
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

  const handleUpdateStatus = async (assignmentId: string, status: BadgeStatus, progress?: number) => {
    const isCompleted = status === "completed";
    const statusNote = `Status changed to ${status.replace("-", " ")} just now.`;
    const apiStatus = status === "completed" ? "completed" : status === "blocked" ? "blocked" : "on_track";
    try {
      await createStatusUpdate(assignmentId, { status: apiStatus, message: statusNote }, token || undefined);
    } catch {
      setNotice("Your assignment update could not be saved. Please try again.");
      return;
    }
    setAssignments(prev => prev.map(a => 
      a.id === assignmentId 
        ? { ...a, status, progress: isCompleted ? 100 : (progress !== undefined ? progress : 50), lastUpdate: statusNote, ...(isCompleted ? { blocker: "None" } : {}) } 
        : a
    ));

    setNotice(`Assignment ${assignmentId} was updated to ${status.replace("-", " ")}.`);
    setTimeout(() => setNotice(""), 5000);
  };

  const handleRaiseBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!blockerReason.trim()) {
      alert("Please provide a reason for the blocker.");
      return;
    }

    try {
      await createStatusUpdate(selectedAssignment.id, { status: "blocked", message: `Blocker raised: ${blockerReason}`, blockers: blockerReason }, token || undefined);
    } catch {
      setNotice("Your blocker could not be submitted. Please try again.");
      return;
    }
    setAssignments(prev => prev.map(a => 
      a.id === selectedAssignment.id 
        ? { ...a, status: "blocked", blocker: blockerReason, lastUpdate: `Blocker raised: ${blockerReason}` } 
        : a
    ));

    setBlockerReason("");
    setNotice(`Blocker raised on assignment ${selectedAssignment.id}`);
    setTimeout(() => setNotice(""), 5000);
  };

  const handleSaveProgressNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!progressNote.trim()) {
      alert("Please enter a note.");
      return;
    }

    try {
      await createStatusUpdate(selectedAssignment.id, { status: "on_track", message: progressNote }, token || undefined);
    } catch {
      setNotice("Your progress note could not be saved. Please try again.");
      return;
    }
    setAssignments(prev => prev.map(a => 
      a.id === selectedAssignment.id 
        ? { ...a, lastUpdate: `Progress note added: ${progressNote}` } 
        : a
    ));

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

      {focusMode && (
        <div className="alert-strip alert-strip--info" role="status">
          <span>Focus session active: completed work is hidden and open assignments are ordered by due date.</span>
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
                  onClick={async () => {
                    try {
                      await resolveBlocker(selectedAssignment.id, "Blocker resolved.", token || undefined);
                    } catch {
                      setNotice("The blocker could not be resolved. Please try again.");
                      return;
                    }
                    setAssignments(prev => prev.map(a => 
                      a.id === selectedAssignment.id 
                        ? { ...a, status: "in-progress", blocker: "None", lastUpdate: `Blocker resolved.` } 
                        : a
                    ));
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
              <DrawerField label="Assignment Date" value={selectedAssignment.assignedDate} />
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
