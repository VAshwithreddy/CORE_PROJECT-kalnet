"use client";

import { useEffect, useState, useMemo } from "react";
import { EmployeeShell } from "@/components/employee-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getAssignments, getEmployeeDashboard, getAlerts, getDigests, getProjects } from "@/lib/api";

type AssignmentRow = {
  id: string;
  project: string;
  title: string;
  status: string;
  dueDate: string;
  allocationPercent: number;
};

type CalendarAssignment = {
  id: string;
  title: string;
  dueDate: string;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseCalendarDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function formatDigestDate(value: string | null | undefined): string {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Recent digest";
}

function formatAssignmentDate(value: string | null | undefined): string {
  const date = parseCalendarDate(value);
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Not scheduled";
}

function PersonalCalendar({ assignments }: { assignments: CalendarAssignment[] }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const today = new Date();
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstDay.getDay() + daysInMonth }, (_, index) => {
    const day = index - firstDay.getDay() + 1;
    return day > 0 ? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day) : null;
  });
  const dueByDate = new Map<string, CalendarAssignment[]>();

  assignments.forEach((assignment) => {
    const dueDate = parseCalendarDate(assignment.dueDate);
    if (!dueDate || dueDate.getFullYear() !== visibleMonth.getFullYear() || dueDate.getMonth() !== visibleMonth.getMonth()) return;
    const key = dueDate.toDateString();
    dueByDate.set(key, [...(dueByDate.get(key) || []), assignment]);
  });

  return (
    <div className="core-panel">
      <div className="calendar-header">
        <div>
          <h2>Personal Calendar</h2>
          <p>Red dates are assignment deadlines. Select one to open that work item.</p>
        </div>
        <div className="calendar-navigation" aria-label="Calendar month navigation">
          <button type="button" className="core-button core-button-ghost core-button-icon" aria-label="Previous month" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            &lt;
          </button>
          <strong>{visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
          <button type="button" className="core-button core-button-ghost core-button-icon" aria-label="Next month" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            &gt;
          </button>
        </div>
      </div>
      <div className="calendar-mini calendar-mini--month" aria-label={`${visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })} calendar`}>
        {WEEKDAY_LABELS.map((label) => <span className="calendar-mini__weekday" key={label}>{label}</span>)}
        {cells.map((date, index) => {
          const dueAssignments = date ? dueByDate.get(date.toDateString()) || [] : [];
          const primaryDue = dueAssignments[0];
          return date ? (
            <span className={`calendar-mini__day${sameDay(date, today) ? " active" : ""}`} key={date.toISOString()}>
              <span>{date.getDate()}</span>
              {primaryDue && (
                <button
                  type="button"
                  className="calendar-mini__due"
                  onClick={() => { window.location.href = `/employee/my-work?assignment=${encodeURIComponent(primaryDue.id)}`; }}
                  aria-label={`Open ${primaryDue.title}, due ${date.toLocaleDateString()}`}
                  title={dueAssignments.length > 1 ? `${dueAssignments.length} assignments due - open ${primaryDue.title}` : `Open ${primaryDue.title}`}
                >
                  {dueAssignments.length > 1 ? dueAssignments.length : "!"}
                </button>
              )}
            </span>
          ) : <span className="calendar-mini__blank" key={`blank-${index}`} aria-hidden="true" />;
        })}
      </div>
    </div>
  );
}

const columns: DataTableColumn<AssignmentRow>[] = [
  { key: "id", header: "Assignment ID", sortable: true },
  { key: "project", header: "Project Name", sortable: true },
  { key: "title", header: "Role", sortable: true },
  { key: "allocationPercent", header: "Allocation", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status as any} size="sm" />
  },
  { key: "dueDate", header: "Due Date", sortable: true },
];

