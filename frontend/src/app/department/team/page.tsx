"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DepartmentShell } from "@/components/department-shell";
import { DetailDrawer, DrawerField, DrawerSection } from "@/components/detail-drawer";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, type BadgeStatus } from "@/components/status-badge";
import {
  getTeamMembers,
  getAssignments,
  getBlockers,
  updateTeamMemberLoad,
  subscribe,
  type TeamMember,
  type LoadBand,
} from "@/lib/mock-db";

/* ── Load helpers ───────────────────────────────────────────────────────────── */

const loadLabels: Record<LoadBand, string> = {
  healthy: "Healthy",
  full: "Near Capacity",
  overloaded: "Over Capacity",
};

const loadStatus: Record<LoadBand, BadgeStatus> = {
  healthy: "approved",
  full: "waiting",
  overloaded: "blocked",
};

/* ── Columns ────────────────────────────────────────────────────────────────── */

const columns: DataTableColumn<TeamMember>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    minWidth: "220px",
    render: (row) => (
      <div>
        <strong>{row.name}</strong>
        <div style={{ color: "var(--core-text-subtle)", fontSize: "var(--core-text-xs)", marginTop: 3 }}>
          {row.id}
        </div>
      </div>
    ),
  },
  { key: "role", header: "Role", sortable: true, minWidth: "160px" },
  {
    key: "currentLoad",
    header: "Current Load",
    sortable: true,
    minWidth: "140px",
    render: (row) => (
      <div aria-label={`${row.currentLoad}% load, ${loadLabels[row.loadBand]}`}>
        <span style={{ fontWeight: 600 }}>{row.currentLoad}%</span>
        <div style={{ color: "var(--core-text-subtle)", fontSize: "var(--core-text-xs)", marginTop: 3 }}>
          {loadLabels[row.loadBand]}
        </div>
      </div>
    ),
  },
  { key: "availability", header: "Availability", sortable: true },
  { key: "activeAssignments", header: "Assignments", sortable: true },
  {
    key: "blockers",
    header: "Blockers",
    sortable: true,
    render: (row) => (
      <span style={{ color: row.blockers > 0 ? "var(--core-danger)" : "var(--core-text)" }}>
        {row.blockers}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" label={row.statusLabel} />,
  },
];

const filterSelectStyle = { height: 36, minWidth: 132 } as const;

