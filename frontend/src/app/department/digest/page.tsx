"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DepartmentShell } from "@/components/department-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import {
  getAssignmentsByDepartment,
  getBlockersByDepartment,
  getProjectsByDepartment,
  getTeamMembersByDepartment,
  subscribe,
} from "@/lib/mock-db";
import { getCurrentUser, subscribeSession } from "@/lib/mock-session";

interface DigestItem {
  id: string;
  text: string;
  owner: string;
  tag?: string;
  status?: "success" | "warning" | "danger";
}

interface DigestSection {
  title: string;
  items: DigestItem[];
}

export default function DigestPage() {
  const [week] = useState("Week of Oct 16");
  const [notice, setNotice] = useState("");

  /* ── Sync from mock-db ────────────────────────────────────────────────────── */
  const [, setTick] = useState(0);
  const sync = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    sync();
    const unsubSession = subscribeSession(() => sync());
    const unsubDb = subscribe(sync);
    return () => {
      unsubSession();
      unsubDb();
    };
  }, [sync]);

  /* ── Derive live digest sections ──────────────────────────────────────────── */
  const deptId = getCurrentUser().departmentId;
  const assignments = getAssignmentsByDepartment(deptId);
  const blockers = getBlockersByDepartment(deptId);
  const projects = getProjectsByDepartment(deptId);
  const team = getTeamMembersByDepartment(deptId);

  const metrics = useMemo(() => {
    const completedCount = assignments.filter(
      (a) => a.status === "completed" || a.status === "approved",
    ).length;
    const blockerCount = blockers.length;
    const atRiskProjects = projects.filter(
      (p) => p.health === "At Risk" || p.health === "Off Track",
    ).length;
    const totalItems = assignments.length;
    const velocity = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    return [
      {
        label: "Velocity",
        value: `${velocity}%`,
        change: velocity > 50 ? +4 : -2,
        trend: velocity > 50 ? ("up" as const) : ("down" as const),
        changePeriod: "vs last week",
      },
      {
        label: "Completed Items",
        value: completedCount,
        change: completedCount,
        trend: "up" as const,
        changePeriod: "this period",
      },
      {
        label: "Active Blockers",
        value: blockerCount,
        change: blockerCount > 2 ? +1 : -1,
        trend: blockerCount > 2 ? ("up" as const) : ("down" as const),
        changePeriod: "vs last week",
      },
      {
        label: "At-Risk Projects",
        value: atRiskProjects,
        change: atRiskProjects,
        trend: atRiskProjects > 0 ? ("up" as const) : ("down" as const),
        changePeriod: "current",
      },
    ];
  }, [assignments, blockers, projects]);

  const sections: DigestSection[] = useMemo(() => {
    // Accomplishments: completed/approved assignments
    const accomplishments: DigestItem[] = assignments
      .filter((a) => a.status === "completed" || a.status === "approved")
      .map((a) => ({
        id: a.id,
        text: a.title,
        owner: a.owner,
        status: "success" as const,
      }));

    // Risks & Blockers: active blocker items
    const risks: DigestItem[] = blockers.map((b) => ({
      id: b.id,
      text: `${b.title} — ${b.reason}`,
      owner: b.owner,
      tag: b.severity === "High" ? "High Risk" : "Blocked",
      status: b.severity === "High" ? ("danger" as const) : ("warning" as const),
    }));

    // Capacity concerns: overloaded team members
    const capacityConcerns: DigestItem[] = team
      .filter((m) => m.loadBand === "overloaded")
      .map((m) => ({
        id: m.id,
        text: `${m.name} is at ${m.currentLoad}% capacity — ${m.workloadSummary}`,
        owner: m.manager,
        tag: "Over Capacity",
        status: "danger" as const,
      }));

    // Project milestones: active projects with upcoming milestones
    const milestones: DigestItem[] = projects
      .filter((p) => p.status === "in-progress" || p.status === "waiting")
      .map((p) => ({
        id: p.id,
        text: `${p.name} — next milestone: ${p.nextMilestone} (${p.progress}% complete)`,
        owner: p.owner,
        tag: p.health,
        status:
          p.health === "Off Track"
            ? ("danger" as const)
            : p.health === "At Risk"
              ? ("warning" as const)
              : ("success" as const),
      }));

    return [
      { title: "Key Accomplishments", items: accomplishments },
      { title: "Active Risks & Blockers", items: risks },
      { title: "Capacity Concerns", items: capacityConcerns },
      { title: "Project Milestones", items: milestones },
    ];
  }, [assignments, blockers, team, projects]);

  return (
    <DepartmentShell activePath="/department/digest">
      <PageHeader
        title="Weekly Digest"
        description="A summary of department progress, risks, and required decisions."
        breadcrumbs={[
          { label: "Department", href: "/department/home" },
          { label: "Digest" },
        ]}
        primaryAction={{
          label: "Export PDF",
          onClick: () => setNotice("PDF export is ready for permission-gated API wiring."),
        }}
        secondaryActions={[
          {
            label: "Refresh Data",
            variant: "ghost",
            onClick: () => {
              sync();
              setNotice("Digest refreshed from latest data.");
            },
          },
        ]}
      />

      {notice && (
        <div className="alert-strip alert-strip--info" role="status" style={{ marginBottom: 16 }}>
          <span>{notice}</span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: "var(--core-text-xl)", margin: 0 }}>{week}</h2>
        <span style={{ color: "var(--core-text-muted)" }}>
          Last updated: Now (live from mock-db)
        </span>
      </div>

      <div className="core-grid-4" style={{ marginBottom: 32 }}>
        {metrics.map((m) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            change={m.change}
            trend={m.trend}
            changePeriod={m.changePeriod}
          />
        ))}
      </div>

      <div
        className="core-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}
      >
        {sections.map((section) => (
          <div
            key={section.title}
            className="core-panel"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <h3
              style={{
                fontSize: "var(--core-text-lg)",
                margin: 0,
                borderBottom: "1px solid var(--core-border)",
                paddingBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {section.title}
              <span
                style={{
                  fontSize: "var(--core-text-xs)",
                  color: "var(--core-text-muted)",
                  fontWeight: 400,
                }}
              >
                {section.items.length} items
              </span>
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "8px 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontWeight: 500, lineHeight: 1.4 }}>{item.text}</span>
                    {item.tag && (
                      <span style={{ whiteSpace: "nowrap" }}>
                        <StatusBadge
                          status={
                            item.status === "danger"
                              ? "blocked"
                              : item.status === "warning"
                                ? "waiting"
                                : "approved"
                          }
                          label={item.tag}
                          size="sm"
                        />
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      color: "var(--core-text-muted)",
                      fontSize: "var(--core-text-sm)",
                    }}
                  >
                    Owner: {item.owner}
                  </div>
                </div>
              ))}
              {section.items.length === 0 && (
                <div style={{ color: "var(--core-text-muted)", fontStyle: "italic" }}>
                  Nothing to report.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DepartmentShell>
  );
}
