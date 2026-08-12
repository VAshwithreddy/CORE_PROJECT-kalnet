"use client";

import { useEffect, useState, useMemo } from "react";
import { EmployeeShell } from "@/components/employee-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getEmployeeDashboard, getAlerts, getDigests, getProjects } from "@/lib/api";

type AssignmentRow = {
  id: string;
  project: string;
  title: string;
  status: string;
  dueDate: string;
  allocationPercent: number;
};

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
        const [dashRes, alertsRes, digestsRes, projectsRes] = await Promise.all([
          getEmployeeDashboard(token),
          getAlerts(token).catch(() => []), // fallback if alerts fail or 403
          getDigests(token).catch(() => []),
          getProjects(token).catch(() => []),
        ]);
        setDashboardData(dashRes);
        setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
        setDigests(Array.isArray(digestsRes) ? digestsRes : []);
        setProjects(Array.isArray(projectsRes) ? projectsRes : []);
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
        <div className="core-panel">
          <h2>Personal Calendar</h2>
          <p>August 2026</p>
          <div className="calendar-mini" aria-label="August 2026 mini calendar">
            {Array.from({ length: 14 }, (_, index) => index + 1).map((day) => (
              <span key={day} className={day === 7 ? "active" : ""}>{day}</span>
            ))}
          </div>
        </div>

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
          <p>Your current work pulse for the day.</p>
          <div style={{ margin: "18px 0", fontSize: 34, fontWeight: 800, color: "var(--core-text)" }}>
            {activeAssignmentsCount}
          </div>
          <p style={{ marginBottom: 16 }}>active assignments remain open.</p>
          <button
            type="button"
            className="core-button core-button-primary"
            onClick={() => setNotice("Focus block started. Your queue is filtered around urgent work.")}
          >
            Start Focus Block
          </button>
        </div>
      </div>

      {/* Staleness Alerts & Weekly Digests */}
      <div className="workbench-grid workbench-grid--two" style={{ marginBottom: 32 }}>
        <div className="core-panel">
          <h2>Staleness Alerts</h2>
          <p>Assignments without recent updates.</p>
          {alerts.length > 0 ? (
            <ul className="mini-list" style={{ marginTop: 16 }}>
              {alerts.map((alert: any) => (
                <li key={alert.id} className="mini-list__item">
                  <span>
                    <span className="mini-list__title">{alert.assignment_id}</span>
                    <span className="mini-list__meta">{alert.days_since_update} days since last update</span>
                  </span>
                  <StatusBadge status="blocked" size="sm" />
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: 16, color: "var(--core-text-muted)" }}>No staleness alerts.</p>
          )}
        </div>
        <div className="core-panel">
          <h2>Weekly Digests</h2>
          <p>Your recent weekly performance summaries.</p>
          {digests.length > 0 ? (
            <ul className="mini-list" style={{ marginTop: 16 }}>
              {digests.map((digest: any) => (
                <li key={digest.id} className="mini-list__item">
                  <span>
                    <span className="mini-list__title">Week of {new Date(digest.generated_at).toLocaleDateString()}</span>
                    <span className="mini-list__meta">{digest.summary}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: 16, color: "var(--core-text-muted)" }}>No digests available yet.</p>
          )}
        </div>
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
