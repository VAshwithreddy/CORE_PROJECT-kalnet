"use client";

import { useEffect, useState, useMemo } from "react";
import { EmployeeShell } from "@/components/employee-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { getAssignmentsByOwner, getNotifications, resetDB, subscribe, type Assignment } from "@/lib/mock-db";
import { getCurrentUser, subscribeSession, type CoreUser } from "@/lib/mock-session";

const columns: DataTableColumn<Assignment>[] = [
  { key: "id", header: "ID", sortable: true },
  { key: "title", header: "Title", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" />
  },
  { key: "priority", header: "Priority", sortable: true },
  { key: "dueDate", header: "Due Date", sortable: true },
];

export default function EmployeeHomePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<CoreUser>(getCurrentUser());
  const [mounted, setMounted] = useState(false);
  const [notice, setNotice] = useState("");
  const activeAssignments = assignments.filter((assignment) => assignment.status === "in-progress").length;
  const waitingAssignments = assignments.filter((assignment) => assignment.status === "waiting").length;
  const completedAssignments = assignments.filter((assignment) => assignment.status === "completed").length;

  useEffect(() => {
    setMounted(true);
    setAssignments(getAssignmentsByOwner(getCurrentUser().id));
    setUnreadCount(getNotifications().filter(n => !n.isRead && (n.recipientId === getCurrentUser().id || !n.recipientId)).length);

    const unsubSession = subscribeSession((user) => {
      setCurrentUser(user);
      setAssignments(getAssignmentsByOwner(user.id));
      setUnreadCount(getNotifications().filter(n => !n.isRead && (n.recipientId === user.id || !n.recipientId)).length);
    });

    const unsubDb = subscribe(() => {
      setAssignments(getAssignmentsByOwner(getCurrentUser().id));
      setUnreadCount(getNotifications().filter(n => !n.isRead && (n.recipientId === getCurrentUser().id || !n.recipientId)).length);
    });

    return () => {
      unsubSession();
      unsubDb();
    };
  }, []);

  const metrics = useMemo(() => {
    if (!mounted) return [];
    return [
      { label: "Active Assignments", value: assignments.filter(a => a.status === "in-progress").length },
      { label: "Waiting on Others", value: assignments.filter(a => a.status === "waiting").length },
      { label: "Completed Assignments", value: assignments.filter(a => a.status === "completed").length },
      { label: "Unread Alerts", value: unreadCount },
    ];
  }, [assignments, unreadCount, mounted]);

  const handleReset = () => {
    resetDB();
    alert("Demo database has been reset to defaults.");
  };

  if (!mounted) {
    return (
      <EmployeeShell activePath="/employee/home">
        <PageHeader
          title={`Welcome back, ${currentUser.name.split(' ')[0]}!`}
          description="Here is an overview of your current work."
          primaryAction={{ label: "New Request", href: "/employee/requests?new=true" }}
        />
        <div style={{ padding: 40, textAlign: "center", color: "var(--core-text-subtle)" }}>
          Loading dashboard...
        </div>
      </EmployeeShell>
    );
  }

  return (
    <EmployeeShell activePath="/employee/home">
      <PageHeader
        title={`Welcome back, ${currentUser.name.split(' ')[0]}!`}
        description="Here is an overview of your current work."
        meta={
          <>
            <span>{activeAssignments} active assignments</span>
            <span>{waitingAssignments} waiting</span>
            <span>{completedAssignments} completed</span>
            <span>{unreadCount} unread alerts</span>
          </>
        }
        primaryAction={{ label: "New Request", href: "/employee/requests?new=true" }}
        secondaryActions={[
          { label: "Reset Demo Data", onClick: handleReset, variant: "ghost" }
        ]}
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
              <h2>Today Focus Queue</h2>
              <p>Blocked and due-soon assignments surfaced first.</p>
            </div>
            <a className="core-button core-button-sm" href="/employee/my-work">Open Work</a>
          </div>
          <ul className="mini-list">
            {assignments
              .filter((assignment) => assignment.status === "blocked" || assignment.dueBucket === "today" || assignment.dueBucket === "week")
              .slice(0, 4)
              .map((assignment) => (
                <li key={assignment.id} className="mini-list__item">
                  <span>
                    <span className="mini-list__title">{assignment.title}</span>
                    <span className="mini-list__meta">{assignment.project} - {assignment.dueDate}</span>
                  </span>
                  <StatusBadge status={assignment.status} size="sm" />
                </li>
              ))}
          </ul>
        </div>

        <div className="core-panel">
          <h2>Focus Session</h2>
          <p>Your current work pulse for the day.</p>
          <div style={{ margin: "18px 0", fontSize: 34, fontWeight: 800, color: "var(--core-text)" }}>
            {assignments.filter((assignment) => assignment.status !== "completed").length}
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
        title="My Active Assignments"
        columns={columns}
        rows={assignments.filter(a => a.status !== "completed")}
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
