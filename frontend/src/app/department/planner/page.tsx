"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DepartmentShell } from "@/components/department-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import {
  getAssignmentsByDepartment,
  updateAssignment,
  subscribe,
  type Assignment,
} from "@/lib/mock-db";
import { getCurrentUser, subscribeSession } from "@/lib/mock-session";

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

export default function PlannerPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [view, setView] = useState<"person" | "status">("person");

  const sync = useCallback(() => {
    setAssignments(getAssignmentsByDepartment(getCurrentUser().departmentId));
  }, []);

  useEffect(() => {
    sync();
    const unsubSession = subscribeSession(() => sync());
    const unsubDb = subscribe(sync);
    return () => {
      unsubSession();
      unsubDb();
    };
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
    updateAssignment(item.id, { status: plannerBadgeStatus(nextLabel) });
    sync();
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
          ↻
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
        minWidth: 320,
        flex: "0 0 320px",
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

      <div
        style={{
          display: "flex",
          gap: 24,
          overflowX: "auto",
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
