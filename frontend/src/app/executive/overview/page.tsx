"use client";

import { useState } from "react";
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
  type: "Approval" | "Escalation";
  priority: "High" | "Medium" | "Low";
  source: string;
  date: string;
}

export default function ExecutiveOverviewPage() {
  const [timePeriod, setTimePeriod] = useState("q3-2026");
  const [decisions, setDecisions] = useState<DecisionItem[]>([
    { id: "dec-1", title: "Approve Q3 Budget Variance (+2.4% EMEA)", type: "Approval", priority: "High", source: "Finance", date: "Today" },
    { id: "dec-2", title: "Resolve AI/ML Compute Capacity Blocker", type: "Escalation", priority: "High", source: "Research Dept", date: "Yesterday" },
    { id: "dec-3", title: "Approve Staff Allocation - Expansion to EMEA", type: "Approval", priority: "Medium", source: "Product Mgmt", date: "2 days ago" },
    { id: "dec-4", title: "Reallocate cloud resources to offset latency risks", type: "Escalation", priority: "Low", source: "Infrastructure", date: "3 days ago" },
  ]);

  const [initiatives, setInitiatives] = useState([
    { name: "Expand to EMEA", sponsor: "Michael K.", progress: "45%", status: "On Track" },
    { name: "AI Integration", sponsor: "Sarah W.", progress: "20%", status: "At Risk" },
    { name: "Cost Reduction", sponsor: "David L.", progress: "85%", status: "On Track" },
    { name: "Cloud Migration", sponsor: "Jessica T.", progress: "92%", status: "Completed" },
  ]);

  // Handle decisions locally
  const handleResolveDecision = (id: string) => {
    setDecisions((prev) => prev.filter((d) => d.id !== id));
  };

  // Sparklines
  const okrSparkline = [
    { value: 0.1 }, { value: 0.2 }, { value: 0.28 }, { value: 0.4 }, 
    { value: 0.52 }, { value: 0.6 }, { value: 0.68, active: true }
  ];

  const headcountSparkline = [
    { value: 0.8 }, { value: 0.82 }, { value: 0.85 }, { value: 0.89 }, 
    { value: 0.92 }, { value: 0.95 }, { value: 0.98, active: true }
  ];

  const blockerSparkline = [
    { value: 0.9 }, { value: 0.8 }, { value: 0.6 }, { value: 0.7 }, 
    { value: 0.5 }, { value: 0.4 }, { value: 0.3, active: true }
  ];

  const budgetSparkline = [
    { value: 0.3 }, { value: 0.4 }, { value: 0.5 }, { value: 0.45 }, 
    { value: 0.38 }, { value: 0.25 }, { value: 0.2, active: true }
  ];

  // Dynamic values depending on selected Q3 or Q4 (simulate selection change)
  const getMetrics = () => {
    if (timePeriod === "q4-2026") {
      return [
        { label: "Company OKR Progress", value: "79%", change: 11, trend: "up" as const, changePeriod: "vs Q3", sparkline: okrSparkline },
        { label: "Total Headcount", value: "1,295", change: 55, trend: "up" as const, changePeriod: "vs Q3", sparkline: headcountSparkline },
        { label: "Critical Blockers", value: 1, change: -2, trend: "down" as const, changePeriod: "vs Q3", sparkline: blockerSparkline },
        { label: "Budget Variance", value: "-0.8%", change: 1.2, trend: "down" as const, changePeriod: "vs plan", sparkline: budgetSparkline },
      ];
    }
    return [
      { label: "Company OKR Progress", value: "68%", change: 12, trend: "up" as const, changePeriod: "vs last month", sparkline: okrSparkline },
      { label: "Total Headcount", value: "1,240", change: 45, trend: "up" as const, changePeriod: "vs Q1", sparkline: headcountSparkline },
      { label: "Critical Blockers", value: 3, change: -2, trend: "down" as const, changePeriod: "vs last week", sparkline: blockerSparkline },
      { label: "Budget Variance", value: "-2.0%", change: 1.0, trend: "down" as const, changePeriod: "vs plan", sparkline: budgetSparkline },
    ];
  };

  const columns: DataTableColumn<typeof initiatives[0]>[] = [
    { key: "name", header: "Initiative", sortable: true },
    { key: "sponsor", header: "Exec Sponsor", sortable: true },
    { key: "progress", header: "Progress", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => {
        const isAtRisk = row.status === "At Risk";
        const isCompleted = row.status === "Completed";
        let color = "var(--core-success)";
        if (isAtRisk) color = "var(--core-danger)";
        else if (isCompleted) color = "var(--core-info)";

        return (
          <span style={{ color, display: "inline-flex", alignItems: "center", fontWeight: 600 }}>
            {isAtRisk ? <AlertIcon /> : <CheckIcon />}
            {row.status}
          </span>
        );
      }
    },
  ];

  const decisionColumns: DataTableColumn<DecisionItem>[] = [
    { key: "title", header: "Decision Required" },
    { key: "type", header: "Type" },
    {
      key: "priority",
      header: "Priority",
      render: (row) => {
        let color = "var(--core-text-muted)";
        if (row.priority === "High") color = "var(--core-danger)";
        else if (row.priority === "Medium") color = "var(--core-warning)";
        return <span style={{ color, fontWeight: 600 }}>{row.priority}</span>;
      }
    },
    { key: "source", header: "Requester" },
    { key: "date", header: "Raised" },
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
            Approve
          </button>
          <button
            type="button"
            className="core-button core-button-sm core-button-ghost"
            onClick={() => handleResolveDecision(row.id)}
            style={{ minHeight: 28, fontSize: "12px", padding: "0 8px" }}
          >
            Dismiss
          </button>
        </div>
      )
    }
  ];

  return (
    <ExecutiveShell activePath="/executive/overview">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
        <PageHeader
          title="Executive Overview"
          description="High-level operational metrics, strategic initiatives, and organizational velocity."
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
            <option value="q3-2026">Q3 2026 (Current)</option>
            <option value="q4-2026">Q4 2026 (Forecast)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="core-grid-4" style={{ marginBottom: 32 }}>
        {getMetrics().map((m) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            change={m.change}
            trend={m.trend}
            changePeriod={m.changePeriod}
            sparkline={m.sparkline}
          />
        ))}
      </div>

      {/* Two Column Layout for Chart and Decisions */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, marginBottom: 32 }}>
        {/* SVG Progress & Velocity Chart */}
        <div className="core-panel" style={{ display: "flex", flexDirection: "column" }}>
          <h2>Strategic Portfolio Progress</h2>
          <p style={{ fontSize: "13px", marginBottom: 20 }}>Monthly aggregate progression of strategic milestones vs planned targets.</p>
          <div style={{ flex: 1, minHeight: 220, position: "relative" }}>
            <svg width="100%" height="220" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="var(--core-surface-muted)" strokeWidth="1" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="var(--core-surface-muted)" strokeWidth="1" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="var(--core-surface-muted)" strokeWidth="1" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="var(--core-surface-muted)" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="var(--core-border)" strokeWidth="1.5" />

              {/* Y Axis Labels */}
              <text x="10" y="25" fill="var(--core-text-subtle)" fontSize="10" textAnchor="start">100%</text>
              <text x="10" y="65" fill="var(--core-text-subtle)" fontSize="10" textAnchor="start">75%</text>
              <text x="10" y="105" fill="var(--core-text-subtle)" fontSize="10" textAnchor="start">50%</text>
              <text x="10" y="145" fill="var(--core-text-subtle)" fontSize="10" textAnchor="start">25%</text>
              <text x="10" y="175" fill="var(--core-text-subtle)" fontSize="10" textAnchor="start">0%</text>

              {/* X Axis Labels */}
              <text x="60" y="190" fill="var(--core-text-subtle)" fontSize="10" textAnchor="middle">Feb</text>
              <text x="140" y="190" fill="var(--core-text-subtle)" fontSize="10" textAnchor="middle">Mar</text>
              <text x="220" y="190" fill="var(--core-text-subtle)" fontSize="10" textAnchor="middle">Apr</text>
              <text x="300" y="190" fill="var(--core-text-subtle)" fontSize="10" textAnchor="middle">May</text>
              <text x="380" y="190" fill="var(--core-text-subtle)" fontSize="10" textAnchor="middle">Jun</text>
              <text x="460" y="190" fill="var(--core-text-subtle)" fontSize="10" textAnchor="middle">Jul</text>

              {/* Area Under Curve (Target) */}
              <path
                d="M 60 170 L 140 145 L 220 120 L 300 95 L 380 70 L 460 45 L 460 170 Z"
                fill="var(--core-surface-muted)"
                opacity="0.3"
              />

              {/* Target Line */}
              <path
                d="M 60 170 L 140 145 L 220 120 L 300 95 L 380 70 L 460 45"
                fill="none"
                stroke="var(--core-text-subtle)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Actual Line */}
              <path
                d="M 60 170 L 140 152 L 220 131 L 300 90 L 380 74 L 460 55"
                fill="none"
                stroke="var(--core-executive)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="60" cy="170" r="4" fill="var(--core-executive)" stroke="var(--core-surface)" strokeWidth="1.5" />
              <circle cx="140" cy="152" r="4" fill="var(--core-executive)" stroke="var(--core-surface)" strokeWidth="1.5" />
              <circle cx="220" cy="131" r="4" fill="var(--core-executive)" stroke="var(--core-surface)" strokeWidth="1.5" />
              <circle cx="300" cy="90" r="4" fill="var(--core-executive)" stroke="var(--core-surface)" strokeWidth="1.5" />
              <circle cx="380" cy="74" r="4" fill="var(--core-executive)" stroke="var(--core-surface)" strokeWidth="1.5" />
              <circle cx="460" cy="55" r="4" fill="var(--core-executive)" stroke="var(--core-surface)" strokeWidth="1.5" />
            </svg>
            <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center", fontSize: "11px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 3, display: "inline-block", borderBottom: "2px dashed var(--core-text-subtle)" }} /> Planned Target
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 3, display: "inline-block", background: "var(--core-executive)" }} /> Actual Progress
              </span>
            </div>
          </div>
        </div>

        {/* Small Risk / Highlight Sidebar */}
        <div className="core-panel" style={{ display: "flex", flexDirection: "column" }}>
          <h2>Leadership Health Checks</h2>
          <p style={{ fontSize: "13px", marginBottom: 16 }}>Key indicators requiring oversight.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <div style={{ padding: 12, borderRadius: "var(--core-radius-sm)", border: "1px solid var(--core-border)", background: "var(--core-surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--core-danger)" }}>Escalated Risk</span>
                <span style={{ fontSize: "11px", color: "var(--core-text-subtle)" }}>Q3 Plan</span>
              </div>
              <p style={{ fontWeight: 500, fontSize: "14px", margin: "0 0 4px" }}>AI Model Compute Limit Breach</p>
              <p style={{ fontSize: "12px", color: "var(--core-text-muted)" }}>Token limit and GPU hours in research dept exceed budget allocation by 14%.</p>
            </div>
            <div style={{ padding: 12, borderRadius: "var(--core-radius-sm)", border: "1px solid var(--core-border)", background: "var(--core-surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--core-warning)" }}>SLA Warning</span>
                <span style={{ fontSize: "11px", color: "var(--core-text-subtle)" }}>EMEA Launch</span>
              </div>
              <p style={{ fontWeight: 500, fontSize: "14px", margin: "0 0 4px" }}>Legal Approvals for GDPR Audit</p>
              <p style={{ fontSize: "12px", color: "var(--core-text-muted)" }}>Milestone delayed by 9 days. Project "Expand to EMEA" affected.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Queue Section */}
      <div style={{ marginBottom: 32 }}>
        <DataTable
          title="Executive Action Item Queue"
          columns={decisionColumns}
          rows={decisions}
          rowKey={(row) => row.id}
          emptyState={{
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ),
            title: "Clear Inbox",
            body: "No decisions or blocker escalations currently require executive approval."
          }}
        />
      </div>

      {/* Strategic Initiatives Table */}
      <DataTable
        title="Strategic Initiative Tracking"
        columns={columns}
        rows={initiatives}
        rowKey={(row) => row.name}
      />
    </ExecutiveShell>
  );
}