export default function EmployeeHomePage() {
  const { user, token, loading: authLoading } = useAuth();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [digests, setDigests] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [digestFromDate, setDigestFromDate] = useState("");
  const [digestToDate, setDigestToDate] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoadingData(false);
        return;
      }
      try {
        setLoadingData(true);
        const [dashRes, alertsRes, digestsRes, projectsRes, assignmentsRes] = await Promise.all([
          getEmployeeDashboard(token),
          getAlerts(token).catch(() => []), // fallback if alerts fail or 403
          getDigests(token).catch(() => []),
          getProjects(token).catch(() => []),
          getAssignments(token).catch(() => []),
        ]);
        setDashboardData(dashRes);
        setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
        setDigests(Array.isArray(digestsRes) ? digestsRes : []);
        setProjects(Array.isArray(projectsRes) ? projectsRes : []);
        setAllAssignments(Array.isArray(assignmentsRes) ? assignmentsRes : []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    
    if (!authLoading && token) {
      fetchData();
    } else if (!authLoading && !token) {
      setLoadingData(false);
    }
  }, [token, authLoading]);

  const assignments: AssignmentRow[] = useMemo(() => {
    if (!dashboardData?.active_assignments) return [];
    return dashboardData.active_assignments.map((a: any) => ({
      id: a.assignment_id?.substring(0, 8) || "N/A",
      project: a.project_name || "Unknown",
      title: a.role || "Task",
      status: a.status,
      dueDate: a.due_date || "N/A",
      allocationPercent: a.allocation_percent,
    }));
  }, [dashboardData]);

  const metrics = useMemo(() => {
    if (!mounted || !dashboardData) return [];
    const summary = dashboardData.summary || {};
    return [
      { label: "Active Assignments", value: summary.active_assignments || 0 },
      { label: "Completed Assignments", value: summary.completed_assignments || 0 },
      { label: "Blocked Items", value: summary.blocked_count || 0 },
      { label: "Unread Alerts", value: alerts.length },
    ];
  }, [dashboardData, alerts, mounted]);

  const calendarAssignments = useMemo<CalendarAssignment[]>(() =>
    allAssignments.flatMap((assignment: any) =>
      assignment.id && (assignment.end_date || assignment.due_date)
        ? [{ id: assignment.id, title: assignment.role || assignment.project_name || "Assignment", dueDate: assignment.end_date || assignment.due_date }]
        : [],
    ),
    [allAssignments],
  );

  const assignmentsById = useMemo(
    () => new Map(allAssignments.map((assignment: any) => [String(assignment.id), assignment])),
    [allAssignments],
  );

  const filteredDigests = useMemo(() => digests.filter((digest) => {
    const weekStart = parseCalendarDate(digest.week_start || digest.generated_at || digest.created_at);
    if (!weekStart) return !digestFromDate && !digestToDate;
    const from = parseCalendarDate(digestFromDate);
    const to = parseCalendarDate(digestToDate);
    return (!from || weekStart >= from) && (!to || weekStart <= to);
  }), [digestFromDate, digestToDate, digests]);

  if (!mounted || authLoading || loadingData) {
    return (
      <EmployeeShell activePath="/employee/home">
        <PageHeader
          title="Loading Workspace..."
          description="Fetching your real-time data from the backend."
        />
        <div style={{ padding: 40, textAlign: "center", color: "var(--core-text-subtle)" }}>
          <span className="login-dot-pulse" style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          <p style={{ marginTop: 12 }}>Syncing with Supabase...</p>
        </div>
      </EmployeeShell>
    );
  }

  if (!user || !dashboardData) {
    return (
      <EmployeeShell activePath="/employee/home">
        <PageHeader
          title="Data Unavailable"
          description="We couldn't load your employee data."
        />
        <div style={{ padding: 40, textAlign: "center", color: "var(--core-text-subtle)" }}>
          Please try refreshing or contact support.
        </div>
      </EmployeeShell>
    );
  }

  const summary = dashboardData.summary || {};
  const activeAssignmentsCount = summary.active_assignments || 0;
  const blockedCount = summary.blocked_count || 0;
  const completedCount = summary.completed_assignments || 0;

  return (
    <EmployeeShell activePath="/employee/home">
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}!`}
        description="Here is an overview of your current work."
        meta={
          <>
            <span>{activeAssignmentsCount} active assignments</span>
            <span>{blockedCount} blocked</span>
            <span>{completedCount} completed</span>
            <span>{alerts.length} unread alerts</span>
          </>
        }
        primaryAction={{ label: "New Request", href: "/employee/requests?new=true" }}
      />

      {notice && (
        <div className="alert-strip alert-strip--success" role="status">
          <span>{notice}</span>
        </div>
      )}

      <div className="workbench-grid workbench-grid--three">
        <PersonalCalendar assignments={calendarAssignments} />

        <div className="core-panel">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div>
              <h2>Recent Status Updates</h2>
              <p>Your latest updates across assignments.</p>
            </div>
            <a className="core-button core-button-sm" href="/employee/my-work">Open Work</a>
          </div>
          <ul className="mini-list">
            {(dashboardData.recent_status_updates || []).slice(0, 4).map((update: any) => (
              <li key={update.assignment_id + update.created_at} className="mini-list__item">
                <span>
                  <span className="mini-list__title">{update.message}</span>
                  <span className="mini-list__meta">{new Date(update.created_at).toLocaleDateString()}</span>
                </span>
                <StatusBadge status={update.status as any} size="sm" />
              </li>
            ))}
            {(!dashboardData.recent_status_updates || dashboardData.recent_status_updates.length === 0) && (
              <li className="mini-list__item">
                <span className="mini-list__meta">No recent status updates.</span>
              </li>
            )}
          </ul>
        </div>

        <div className="core-panel">
          <h2>Focus Session</h2>
          <p>A focused view of active work, ordered around the tasks that need attention first.</p>
          <div style={{ margin: "18px 0", fontSize: 34, fontWeight: 800, color: "var(--core-text)" }}>
            {activeAssignmentsCount}
          </div>
          <p style={{ marginBottom: 16 }}>active assignments remain open. Start a session to work from a distraction-free priority queue.</p>
          <button
            type="button"
            className="core-button core-button-primary"
            onClick={() => { window.location.href = "/employee/my-work?focus=active"; }}
          >
            Start Focus Block
          </button>
        </div>
      </div>

      {/* Staleness Alerts & Weekly Digests */}
      <div className="workbench-grid workbench-grid--two" style={{ marginBottom: 32 }}>
        <details className="core-panel dashboard-disclosure" open={alerts.length > 0}>
          <summary><span><strong>Staleness Alerts</strong><small>Assignments without recent updates.</small></span><span className="dashboard-disclosure__count">{alerts.length}</span></summary>
          {alerts.length > 0 ? (
            <div className="dashboard-disclosure__scroll">
              <ul className="mini-list dashboard-disclosure__content">
                {alerts.map((alert: any) => {
                  const assignment = assignmentsById.get(String(alert.assignment_id));
                  const assignmentTitle = assignment?.role || alert.title || "Assignment";
                  return (
                    <li key={alert.id} className="mini-list__item">
                      <a className="mini-list__link" href={`/employee/my-work?assignment=${encodeURIComponent(alert.assignment_id)}`}>
                        <span className="mini-list__title">{assignmentTitle}</span>
                        <span className="mini-list__meta">Assigned {formatAssignmentDate(assignment?.start_date)} · Due {formatAssignmentDate(assignment?.end_date)}</span>
                        <span className="mini-list__meta">{alert.days_since_update} days since the last update</span>
                      </a>
                      <StatusBadge status="blocked" size="sm" />
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : <p className="dashboard-disclosure__content">No staleness alerts.</p>}
        </details>
        <details className="core-panel dashboard-disclosure">
          <summary><span><strong>Weekly Digests</strong><small>Your recent weekly performance summaries.</small></span><span className="dashboard-disclosure__count">{digests.length}</span></summary>
          {digests.length > 0 ? (
            <>
              <div className="digest-date-filter">
                <label>From <input type="date" value={digestFromDate} onChange={(event) => setDigestFromDate(event.target.value)} /></label>
                <label>To <input type="date" value={digestToDate} onChange={(event) => setDigestToDate(event.target.value)} /></label>
                {(digestFromDate || digestToDate) && <button type="button" className="core-button core-button-ghost core-button-sm" onClick={() => { setDigestFromDate(""); setDigestToDate(""); }}>Clear</button>}
              </div>
              <div className="dashboard-disclosure__scroll">
                {filteredDigests.length > 0 ? (
                  <ul className="mini-list dashboard-disclosure__content">
                    {filteredDigests.map((digest: any) => <li key={digest.id} className="mini-list__item"><span><span className="mini-list__title">Week of {formatDigestDate(digest.week_start || digest.generated_at || digest.created_at)}</span><span className="mini-list__meta">{digest.summary || "Weekly digest generated."}</span></span></li>)}
                  </ul>
                ) : <p className="dashboard-disclosure__content">No weekly digests match that date range.</p>}
              </div>
            </>
          ) : <p className="dashboard-disclosure__content">No digests available yet.</p>}
        </details>
      </div>

      <div className="core-panel" style={{ marginBottom: 32 }}>
        <h2>My Projects</h2>
        <p>Projects you are currently contributing to.</p>
        {projects.length > 0 ? (
          <ul className="mini-list" style={{ marginTop: 16 }}>
            {projects.map((project: any) => (
              <li key={project.id} className="mini-list__item">
                <span>
                  <span className="mini-list__title">{project.name}</span>
                  <span className="mini-list__meta">{project.description}</span>
                </span>
                <StatusBadge status={project.status as any} size="sm" />
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ marginTop: 16, color: "var(--core-text-muted)" }}>You are not currently assigned to any active projects.</p>
        )}
      </div>

      <div className="core-grid-4" style={{ marginBottom: 32 }}>
        {metrics.map((m: any) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
          />
        ))}
      </div>

      <DataTable
        title="My Active Assignments"
        columns={columns}
        rows={assignments}
        rowKey={(row) => row.id}
        rowActions={(row) => [
          {
            label: "Open My Work",
            onClick: () => {
              window.location.href = `/employee/my-work`;
            }
          }
        ]}
      />
    </EmployeeShell>
  );
}
