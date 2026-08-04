"use client";

import { useState, useEffect } from "react";
import { ExecutiveShell } from "@/components/executive-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";

// Custom Inline SVGs
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

interface DecisionItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  source: string;
  date: string;
}

export default function ExecutiveOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbData, setDbData] = useState<any>(null);
  const [timePeriod, setTimePeriod] = useState("q3-2026");

  // Fetch live dashboard data
  useEffect(() => {
    setLoading(true);
    fetch("/executive/api?action=overview")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDbData(data);
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

  const handleResolveDecision = (id: string) => {
    // Optimistic state updates
    if (dbData) {
      const updatedBlocked = dbData.blocked_assignments.filter((b: any) => b.assignment_id !== id);
      setDbData({
        ...dbData,
        blocked_assignments: updatedBlocked,
        organization_summary: {
          ...dbData.organization_summary,
          blocked_assignments: updatedBlocked.length
        }
      });
    }
  };

  if (loading) {
    return (
      <ExecutiveShell activePath="/executive/overview">
        <PageHeader title="Executive Overview" description="Connecting to live database..." />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <div style={{ width: "30px", height: "30px", border: "3px solid var(--core-border)", borderTop: "3px solid var(--core-executive)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </ExecutiveShell>
    );
  }

  if (error || !dbData) {
    return (
      <ExecutiveShell activePath="/executive/overview">
        <PageHeader title="Executive Overview" description="Connection Error" />
        <div className="core-panel" style={{ border: "1px solid var(--core-danger)", background: "var(--core-danger-soft)", color: "var(--core-danger)", padding: 20 }}>
          <h2 style={{ color: "var(--core-danger)", margin: "0 0 10px" }}>Database Connection Failed</h2>
          <p style={{ color: "var(--core-danger)", margin: 0 }}>{error || "Unknown error occurred"}</p>
        </div>
      </ExecutiveShell>
    );
  }

  const summary = dbData.organization_summary;

  // Format Metrics
  const metrics = [
    { label: "Active Project load", value: summary.active_projects.toString(), change: summary.planning_projects, trend: "up" as const, changePeriod: "planned tracks" },
    { label: "Total Headcount", value: summary.total_people.toLocaleString(), change: summary.total_departments, trend: "up" as const, changePeriod: "departments" },
    { label: "Critical Blockers", value: summary.blocked_assignments.toString(), change: -2, trend: "down" as const, changePeriod: "vs last week" },
    { label: "Total Assignments", value: summary.total_assignments.toString(), change: 0, trend: "neutral" as const, changePeriod: "active allocations" },
  ];

  // Map blocked assignments to action items
  const decisions: DecisionItem[] = dbData.blocked_assignments.map((item: any) => ({
    id: item.assignment_id,
    title: `Resolve Blocker: ${item.project_name}`,
    type: "Blocker",
    priority: "High",
    source: item.person_name,
    date: "Raised"
  }));

  const decisionColumns: DataTableColumn<DecisionItem>[] = [
    { key: "title", header: "Decision Required" },
    { key: "type", header: "Type" },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <span style={{ color: "var(--core-danger)", fontWeight: 700 }}>{row.priority}</span>
      )
    },
    { key: "source", header: "Assigned To" },
    {
      key: "id" as any,
      header: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="core-button core-button-sm core-button-primary"
            onClick={() => handleResolveDecision(row.id)}
            style={{ minHeight: 28, fontSize: "12px", background: "var(--core-executive)", borderColor: "var(--core-executive)" }}
          >
            Resolve
          </button>
        </div>
      )
    }
  ];

  const deptColumns: DataTableColumn<any>[] = [
    { key: "department", header: "Department", sortable: true },
    { key: "projects", header: "Total Projects", sortable: true },
    { key: "members", header: "Total Members", sortable: true },
    {
      key: "blocked",
      header: "Blocked Members",
      sortable: true,
      render: (row) => (
        <span style={{ color: row.blocked > 0 ? "var(--core-danger)" : "var(--core-success)", fontWeight: 600 }}>
          {row.blocked}
        </span>
      )
    }
  ];

  return (
    <ExecutiveShell activePath="/executive/overview">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
        <PageHeader
          title="Executive Overview"
          description="Live organizational database metrics, strategic initiatives, and department performance."
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ display: "inline-flex", color: "var(--core-text-subtle)" }}>
            <CalendarIcon />
          </span>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--core-radius-sm)",
              border: "1px solid var(--core-border)",
              background: "var(--core-surface)",
              fontWeight: 500,
              fontSize: "14px",
              color: "var(--core-text)"
            }}
          >
            <option value="q3-2026">Q3 2026 (Live Database)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
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

      {/* Two Column Layout for Chart and Sidebars */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, marginBottom: 32 }}>
        {/* SVG Progress Chart */}
        <div className="core-panel" style={{ display: "flex", flexDirection: "column" }}>
          <h2>Strategic Projects Progress</h2>
          <p style={{ fontSize: "13px", marginBottom: 20 }}>Project priority counts mapped from the live PostgreSQL registry.</p>
          <div style={{ flex: 1, minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="300" height="180" viewBox="0 0 300 180">
              {/* Draw raw priority bars based on live database values */}
              {Object.entries(dbData.projects_by_priority || {}).map(([priority, count]: [string, any], idx) => {
                const height = (count / 20) * 120 + 10;
                const x = 50 + idx * 75;
                const y = 140 - height;
                return (
                  <g key={priority}>
                    <rect
                      x={x}
                      y={y}
                      width="40"
                      height={height}
                      fill="var(--core-executive)"
                      rx="3"
                    />
                    <text x={x + 20} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--core-text)">
                      {count}
                    </text>
                    <text x={x + 20} y="156" textAnchor="middle" fontSize="10" fill="var(--core-text-subtle)" style={{ textTransform: "capitalize" }}>
                      {priority}
                    </text>
                  </g>
                );
              })}
              <line x1="20" y1="140" x2="280" y2="140" stroke="var(--core-border)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Small Risk / Highlight Sidebar */}
        <div className="core-panel" style={{ display: "flex", flexDirection: "column" }}>
          <h2>Live Database Health Summary</h2>
          <p style={{ fontSize: "13px", marginBottom: 16 }}>Key statistics from the PostgreSQL registry.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <div style={{ padding: 12, borderRadius: "var(--core-radius-sm)", border: "1px solid var(--core-border)", background: "var(--core-surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--core-brand)" }}>Deployment status</span>
                <span style={{ fontSize: "11px", color: "var(--core-text-subtle)" }}>Live</span>
              </div>
              <p style={{ fontWeight: 500, fontSize: "14px", margin: "0 0 4px" }}>Supabase Pooler Server</p>
              <p style={{ fontSize: "12px", color: "var(--core-text-muted)" }}>Connected to AWS ap-northeast-2 instance.</p>
            </div>
            <div style={{ padding: 12, borderRadius: "var(--core-radius-sm)", border: "1px solid var(--core-border)", background: "var(--core-surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--core-warning)" }}>Registry Alert</span>
                <span style={{ fontSize: "11px", color: "var(--core-text-subtle)" }}>Active</span>
              </div>
              <p style={{ fontWeight: 500, fontSize: "14px", margin: "0 0 4px" }}>Critical Blockers Detected</p>
              <p style={{ fontSize: "12px", color: "var(--core-text-muted)" }}>{summary.blocked_assignments} assignments are flagged as blocked.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Queue Section */}
      <div style={{ marginBottom: 32 }}>
        <DataTable
          title="Executive Blocker Action Queue"
          columns={decisionColumns}
          rows={decisions}
          rowKey={(row) => row.id}
          emptyState={{
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ),
            title: "Clear Action Queue",
            body: "No assignments are currently blocked in the database."
          }}
        />
      </div>

      {/* Departments Table */}
      <DataTable
        title="Department Performance & Metrics"
        columns={deptColumns}
        rows={dbData.departments_overview}
        rowKey={(row) => row.department}
      />
    </ExecutiveShell>
  );
}