export default function TeamPage() {
  /* ── Live state ───────────────────────────────────────────────────────────── */
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState("Profile");

  /* ── Filters ──────────────────────────────────────────────────────────────── */
  const [roleFilter, setRoleFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [loadFilter, setLoadFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState("2 team members need capacity review before new work is assigned.");

  /* ── Sync from mock-db ────────────────────────────────────────────────────── */
  const sync = useCallback(() => {
    const members = getTeamMembers();
    const allAssignments = getAssignments();
    const allBlockers = getBlockers();

    // Re-derive counts from live data
    const enriched = members.map((m) => {
      const myAssignments = allAssignments.filter((a) => a.owner === m.name);
      const myBlockers = allBlockers.filter((b) => b.owner === m.name);
      return {
        ...m,
        activeAssignments: myAssignments.filter(
          (a) => a.status !== "completed" && a.status !== "archived",
        ).length,
        blockers: myBlockers.length,
      };
    });

    setTeamMembers(enriched);
  }, []);

  useEffect(() => {
    sync();
    return subscribe(sync);
  }, [sync]);

  // Keep drawer in sync if the selected member's data changes
  useEffect(() => {
    if (selectedMember) {
      const fresh = teamMembers.find((m) => m.id === selectedMember.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(selectedMember)) {
        setSelectedMember(fresh);
      }
    }
  }, [teamMembers, selectedMember]);

  /* ── Derived data ─────────────────────────────────────────────────────────── */
  const roles = useMemo(
    () => Array.from(new Set(teamMembers.map((m) => m.role))),
    [teamMembers],
  );

  const skills = useMemo(
    () => Array.from(new Set(teamMembers.flatMap((m) => m.skills))).sort(),
    [teamMembers],
  );

  const filteredMembers = useMemo(
    () =>
      teamMembers.filter((member) => {
        const matchesRole = roleFilter === "all" || member.role === roleFilter;
        const matchesSkill = skillFilter === "all" || member.skills.includes(skillFilter);
        const matchesAvailability =
          availabilityFilter === "all" || member.availability === availabilityFilter;
        const matchesLoad = loadFilter === "all" || member.loadBand === loadFilter;
        const matchesStatus = statusFilter === "all" || member.statusLabel === statusFilter;
        return matchesRole && matchesSkill && matchesAvailability && matchesLoad && matchesStatus;
      }),
    [teamMembers, availabilityFilter, loadFilter, roleFilter, skillFilter, statusFilter],
  );

  const averageLoad = teamMembers.length
    ? Math.round(teamMembers.reduce((sum, m) => sum + m.currentLoad, 0) / teamMembers.length)
    : 0;

  /* ── Drawer actions ───────────────────────────────────────────────────────── */

  const handleAdjustLoad = (memberId: string, delta: number) => {
    updateTeamMemberLoad(memberId, delta);
    sync();
    setNotice(`Load adjusted by ${delta > 0 ? "+" : ""}${delta}% for team member.`);
  };

  return (
    <DepartmentShell activePath="/department/team">
      <PageHeader
        title="Team"
        description="Review department capacity, skills, availability, and blockers by person."
        breadcrumbs={[
          { label: "Department", href: "/department/home" },
          { label: "Team" },
        ]}
        meta={<span>Engineering scope</span>}
        primaryAction={{
          label: "Export Team List",
          onClick: () => setNotice("Team export is ready for permission-gated API wiring."),
        }}
        secondaryActions={[
          {
            label: "Capacity Risks",
            variant: "secondary",
            onClick: () => {
              setLoadFilter("overloaded");
              setNotice("Showing over-capacity team members.");
            },
          },
        ]}
      />

      <div className="alert-strip alert-strip--info" role="status">
        <span>{notice}</span>
      </div>

      <div className="core-grid-4" style={{ marginBottom: 24 }}>
        <MetricCard label="Team Members" value={teamMembers.length} />
        <MetricCard label="Average Load" value={`${averageLoad}%`} />
        <MetricCard
          label="Capacity Risks"
          value={teamMembers.filter((m) => m.loadBand !== "healthy").length}
        />
        <MetricCard
          label="Open Blockers"
          value={teamMembers.reduce((sum, m) => sum + m.blockers, 0)}
        />
      </div>

      <DataTable
        title="Department Team"
        columns={columns}
        rows={filteredMembers}
        rowKey={(row) => row.id}
        filtersSlot={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <label className="form-label">
              Role
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ ...filterSelectStyle, minWidth: 170 }}
              >
                <option value="all">All</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Skill
              <select
                className="form-select"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                style={{ ...filterSelectStyle, minWidth: 170 }}
              >
                <option value="all">All</option>
                {skills.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Availability
              <select
                className="form-select"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                <option value="Available">Available</option>
                <option value="Focused">Focused</option>
                <option value="Limited">Limited</option>
                <option value="Out">Out</option>
              </select>
            </label>
            <label className="form-label">
              Load
              <select
                className="form-select"
                value={loadFilter}
                onChange={(e) => setLoadFilter(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                <option value="healthy">Healthy</option>
                <option value="full">Near capacity</option>
                <option value="overloaded">Over capacity</option>
              </select>
            </label>
            <label className="form-label">
              Status
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                <option value="Active">Active</option>
                <option value="Available">Available</option>
                <option value="Blocked">Blocked</option>
                <option value="Waiting">Waiting</option>
                <option value="Out Today">Out today</option>
              </select>
            </label>
          </div>
        }
        rowActions={(row) => [
          {
            label: "Open",
            onClick: () => {
              setSelectedMember(row);
              setActiveTab("Profile");
            },
          },
          {
            label: "Workload",
            onClick: () => {
              setSelectedMember(row);
              setActiveTab("Workload");
            },
          },
        ]}
        emptyState={{
          title: "No team members match these filters",
          body: "Adjust the filters to review the rest of the department.",
        }}
      />

      <DetailDrawer
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        size="wide"
        title={selectedMember?.name ?? "Team Member"}
        subtitle={selectedMember?.role}
        status={
          selectedMember ? (
            <StatusBadge status={loadStatus[selectedMember.loadBand]} label={loadLabels[selectedMember.loadBand]} />
          ) : undefined
        }
        tabs={["Profile", "Workload", "Skills"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        footerRight={
          selectedMember && (
            <>
              <button
                type="button"
                className="core-button"
                onClick={() => {
                  setLoadFilter(selectedMember.loadBand);
                  setNotice(`Filtering team by ${loadLabels[selectedMember.loadBand].toLowerCase()} load.`);
                }}
              >
                Filter Similar Load
              </button>
              <button
                type="button"
                className="core-button core-button-primary"
                onClick={() => setNotice(`Capacity review queued for ${selectedMember.name}.`)}
              >
                Queue Review
              </button>
            </>
          )
        }
      >
        {selectedMember && activeTab === "Profile" && (
          <>
            <DrawerSection title="Employee Profile">
              <DrawerField label="Employee ID" value={selectedMember.id} />
              <DrawerField label="Manager" value={selectedMember.manager} />
              <DrawerField label="Availability" value={selectedMember.availability} />
              <DrawerField label="Location" value={selectedMember.location} />
            </DrawerSection>
            <DrawerSection title="Capacity Warning">
              <DrawerField label="Current Load" value={`${selectedMember.currentLoad}%`} />
              <DrawerField label="Load Band" value={loadLabels[selectedMember.loadBand]} />
              <DrawerField label="Active Assignments" value={selectedMember.activeAssignments} />
              <DrawerField label="Blockers" value={selectedMember.blockers} />
            </DrawerSection>
          </>
        )}

        {selectedMember && activeTab === "Workload" && (
          <DrawerSection title="Current Workload">
            <DrawerField label="Summary" value={selectedMember.workloadSummary} />
            <DrawerField label="Next Delivery" value={selectedMember.nextDelivery} />
            <DrawerField
              label="Capacity Guidance"
              value={
                selectedMember.loadBand === "overloaded"
                  ? "Rebalance work before assigning anything new."
                  : selectedMember.loadBand === "full"
                    ? "Confirm priority before adding work."
                    : "Safe to consider for one additional assignment."
              }
            />
            <DrawerField
              label="Blocker Visibility"
              value={
                selectedMember.blockers > 0
                  ? `${selectedMember.blockers} blockers need owner follow-up.`
                  : "No current blockers."
              }
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                className="core-button core-button-ghost"
                onClick={() => handleAdjustLoad(selectedMember.id, -10)}
              >
                − Reduce Load 10%
              </button>
              <button
                type="button"
                className="core-button core-button-ghost"
                onClick={() => handleAdjustLoad(selectedMember.id, 10)}
              >
                + Increase Load 10%
              </button>
            </div>
          </DrawerSection>
        )}

        {selectedMember && activeTab === "Skills" && (
          <DrawerSection title="Skills">
            <DrawerField label="Primary Skills" value={selectedMember.skills.join(", ")} />
            <DrawerField label="Suggested Use" value="Match assignment needs to skills before rebalancing." />
          </DrawerSection>
        )}
      </DetailDrawer>
    </DepartmentShell>
  );
}
