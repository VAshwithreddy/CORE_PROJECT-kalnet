"use client";

import { useState } from "react";
import { ExecutiveShell } from "@/components/executive-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";

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

interface Department {
  id: string;
  name: string;
  unit: string;
  head: string;
  headcount: number;
  activeProjects: number;
  blockers: number;
  budgetVariance: string;
  budgetVarianceNum: number; // positive is over, negative is under
  completionRate: string;
  completionRateNum: number;
  health: "Healthy" | "Attention" | "Critical";
  projects: string[];
}

export default function ExecutiveDepartmentsPage() {
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("All");

  const departments: Department[] = [
    {
      id: "dept-eng",
      name: "Engineering",
      unit: "Product Development",
      head: "David L.",
      headcount: 45,
      activeProjects: 12,
      blockers: 2,
      budgetVariance: "-1.2%",
      budgetVarianceNum: -1.2,
      completionRate: "84%",
      completionRateNum: 84,
      health: "Healthy",
      projects: ["Cloud Migration", "Cost Reduction", "API Gateway v2", "Database Sharding"]
    },
    {
      id: "dept-ai",
      name: "AI/ML Research",
      unit: "Product Development",
      head: "Sarah W.",
      headcount: 24,
      activeProjects: 8,
      blockers: 4,
      budgetVariance: "+4.5%",
      budgetVarianceNum: 4.5,
      completionRate: "72%",
      completionRateNum: 72,
      health: "Attention",
      projects: ["AI Integration", "Agent Engine Core", "Semantic Search Optimization"]
    },
    {
      id: "dept-prod",
      name: "Product Management",
      unit: "Product Development",
      head: "Michael K.",
      headcount: 12,
      activeProjects: 6,
      blockers: 1,
      budgetVariance: "-0.5%",
      budgetVarianceNum: -0.5,
      completionRate: "90%",
      completionRateNum: 90,
      health: "Healthy",
      projects: ["EMEA Strategy", "Intake Workflow Engine", "Role Matrix Planner"]
    },
    {
      id: "dept-design",
      name: "Design & UX",
      unit: "Product Development",
      head: "Elena R.",
      headcount: 18,
      activeProjects: 9,
      blockers: 0,
      budgetVariance: "+1.0%",
      budgetVarianceNum: 1.0,
      completionRate: "88%",
      completionRateNum: 88,
      health: "Healthy",
      projects: ["Design Tokens Migration", "Accessibility Audit Phase 1"]
    },
    {
      id: "dept-sales",
      name: "Sales & Marketing",
      unit: "Go-To-Market",
      head: "Jessica T.",
      headcount: 32,
      activeProjects: 14,
      blockers: 3,
      budgetVariance: "-2.0%",
      budgetVarianceNum: -2.0,
      completionRate: "81%",
      completionRateNum: 81,
      health: "Attention",
      projects: ["EMEA Launch", "Enterprise Beta Program", "Customer Success System"]
    },
    {
      id: "dept-ops",
      name: "IT Operations",
      unit: "Go-To-Market",
      head: "Marcus V.",
      headcount: 15,
      activeProjects: 5,
      blockers: 3,
      budgetVariance: "+7.2%",
      budgetVarianceNum: 7.2,
      completionRate: "60%",
      completionRateNum: 60,
      health: "Critical",
      projects: ["SLA Monitoring Setup", "Hardware Upgrade", "Workspace Setup Automation"]
    }
  ];

  // Filtering
  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dept.head.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnit = unitFilter === "All" || dept.unit === unitFilter;
    return matchesSearch && matchesUnit;
  });

  const columns: DataTableColumn<Department>[] = [
    { key: "name", header: "Department", sortable: true },
    { key: "unit", header: "Business Unit", sortable: true },
    { key: "head", header: "Department Head", sortable: true },
    { key: "headcount", header: "Headcount", sortable: true },
    { key: "activeProjects", header: "Active Projects", sortable: true },
    { key: "blockers", header: "Blockers", sortable: true },
    {
      key: "budgetVariance",
      header: "Budget Variance",
      sortable: true,
      render: (row) => {
        const isOver = row.budgetVarianceNum > 0;
        const color = isOver ? "var(--core-warning)" : "var(--core-success)";
        return <span style={{ color, fontWeight: 600 }}>{row.budgetVariance}</span>;
      }
    },
    {
      key: "completionRate",
      header: "Project Completion",
      sortable: true,
      render: (row) => {
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{row.completionRate}</span>
            <div style={{ flex: 1, minWidth: 60, height: 6, background: "var(--core-surface-muted)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: row.completionRate, height: "100%", background: "var(--core-executive)" }} />
            </div>
          </div>
        );
      }
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

  return (
    <ExecutiveShell activePath="/executive/departments">
      <PageHeader
        title="Departmental Performance"
        description="Cross-departmental comparisons, budget allocations, resources, and deliverable health."
      />

      {/* Grid of Department mini cards */}
      <div className="core-grid" style={{ marginBottom: 32 }}>
        <MetricCard label="Top Performing Department" value="Product Management">
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-text-muted)" }}>
            90% milestone completion rate with -0.5% budget variance.
          </div>
        </MetricCard>
        <MetricCard label="Highest Operational Risk" value="IT Operations">
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-danger)" }}>
            3 critical blockers, 60% completion rate. Attention required.
          </div>
        </MetricCard>
        <MetricCard label="Headcount & Budget Allocation" value="146 Members">
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-text-muted)" }}>
            Aggregate budget variance is in-line (+0.4% organization-wide).
          </div>
        </MetricCard>
      </div>

      {/* SVG Comparative Bar Chart */}
      <div className="core-panel" style={{ marginBottom: 32 }}>
        <h2>Active Projects & Blockers Comparison</h2>
        <p style={{ fontSize: "13px", marginBottom: 20 }}>Visualizing project load against active blocking issues per department.</p>
        <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 32, paddingLeft: 40, borderBottom: "1px solid var(--core-border)", paddingBottom: 16 }}>
          {departments.map((dept) => (
            <div key={dept.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130 }}>
                {/* Active Projects Bar */}
                <div
                  style={{
                    width: 20,
                    height: `${dept.activeProjects * 8}px`,
                    background: "var(--core-executive)",
                    borderRadius: "3px 3px 0 0",
                    position: "relative"
                  }}
                  title={`Active Projects: ${dept.activeProjects}`}
                />
                {/* Blockers Bar */}
                <div
                  style={{
                    width: 20,
                    height: `${dept.blockers * 12}px`,
                    background: "var(--core-danger)",
                    borderRadius: "3px 3px 0 0",
                    position: "relative"
                  }}
                  title={`Blockers: ${dept.blockers}`}
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

      {/* Filter and Table Toolbar */}
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
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "var(--core-radius-sm)",
            border: "1px solid var(--core-border)",
            background: "var(--core-surface)",
            fontWeight: 500,
            fontSize: "14px",
            color: "var(--core-text)"
          }}
        >
          <option value="All">All Business Units</option>
          <option value="Product Development">Product Development</option>
          <option value="Go-To-Market">Go-To-Market</option>
        </select>
      </div>

      {/* Main comparison table */}
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
        subtitle={selectedDept?.unit ?? ""}
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
              <DrawerField label="Budget Variance" value={selectedDept.budgetVariance} />
              <DrawerField label="Milestone Rate" value={selectedDept.completionRate} />
            </DrawerSection>

            <DrawerSection title="Active Projects">
              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                {selectedDept.projects.map((proj, idx) => (
                  <div key={idx} style={{ padding: 10, background: "var(--core-surface-muted)", borderRadius: "var(--core-radius-sm)", fontSize: "13px", fontWeight: 500 }}>
                    {proj}
                  </div>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection title="Team Resource Workload">
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "12px", fontWeight: 500 }}>
                  <span>Resource Utilization</span>
                  <span style={{ color: selectedDept.blockers > 2 ? "var(--core-danger)" : "var(--core-text)" }}>
                    {selectedDept.blockers > 2 ? "94% (Overload)" : "78% (Optimal)"}
                  </span>
                </div>
                <div style={{ width: "100%", height: 8, background: "var(--core-border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    width: selectedDept.blockers > 2 ? "94%" : "78%",
                    height: "100%",
                    background: selectedDept.blockers > 2 ? "var(--core-danger)" : "var(--core-executive)"
                  }} />
                </div>
                <p style={{ fontSize: "11px", color: "var(--core-text-subtle)", marginTop: 6, lineHeight: 1.4 }}>
                  Resource loading shows aggregated assignments across active deliverables. Red indicates team capacity threshold has been breached.
                </p>
              </div>
            </DrawerSection>
          </div>
        )}
      </DetailDrawer>
    </ExecutiveShell>
  );
}
