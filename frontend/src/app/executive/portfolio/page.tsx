"use client";

import { useState, useEffect } from "react";
import { ExecutiveShell } from "@/components/executive-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";

// Custom SVGs
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

interface Project {
  id: string;
  name: string;
  sponsor: string;
  progressNum: number;
  status: string;
  budget: string;
  target_date: string;
  department: string;
  theme: string;
  description: string;
  milestones: string[];
}

export default function ExecutivePortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [themeFilter, setThemeFilter] = useState("All");

  // Fetch portfolio data
  useEffect(() => {
    setLoading(true);
    fetch("/executive/api?action=portfolio")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch portfolio projects");
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProjects(data);
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

  // Helper to generate deterministic timeline offsets for Gantt chart based on UUID
  const getTimeline = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const startOffset = Math.abs(hash) % 6; // 0 to 5 (Jan to Jun)
    const duration = 3 + (Math.abs(hash) % 5); // 3 to 7 months
    return { startOffset, duration };
  };

  // Filtering
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sponsor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status normalization
    const normStatus = p.status === "active" || p.status === "in_progress" ? "in-progress" : p.status;
    const matchesStatus = statusFilter === "All" || normStatus === statusFilter;
    const matchesTheme = themeFilter === "All" || p.theme === themeFilter;
    return matchesSearch && matchesStatus && matchesTheme;
  });

  const columns: DataTableColumn<Project>[] = [
    { key: "name", header: "Initiative Name", sortable: true },
    { key: "department", header: "Owning Department", sortable: true },
    { key: "theme", header: "Strategic Theme", sortable: true },
    { key: "sponsor", header: "Sponsor / Owner", sortable: true },
    { key: "budget", header: "Budget Allocation", sortable: true },
    {
      key: "progressNum",
      header: "Progress",
      sortable: true,
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: "13px", minWidth: "32px" }}>{row.progressNum}%</span>
          <div style={{ flex: 1, minWidth: "80px", height: "6px", background: "var(--core-surface-muted)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${row.progressNum}%`, height: "100%", background: "var(--core-executive)" }} />
          </div>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => {
        let label = "New";
        let color = "var(--core-info)";
        let bg = "var(--core-info-soft)";

        if (row.status === "active" || row.status === "in_progress" || row.status === "in-progress") {
          label = "In Progress";
          color = "var(--core-executive)";
          bg = "var(--core-executive-soft)";
        } else if (row.status === "blocked") {
          label = "Blocked";
          color = "var(--core-danger)";
          bg = "var(--core-danger-soft)";
        } else if (row.status === "completed") {
          label = "Completed";
          color = "var(--core-success)";
          bg = "var(--core-success-soft)";
        } else if (row.status === "on_hold" || row.status === "on-hold") {
          label = "On Hold";
          color = "var(--core-warning)";
          bg = "var(--core-warning-soft)";
        }

        return (
          <span style={{
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: "var(--core-radius-sm)",
            backgroundColor: bg,
            color,
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "capitalize"
          }}>
            {label}
          </span>
        );
      }
    }
  ];

  if (loading) {
    return (
      <ExecutiveShell activePath="/executive/portfolio">
        <PageHeader title="Strategic Portfolio Roadmap" description="Connecting to live database..." />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <div style={{ width: "30px", height: "30px", border: "3px solid var(--core-border)", borderTop: "3px solid var(--core-executive)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      </ExecutiveShell>
    );
  }

  if (error) {
    return (
      <ExecutiveShell activePath="/executive/portfolio">
        <PageHeader title="Strategic Portfolio Roadmap" description="Connection Error" />
        <div className="core-panel" style={{ border: "1px solid var(--core-danger)", background: "var(--core-danger-soft)", color: "var(--core-danger)", padding: 20 }}>
          <h2 style={{ color: "var(--core-danger)", margin: "0 0 10px" }}>Database Connection Failed</h2>
          <p style={{ color: "var(--core-danger)", margin: 0 }}>{error}</p>
        </div>
      </ExecutiveShell>
    );
  }

  return (
    <ExecutiveShell activePath="/executive/portfolio">
      <PageHeader
        title="Strategic Portfolio Roadmap"
        description="Track milestones, execution status, budgets, and schedules mapped from live projects and assignments."
      />

      {/* KPI Section */}
      <div className="core-grid" style={{ marginBottom: 32 }}>
        <MetricCard label="Total Portfolio Projects" value={projects.length} />
        <MetricCard label="Active Projects" value={projects.filter(p => p.status === "active").length} />
        <MetricCard label="Strategic Objectives Themes" value="3 Focus Areas" />
      </div>

      {/* Gantt Timeline Roadmap Visualizer */}
      {projects.length > 0 && (
        <div className="core-panel" style={{ marginBottom: 32 }}>
          <h2>Strategic Projects Timeline (2026)</h2>
          <p style={{ fontSize: "13px", marginBottom: 20 }}>Visualizing project durations dynamically generated from database ID keys.</p>
          
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "600px" }}>
              {/* Timeline Header Row */}
              <div style={{ display: "grid", gridTemplateColumns: "200px repeat(12, 1fr)", borderBottom: "1px solid var(--core-border)", paddingBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: "12px", color: "var(--core-text-subtle)" }}>Strategic Track</span>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                  <span key={m} style={{ fontSize: "11px", fontWeight: 600, color: "var(--core-text-subtle)", textAlign: "center" }}>{m}</span>
                ))}
              </div>

              {/* Timeline Project Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 14 }}>
                {projects.map((p) => {
                  const { startOffset, duration } = getTimeline(p.id);
                  let barColor = "var(--core-executive)";
                  if (p.status === "blocked") barColor = "var(--core-danger)";
                  else if (p.status === "completed") barColor = "var(--core-success)";
                  else if (p.status === "on_hold" || p.status === "on-hold") barColor = "var(--core-warning)";

                  return (
                    <div key={p.id} style={{ display: "grid", gridTemplateColumns: "200px repeat(12, 1fr)", alignItems: "center" }}>
                      {/* Track Title */}
                      <span style={{ fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 10 }}>
                        {p.name}
                      </span>

                      {/* Roadmap Timeline Bar */}
                      <div style={{ gridColumnStart: startOffset + 2, gridColumnEnd: startOffset + duration + 2, height: "18px", position: "relative" }}>
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: barColor,
                            borderRadius: "9px",
                            opacity: 0.85,
                            boxShadow: "var(--core-shadow-sm)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            paddingLeft: 8,
                            color: "#fff",
                            fontSize: "9px",
                            fontWeight: 600
                          }}
                          onClick={() => setSelectedProject(p)}
                        >
                          {p.progressNum}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar / Search & Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--core-text-subtle)", display: "flex" }}>
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Search initiatives..."
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
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          <option value="All">All Statuses</option>
          <option value="new">New</option>
          <option value="in-progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
        </select>

        {/* Theme Filter */}
        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
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
          <option value="All">All Strategic Themes</option>
          <option value="Growth">Growth</option>
          <option value="Tech Enablement">Tech Enablement</option>
          <option value="Cost Optimization">Cost Optimization</option>
        </select>
      </div>

      {/* Project Table */}
      <DataTable
        columns={columns}
        rows={filteredProjects}
        rowKey={(row) => row.id}
        rowActions={(row) => [
          { label: "Inspect Track", onClick: (row) => setSelectedProject(row) }
        ]}
      />

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={selectedProject !== null}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.name ?? ""}
        subtitle={`Owning Department: ${selectedProject?.department} | Theme: ${selectedProject?.theme}`}
        status={
          selectedProject ? (
            <span style={{
              padding: "4px 8px",
              borderRadius: "var(--core-radius-sm)",
              backgroundColor: selectedProject.status === "blocked" ? "var(--core-danger-soft)" : selectedProject.status === "completed" ? "var(--core-success-soft)" : "var(--core-executive-soft)",
              color: selectedProject.status === "blocked" ? "var(--core-danger)" : selectedProject.status === "completed" ? "var(--core-success)" : "var(--core-executive)",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "capitalize"
            }}>
              {selectedProject.status}
            </span>
          ) : undefined
        }
      >
        {selectedProject && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <DrawerSection title="Details">
              <DrawerField label="Sponsor / Lead" value={selectedProject.sponsor} />
              <DrawerField label="Budget Allocation" value={selectedProject.budget} />
              <DrawerField label="Target Due Date" value={selectedProject.target_date} />
              <DrawerField label="Progress achieved" value={`${selectedProject.progressNum}%`} />
            </DrawerSection>

            <DrawerSection title="About Track">
              <div style={{ fontSize: "13px", color: "var(--core-text-muted)", lineHeight: 1.6, width: "100%" }}>
                {selectedProject.description}
              </div>
            </DrawerSection>

            <DrawerSection title="Registered Assignments">
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                {selectedProject.milestones.length > 0 ? (
                  selectedProject.milestones.map((ms, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "13px" }}>
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: ms.includes("Done") || ms.includes("On Track") ? "var(--core-success)" : "var(--core-text-subtle)",
                        display: "inline-block"
                      }} />
                      <span style={{ fontWeight: 500 }}>
                        {ms}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--core-text-subtle)", margin: 0 }}>No personnel assigned to this project yet.</p>
                )}
              </div>
            </DrawerSection>
          </div>
        )}
      </DetailDrawer>
    </ExecutiveShell>
  );
}
