"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { DepartmentShell } from "@/components/department-shell";
import { Icon } from "@/components/core-icons";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { getAssignments } from "@/lib/api";

export type Assignment = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  ownerId: string;
  owner: string;
  departmentId: string;
  status: "new" | "waiting" | "in-progress" | "blocked" | "completed" | "approved" | "archived";
  statusLabel: string;
  dueDate: string;
  progress: number;
};

/* ── Map assignment statuses to planner-friendly labels ─────────────────────── */

function plannerLabel(status: BadgeStatus): string {
  switch (status) {
    case "new":
    case "waiting":
      return "To Do";
    case "in-progress":
      return "Doing";
    case "blocked":
      return "Blocked";
    case "completed":
    case "approved":
    case "archived":
      return "Done";
    default:
      return "To Do";
  }
}

function plannerBadgeStatus(label: string): BadgeStatus {
  switch (label) {
    case "Doing":
      return "in-progress";
    case "Blocked":
      return "blocked";
    case "Done":
      return "completed";
    default:
      return "new";
  }
}

const STATUS_COLUMNS = ["To Do", "Doing", "Blocked", "Done"] as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

export default function PlannerPage() {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [view, setView] = useState<"person" | "status">("status");

  const sync = useCallback(async () => {
    if (!token || !user) return;
    try {
      const data = await getAssignments(token);
      const allAssignments = Array.isArray(data) ? data : [];
      setAssignments(allAssignments.filter((a: any) => a.departmentId === user.departmentId));
    } catch (e) {
      console.error(e);
      setAssignments([]);
    }
  }, [token, user]);

  useEffect(() => {
    sync();
  }, [sync]);

  /* ── Derived data ─────────────────────────────────────────────────────────── */

  const owners = useMemo(
    () => Array.from(new Set(assignments.map((a) => a.owner))),
    [assignments],
  );

  const getByOwner = (owner: string) =>
    assignments.filter((a) => a.owner === owner);

  const getByStatus = (label: string) =>
    assignments.filter((a) => plannerLabel(a.status) === label);

  const metrics = useMemo(
    () => [
      { label: "Total Planned Items", value: assignments.length },
      {
        label: "Items Blocked",
        value: assignments.filter((a) => a.status === "blocked").length,
      },
      {
        label: "Items Doing",
        value: assignments.filter((a) => a.status === "in-progress").length,
      },
      {
        label: "Items Done",
        value: assignments.filter(
          (a) => a.status === "completed" || a.status === "approved",
        ).length,
      },
    ],
    [assignments],
  );

  /* ── Quick status change handler ──────────────────────────────────────────── */

  const cycleStatus = (item: Assignment) => {
    const current = plannerLabel(item.status);
    const nextLabel =
      STATUS_COLUMNS[
        (STATUS_COLUMNS.indexOf(current as (typeof STATUS_COLUMNS)[number]) + 1) %
          STATUS_COLUMNS.length
      ];
    // Backend API call here to update assignment status
    // updateAssignment(item.id, { status: plannerBadgeStatus(nextLabel) });
    // sync();
  };

  /* ── Render card ──────────────────────────────────────────────────────────── */

  const renderCard = (item: Assignment, showOwner = false) => (
    <div key={item.id} className="core-panel" style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: "var(--core-text-xs)",
            color: "var(--core-text-muted)",
          }}
        >
          {item.id}
          {showOwner && ` • ${item.owner}`}
        </span>
        <button
          type="button"
          className="core-button core-button-ghost"
          style={{ padding: "2px 8px", fontSize: "var(--core-text-xs)" }}
          title="Cycle status"
          onClick={() => cycleStatus(item)}
        >
          <Icon name="shuffle" size={14} />
        </button>
      </div>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>{item.title}</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <StatusBadge
          status={item.status}
          size="sm"
          label={plannerLabel(item.status)}
        />
        <span
          style={{
            fontSize: "var(--core-text-xs)",
            color: "var(--core-text-muted)",
          }}
        >
          {item.progress}%
        </span>
      </div>
    </div>
  );

  /* ── Column renderer ──────────────────────────────────────────────────────── */

  const renderColumn = (
    heading: string,
    items: Assignment[],
    showOwner = false,
  ) => (
    <div
      key={heading}
      className="core-panel"
      style={{
        minWidth: view === "status" ? 0 : 320,
        flex: view === "status" ? undefined : "0 0 320px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        background: "var(--core-surface-muted)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "var(--core-text-base)" }}>
          {heading}
        </h3>
        <span
          style={{
            fontSize: "var(--core-text-xs)",
            color: "var(--core-text-muted)",
          }}
        >
          {items.length} items
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => renderCard(item, showOwner))}
        {items.length === 0 && (
          <div
            style={{
              padding: 16,
              textAlign: "center",
              color: "var(--core-text-muted)",
              border: "1px dashed var(--core-border)",
              borderRadius: "var(--core-radius-md)",
            }}
          >
            No items
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DepartmentShell activePath="/department/planner">
      <PageHeader
        title="Department Planner"
        description="Visualize work distribution and plan capacity across the team."
        breadcrumbs={[
          { label: "Department", href: "/department/home" },
          { label: "Planner" },
        ]}
        primaryAction={{
          label: view === "person" ? "Group by Status" : "Group by Person",
          onClick: () => setView(view === "person" ? "status" : "person"),
        }}
      />

      <div className="core-grid-4" style={{ marginBottom: 32 }}>
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>

      <div className="core-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            <h2>Weekly Capacity Matrix</h2>
            <p>Fast planning view for who is carrying what across the week.</p>
          </div>
          <span className="core-status">Week 32</span>
        </div>
        <div className="schedule-grid" role="table" aria-label="Weekly capacity matrix">
          <div className="schedule-grid__head">Person</div>
          {WEEKDAYS.map((day) => (
            <div key={day} className="schedule-grid__head">{day}</div>
          ))}
          {owners.slice(0, 5).map((owner, ownerIndex) => {
            const ownerItems = getByOwner(owner);
            return (
              <Fragment key={owner}>
                <div key={`${owner}-person`} className="schedule-grid__person">
                  <span>{owner}</span>
                  <span className="mini-list__meta">{ownerItems.length} items</span>
                </div>
                {WEEKDAYS.map((day, dayIndex) => {
                  const item = ownerItems[(ownerIndex + dayIndex) % Math.max(1, ownerItems.length)];
                  return (
                    <div key={`${owner}-${day}`} className="schedule-grid__cell">
                      {item ? (
                        <span
                          className={`schedule-pill${item.status === "blocked" ? " schedule-pill--blocked" : item.status === "completed" ? " schedule-pill--done" : ""}`}
                          title={item.title}
                        >
                          {plannerLabel(item.status)} - {item.progress}%
                        </span>
                      ) : (
                        <span className="mini-list__meta">Open capacity</span>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: view === "status" ? "grid" : "flex",
          gridTemplateColumns: view === "status" ? "repeat(auto-fit, minmax(230px, 1fr))" : undefined,
          gap: 24,
          overflowX: view === "status" ? "visible" : "auto",
          paddingBottom: 24,
          alignItems: "flex-start",
        }}
      >
        {view === "person"
          ? owners.map((owner) =>
              renderColumn(owner, getByOwner(owner), false),
            )
          : STATUS_COLUMNS.map((label) =>
              renderColumn(label, getByStatus(label), true),
            )}
      </div>
    </DepartmentShell>
  );
}
