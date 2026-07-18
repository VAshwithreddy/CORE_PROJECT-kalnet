"use client";

import { useEffect, useState, useMemo } from "react";
import { ExecutiveShell } from "@/components/executive-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";
import { getDepartmentSummaries, subscribe, type DepartmentSummary } from "@/lib/mock-db";

// Custom SVGs
const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const WarningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function ExecutiveDepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDepartments(getDepartmentSummaries());
    return subscribe(() => setDepartments(getDepartmentSummaries()));
  }, []);

  const filteredDepartments = useMemo(
    () =>
      departments.filter((dept) =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.head.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [departments, searchQuery]
  );

  const topPerforming = useMemo(
    () => departments.find((d) => d.health === "Healthy") ?? departments[0],
    [departments]
  );

  const mostAtRisk = useMemo(
    () =>
      [...departments].sort((a, b) => b.blockerCount - a.blockerCount)[0],
    [departments]
  );

  const totalHeadcount = useMemo(
    () => departments.reduce((sum, d) => sum + d.headcount, 0),
    [departments]
  );

  const totalBlockers = useMemo(
    () => departments.reduce((sum, d) => sum + d.blockerCount, 0),
    [departments]
  );

  const columns: DataTableColumn<DepartmentSummary>[] = [
    { key: "name", header: "Department", sortable: true },
    { key: "head", header: "Department Head", sortable: true },
    { key: "headcount", header: "Headcount", sortable: true },
    { key: "activeProjects", header: "Active Projects", sortable: true },
    { key: "blockerCount", header: "Blockers", sortable: true },
    {
      key: "atRiskCount",
      header: "At-Risk Projects",
      sortable: true,
      render: (row) => (
        <span style={{ color: row.atRiskCount > 0 ? "var(--core-danger)" : "var(--core-text)", fontWeight: 600 }}>
          {row.atRiskCount}
        </span>
      ),
    },
    {
      key: "health",
      header: "Health Status",
      sortable: true,
      render: (row) => {
        let color = "var(--core-success)";
        let bg = "var(--core-success-soft)";
        let icon = <InfoIcon />;

        if (row.health === "Attention") {
          color = "var(--core-warning)";
          bg = "var(--core-warning-soft)";
          icon = <WarningIcon />;
        } else if (row.health === "Critical") {
          color = "var(--core-danger)";
          bg = "var(--core-danger-soft)";
          icon = <WarningIcon />;
        }

        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 8px",
            borderRadius: "var(--core-radius-sm)",
            backgroundColor: bg,
            color,
            fontSize: "12px",
            fontWeight: 600
          }}>
            {icon}
            {row.health}
          </span>
        );
      }
    }
  ];

  if (!mounted) return null;

  return (
    <ExecutiveShell activePath="/executive/departments">
      <PageHeader
        title="Departmental Performance"
        description="Cross-departmental comparisons, resources, and deliverable health — computed live from CORE data."
      />

      {/* Live KPI Summary Cards */}
      <div className="core-grid" style={{ marginBottom: 32 }}>
        <MetricCard
          label="Top Performing Department"
          value={topPerforming?.name ?? "—"}
        >
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-text-muted)" }}>
            {topPerforming
              ? `${topPerforming.activeProjects} active projects, ${topPerforming.blockerCount} blockers.`
              : "No data yet."}
          </div>
        </MetricCard>
        <MetricCard
          label="Highest Blocker Count"
          value={mostAtRisk?.name ?? "—"}
        >
          <div style={{ marginTop: 8, fontSize: "13px", color: mostAtRisk?.blockerCount > 1 ? "var(--core-danger)" : "var(--core-text-muted)" }}>
            {mostAtRisk ? `${mostAtRisk.blockerCount} active blockers, ${mostAtRisk.atRiskCount} at-risk projects.` : "—"}
          </div>
        </MetricCard>
        <MetricCard label="Total Headcount" value={totalHeadcount}>
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-text-muted)" }}>
            Across {departments.length} departments. {totalBlockers} total active blockers.
          </div>
        </MetricCard>
      </div>

      {/* Live Active Projects & Blockers Bar Chart */}
      <div className="core-panel" style={{ marginBottom: 32 }}>
        <h2>Active Projects &amp; Blockers — Department Comparison</h2>
        <p style={{ fontSize: "13px", marginBottom: 20, color: "var(--core-text-muted)" }}>
          Live-computed from CORE project and blocker data.
        </p>
        <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 32, paddingLeft: 40, borderBottom: "1px solid var(--core-border)", paddingBottom: 16 }}>
          {departments.map((dept) => (
            <div key={dept.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130 }}>
                <div
                  style={{
                    width: 20,
                    height: `${Math.min(dept.activeProjects * 14, 130)}px`,
                    background: "var(--core-executive)",
                    borderRadius: "3px 3px 0 0",
                  }}
                  title={`Active Projects: ${dept.activeProjects}`}
                />
                <div
                  style={{
                    width: 20,
                    height: `${Math.min(dept.blockerCount * 20, 130)}px`,
                    background: "var(--core-danger)",
                    borderRadius: "3px 3px 0 0",
                  }}
                  title={`Blockers: ${dept.blockerCount}`}
                />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--core-text-muted)", textAlign: "center" }}>
                {dept.name}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center", fontSize: "11px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, display: "inline-block", background: "var(--core-executive)", borderRadius: 2 }} /> Active Projects
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, display: "inline-block", background: "var(--core-danger)", borderRadius: 2 }} /> Blockers
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--core-text-subtle)", display: "flex" }}>
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              borderRadius: "var(--core-radius-sm)",
              border: "1px solid var(--core-border)",
              background: "var(--core-surface)",
              fontSize: "14px",
              color: "var(--core-text)"
            }}
          />
        </div>
      </div>

      {/* Live Data Table */}
      <DataTable
        columns={columns}
        rows={filteredDepartments}
        rowKey={(row) => row.id}
        rowActions={(row) => [
          { label: "Inspect Department", onClick: (row) => setSelectedDept(row) }
        ]}
      />

      {/* Inspect Detail Drawer */}
      <DetailDrawer
        isOpen={selectedDept !== null}
        onClose={() => setSelectedDept(null)}
        title={selectedDept?.name ?? ""}
        subtitle={`Department Head: ${selectedDept?.head ?? "—"}`}
        status={
          selectedDept ? (
            <span style={{
              padding: "4px 8px",
              borderRadius: "var(--core-radius-sm)",
              backgroundColor: selectedDept.health === "Healthy" ? "var(--core-success-soft)" : selectedDept.health === "Attention" ? "var(--core-warning-soft)" : "var(--core-danger-soft)",
              color: selectedDept.health === "Healthy" ? "var(--core-success)" : selectedDept.health === "Attention" ? "var(--core-warning)" : "var(--core-danger)",
              fontSize: "12px",
              fontWeight: 600
            }}>
              {selectedDept.health}
            </span>
          ) : undefined
        }
      >
        {selectedDept && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <DrawerSection title="Overview">
              <DrawerField label="Department Head" value={selectedDept.head} />
              <DrawerField label="Headcount" value={selectedDept.headcount.toString()} />
              <DrawerField label="Active Projects" value={selectedDept.activeProjects.toString()} />
              <DrawerField label="Completed Projects" value={selectedDept.completedProjects.toString()} />
              <DrawerField label="Active Blockers" value={selectedDept.blockerCount.toString()} />
              <DrawerField label="At-Risk Projects" value={selectedDept.atRiskCount.toString()} />
              <DrawerField label="Overloaded Members" value={selectedDept.overloadedMembers.toString()} />
            </DrawerSection>

            {selectedDept.projects.length > 0 && (
              <DrawerSection title="Active Projects">
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                  {selectedDept.projects.map((proj, idx) => (
                    <div key={idx} style={{ padding: 10, background: "var(--core-surface-muted)", borderRadius: "var(--core-radius-sm)", fontSize: "13px", fontWeight: 500 }}>
                      {proj}
                    </div>
                  ))}
                </div>
              </DrawerSection>
            )}
          </div>
        )}
      </DetailDrawer>
    </ExecutiveShell>
  );
}
