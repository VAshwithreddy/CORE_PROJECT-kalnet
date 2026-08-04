"use client";

import { useState, useEffect } from "react";
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
  description: string;
  head: string;
  headcount: number;
  activeProjects: number;
  blockers: number;
  health: "Healthy" | "Attention" | "Critical";
  projects: string[];
}

export default function ExecutiveDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch departments data
  useEffect(() => {
    setLoading(true);
    fetch("/executive/api?action=departments")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch departments data");
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDepartments(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filtering
  const filteredDepartments = departments.filter((dept) => {
    return dept.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           dept.head.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const columns: DataTableColumn<Department>[] = [
    { key: "name", header: "Department", sortable: true },
    { key: "head", header: "Department Head", sortable: true },
    { key: "headcount", header: "Headcount", sortable: true },
    { key: "activeProjects", header: "Total Projects", sortable: true },
    { key: "blockers", header: "Active Blockers", sortable: true },
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

  if (loading) {
    return (
      <ExecutiveShell activePath="/executive/departments">
        <PageHeader title="Departmental Performance" description="Connecting to live database..." />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <div style={{ width: "30px", height: "30px", border: "3px solid var(--core-border)", borderTop: "3px solid var(--core-executive)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      </ExecutiveShell>
    );
  }

  if (error) {
    return (
      <ExecutiveShell activePath="/executive/departments">
        <PageHeader title="Departmental Performance" description="Connection Error" />
        <div className="core-panel" style={{ border: "1px solid var(--core-danger)", background: "var(--core-danger-soft)", color: "var(--core-danger)", padding: 20 }}>
          <h2 style={{ color: "var(--core-danger)", margin: "0 0 10px" }}>Database Connection Failed</h2>
          <p style={{ color: "var(--core-danger)", margin: 0 }}>{error}</p>
        </div>
      </ExecutiveShell>
    );
  }

  // Calculate highest risks
  const criticalDepts = departments.filter((d) => d.health === "Critical");
  const riskLabel = criticalDepts.length > 0 ? criticalDepts.map((d) => d.name).join(", ") : "None Detected";

  return (
    <ExecutiveShell activePath="/executive/departments">
      <PageHeader
        title="Departmental Performance"
        description="Cross-departmental project counts, headcounts, allocations, and blocker indicators from the live registry."
      />

      {/* Grid of Department metrics */}
      <div className="core-grid" style={{ marginBottom: 32 }}>
        <MetricCard label="Total Registered Departments" value={departments.length} />
        <MetricCard label="Active Blocker Risks" value={riskLabel}>
          <div style={{ marginTop: 8, fontSize: "13px", color: criticalDepts.length > 0 ? "var(--core-danger)" : "var(--core-text-muted)" }}>
            Departments requiring immediate operational support.
          </div>
        </MetricCard>
        <MetricCard label="Total Organizational Headcount" value={departments.reduce((acc, d) => acc + d.headcount, 0)} />
      </div>

      {/* SVG Comparative Bar Chart */}
      {departments.length > 0 && (
        <div className="core-panel" style={{ marginBottom: 32 }}>
          <h2>Projects & Blockers load per Division</h2>
          <p style={{ fontSize: "13px", marginBottom: 20 }}>Visualizing project density against active blocking statuses from live tables.</p>
          <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 32, paddingLeft: 40, borderBottom: "1px solid var(--core-border)", paddingBottom: 16, overflowX: "auto" }}>
            {departments.map((dept) => (
              <div key={dept.id} style={{ flex: 1, minWidth: "60px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130 }}>
                  {/* Active Projects Bar */}
                  <div
                    style={{
                      width: 16,
                      height: `${Math.min(120, dept.activeProjects * 6)}px`,
                      background: "var(--core-executive)",
                      borderRadius: "3px 3px 0 0",
                    }}
                    title={`Projects: ${dept.activeProjects}`}
                  />
                  {/* Blockers Bar */}
                  <div
                    style={{
                      width: 16,
                      height: `${Math.min(120, dept.blockers * 20)}px`,
                      background: "var(--core-danger)",
                      borderRadius: "3px 3px 0 0",
                    }}
                    title={`Blockers: ${dept.blockers}`}
                  />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--core-text-muted)", textAlign: "center", whiteSpace: "nowrap" }}>
                  {dept.name}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center", fontSize: "11px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, display: "inline-block", background: "var(--core-executive)", borderRadius: 2 }} /> Projects
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, display: "inline-block", background: "var(--core-danger)", borderRadius: 2 }} /> Blockers
            </span>
          </div>
        </div>
      )}

      {/* Filter and Table Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
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
        subtitle="Department Details"
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
              <DrawerField label="Description" value={selectedDept.description} />
              <DrawerField label="Active Blocker Incidents" value={selectedDept.blockers.toString()} />
            </DrawerSection>

            <DrawerSection title="Registered Projects">
              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                {selectedDept.projects.length > 0 ? (
                  selectedDept.projects.map((proj, idx) => (
                    <div key={idx} style={{ padding: 10, background: "var(--core-surface-muted)", borderRadius: "var(--core-radius-sm)", fontSize: "13px", fontWeight: 500 }}>
                      {proj}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--core-text-subtle)", margin: 0 }}>No projects currently assigned.</p>
                )}
              </div>
            </DrawerSection>
          </div>
        )}
      </DetailDrawer>
    </ExecutiveShell>
  );
}
