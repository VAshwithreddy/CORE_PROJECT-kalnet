"use client";

import { useState } from "react";
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

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

interface Project {
  id: string;
  name: string;
  sponsor: string;
  progressNum: number; // 0-100
  status: "new" | "in-progress" | "blocked" | "completed";
  budget: string;
  startMonth: string; // "Jan", "Feb", etc.
  startOffset: number; // 0-11 index for timeline bar position
  duration: number; // monthly width
  theme: "Growth" | "Tech Enablement" | "Cost Optimization";
  milestones: string[];
  description: string;
}

export default function ExecutivePortfolioPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [themeFilter, setThemeFilter] = useState("All");

  const projects: Project[] = [
    {
      id: "proj-emea",
      name: "Expand to EMEA",
      sponsor: "Michael K.",
      progressNum: 45,
      status: "in-progress",
      budget: "$240,000",
      startMonth: "Mar",
      startOffset: 2,
      duration: 6,
      theme: "Growth",
      milestones: ["Market Fit Survey (Done)", "Office Lease Signed (Done)", "GDPR Auditing (Delayed)", "Local Entity Setup (Pending)"],
      description: "Establishing local entity, sales pipeline, and GDPR compliance checks in the EMEA region to secure local market capture."
    },
    {
      id: "proj-ai",
      name: "AI Integration",
      sponsor: "Sarah W.",
      progressNum: 20,
      status: "blocked",
      budget: "$480,000",
      startMonth: "May",
      startOffset: 4,
      duration: 5,
      theme: "Tech Enablement",
      milestones: ["API Layer (Done)", "GPU Hosting Allocations (Blocked)", "Semantic Indexing (Pending)"],
      description: "Infusing LLM-driven intelligence into CORE workflows, starting with smart ticket routing and automated department status summaries."
    },
    {
      id: "proj-cost",
      name: "Cost Reduction Plan",
      sponsor: "David L.",
      progressNum: 85,
      status: "in-progress",
      budget: "$95,000",
      startMonth: "Jan",
      startOffset: 0,
      duration: 7,
      theme: "Cost Optimization",
      milestones: ["Tool License Audits (Done)", "AWS Instance Downsizing (Done)", "Legacy Server Decommission (Pending)"],
      description: "Identifying redundant tools, downsizing under-utilized compute nodes, and renegotiating platform contracts to meet operational savings targets."
    },
    {
      id: "proj-cloud",
      name: "Cloud Migration Phase 2",
      sponsor: "Jessica T.",
      progressNum: 92,
      status: "completed",
      budget: "$180,000",
      startMonth: "Feb",
      startOffset: 1,
      duration: 6,
      theme: "Tech Enablement",
      milestones: ["Data Migration (Done)", "Multi-region Deploy (Done)", "Failover Tests (Done)"],
      description: "Transitioning legacy core services into AWS Supabase RDS instances to achieve role-based access control at the database layer."
    },
    {
      id: "proj-cs",
      name: "Customer Success Platform",
      sponsor: "Michael K.",
      progressNum: 10,
      status: "new",
      budget: "$150,000",
      startMonth: "Jul",
      startOffset: 6,
      duration: 5,
      theme: "Growth",
      milestones: ["Requirements Gathering (Done)", "Vendor Selection (Pending)"],
      description: "Setting up a client feedback and ticketing loop connected directly to internal employee assignments, enabling Stage 5 client compliance."
    }
  ];

  // Filtering
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sponsor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesTheme = themeFilter === "All" || p.theme === themeFilter;
    return matchesSearch && matchesStatus && matchesTheme;
  });

  const columns: DataTableColumn<Project>[] = [
    { key: "name", header: "Initiative Name", sortable: true },
    { key: "theme", header: "Strategic Theme", sortable: true },
    { key: "sponsor", header: "Executive Sponsor", sortable: true },
    { key: "budget", header: "Budget Allocation", sortable: true },
    {
      key: "progressNum",
      header: "Execution Progress",
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

        if (row.status === "in-progress") {
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
        }

        return (
          <span style={{
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: "var(--core-radius-sm)",
            backgroundColor: bg,
            color,
            fontSize: "12px",
            fontWeight: 600
          }}>
            {label}
          </span>
        );
      }
    }
  ];

  return (
    <ExecutiveShell activePath="/executive/portfolio">
      <PageHeader
        title="Strategic Portfolio Roadmap"
        description="Track milestones, execution progress, budget alignment, and timelines across organizational objectives."
      />

      {/* KPI Section */}
      <div className="core-grid" style={{ marginBottom: 32 }}>
        <MetricCard label="Strategic Initiatives" value="5 Active">
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-text-muted)" }}>
            Covering Growth, Tech Enablement, and Cost Optimization themes.
          </div>
        </MetricCard>
        <MetricCard label="Portfolio Execution Rate" value="50.4%">
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-text-muted)" }}>
            Average completion rate across all 5 roadmap tracks.
          </div>
        </MetricCard>
        <MetricCard label="Total Portfolio Budget" value="$1.14M">
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-text-muted)" }}>
            Aggregated capital budget allocation for Phase 1.
          </div>
        </MetricCard>
      </div>

      {/* Gantt Timeline Roadmap Visualizer */}
      <div className="core-panel" style={{ marginBottom: 32 }}>
        <h2>Strategic Roadmap Timeline (2026)</h2>
        <p style={{ fontSize: "13px", marginBottom: 20 }}>Overview of project durations, timelines, and milestone stages by month.</p>
        
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "600px" }}>
            {/* Timeline Header Row */}
            <div style={{ display: "grid", gridTemplateColumns: "180px repeat(12, 1fr)", borderBottom: "1px solid var(--core-border)", paddingBottom: 10 }}>
              <span style={{ fontWeight: 600, fontSize: "12px", color: "var(--core-text-subtle)" }}>Strategic Track</span>
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                <span key={m} style={{ fontSize: "11px", fontWeight: 600, color: "var(--core-text-subtle)", textAlign: "center" }}>{m}</span>
              ))}
            </div>

            {/* Timeline Project Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 14 }}>
              {projects.map((p) => {
                let barColor = "var(--core-executive)";
                if (p.status === "blocked") barColor = "var(--core-danger)";
                else if (p.status === "completed") barColor = "var(--core-success)";

                return (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: "180px repeat(12, 1fr)", alignItems: "center" }}>
                    {/* Track Title */}
                    <span style={{ fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 10 }}>
                      {p.name}
                    </span>

                    {/* Roadmap Timeline Bar container */}
                    <div style={{ gridColumnStart: p.startOffset + 2, gridColumnEnd: p.startOffset + p.duration + 2, height: "18px", position: "relative" }}>
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
                      
                      {/* Milestone Diamond Indicators */}
                      <div style={{
                        position: "absolute",
                        right: "15%",
                        top: "50%",
                        transform: "translateY(-50%) rotate(45deg)",
                        width: 8,
                        height: 8,
                        background: "var(--core-surface)",
                        border: `1.5px solid ${barColor}`
                      }} title="Milestone Target" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
        subtitle={`Strategic Objective | Theme: ${selectedProject?.theme}`}
        status={
          selectedProject ? (
            <span style={{
              padding: "4px 8px",
              borderRadius: "var(--core-radius-sm)",
              backgroundColor: selectedProject.status === "blocked" ? "var(--core-danger-soft)" : selectedProject.status === "completed" ? "var(--core-success-soft)" : "var(--core-executive-soft)",
              color: selectedProject.status === "blocked" ? "var(--core-danger)" : selectedProject.status === "completed" ? "var(--core-success)" : "var(--core-executive)",
              fontSize: "12px",
              fontWeight: 600
            }}>
              {selectedProject.status === "blocked" ? "Blocked" : selectedProject.status === "completed" ? "Completed" : "In Progress"}
            </span>
          ) : undefined
        }
      >
        {selectedProject && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <DrawerSection title="Details">
              <DrawerField label="Sponsor" value={selectedProject.sponsor} />
              <DrawerField label="Budget Allocation" value={selectedProject.budget} />
              <DrawerField label="Start Month" value={selectedProject.startMonth} />
              <DrawerField label="Milestone Rate" value={`${selectedProject.progressNum}%`} />
            </DrawerSection>

            <DrawerSection title="About Track">
              <div style={{ fontSize: "13px", color: "var(--core-text-muted)", lineHeight: 1.6, width: "100%" }}>
                {selectedProject.description}
              </div>
            </DrawerSection>

            <DrawerSection title="Milestones / Roadmap Steps">
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                {selectedProject.milestones.map((ms, idx) => {
                  const isDone = ms.includes("(Done)");
                  const isDelayed = ms.includes("(Delayed)");
                  let dotColor = "var(--core-text-subtle)";
                  if (isDone) dotColor = "var(--core-success)";
                  else if (isDelayed) dotColor = "var(--core-danger)";

                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "13px" }}>
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: dotColor,
                        display: "inline-block"
                      }} />
                      <span style={{ fontWeight: 500, color: isDelayed ? "var(--core-danger)" : "var(--core-text)" }}>
                        {ms}
                      </span>
                    </div>
                  );
                })}
              </div>
            </DrawerSection>
          </div>
        )}
      </DetailDrawer>
    </ExecutiveShell>
  );
}
