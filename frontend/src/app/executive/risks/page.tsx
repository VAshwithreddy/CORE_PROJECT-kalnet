"use client";

import { useState } from "react";
import { ExecutiveShell } from "@/components/executive-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";

// Custom SVGs
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

interface Risk {
  id: string;
  name: string;
  category: "Infrastructure" | "Compliance" | "Performance" | "Human Resources" | "Financial";
  likelihood: number; // 1-5
  impact: number; // 1-5
  score: number; // likelihood * impact
  owner: string;
  status: "Open" | "Escalated" | "Mitigated";
  mitigation: string;
  progress: number; // 0-100
}

export default function ExecutiveRisksPage() {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Matrix coordinate filter: [likelihood, impact]
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  const [risks, setRisks] = useState<Risk[]>([
    {
      id: "risk-gpu",
      name: "GPU Instance Shortage",
      category: "Infrastructure",
      likelihood: 4,
      impact: 4,
      score: 16,
      owner: "Sarah W.",
      status: "Open",
      mitigation: "Establish multi-cloud contract agreements with auxiliary hosting providers.",
      progress: 40
    },
    {
      id: "risk-legal",
      name: "EMEA Legal Launch Delay",
      category: "Compliance",
      likelihood: 3,
      impact: 4,
      score: 12,
      owner: "Michael K.",
      status: "Open",
      mitigation: "Retain local legal representation in the UK and Germany to expedite audits.",
      progress: 60
    },
    {
      id: "risk-shard",
      name: "Database Sharding Latency spikes",
      category: "Performance",
      likelihood: 2,
      impact: 3,
      score: 6,
      owner: "David L.",
      status: "Mitigated",
      mitigation: "Deploy auxiliary read replicas and caching layers to minimize RDS workload.",
      progress: 95
    },
    {
      id: "risk-turnover",
      name: "Key AI Engineer Turnover",
      category: "Human Resources",
      likelihood: 3,
      impact: 5,
      score: 15,
      owner: "Sarah W.",
      status: "Escalated",
      mitigation: "Conduct compensation audit and introduce project bonuses.",
      progress: 15
    },
    {
      id: "risk-cost",
      name: "AWS Compute Cost Overrun",
      category: "Financial",
      likelihood: 4,
      impact: 2,
      score: 8,
      owner: "Jessica T.",
      status: "Open",
      mitigation: "Decommission development servers off-hours and setup automated alerts.",
      progress: 80
    }
  ]);

  // Handle local state changes
  const handleEscalateRisk = (id: string) => {
    setRisks((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Escalated" } : r))
    );
    setSelectedRisk((prev) => (prev && prev.id === id ? { ...prev, status: "Escalated" } : prev));
  };

  const handleMitigateRisk = (id: string) => {
    setRisks((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Mitigated", progress: 100 } : r))
    );
    setSelectedRisk((prev) => (prev && prev.id === id ? { ...prev, status: "Mitigated", progress: 100 } : prev));
  };

  // Filter logic
  const filteredRisks = risks.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    
    // Cell filter matching
    const matchesCell = selectedCell === null || (r.likelihood === selectedCell[0] && r.impact === selectedCell[1]);

    return matchesSearch && matchesCategory && matchesStatus && matchesCell;
  });

  // Risk Score Color Generator
  const getScoreColor = (score: number) => {
    if (score >= 15) return "var(--core-danger)";
    if (score >= 9) return "var(--core-warning)";
    return "var(--core-success)";
  };

  // Matrix cell count
  const getCellCount = (likelihood: number, impact: number) => {
    return risks.filter((r) => r.likelihood === likelihood && r.impact === impact).length;
  };

  // Heatmap matrix score background
  const getCellBg = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    const isSelected = selectedCell && selectedCell[0] === likelihood && selectedCell[1] === impact;

    if (score >= 15) return isSelected ? "#ef4444" : "#fee2e2";
    if (score >= 9) return isSelected ? "#f59e0b" : "#fef3c7";
    return isSelected ? "#10b981" : "#dcfce7";
  };

  const getCellBorder = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    const isSelected = selectedCell && selectedCell[0] === likelihood && selectedCell[1] === impact;
    if (isSelected) return "2px solid #000";

    if (score >= 15) return "1px solid #fca5a5";
    if (score >= 9) return "1px solid #fde047";
    return "1px solid #a7f3d0";
  };

  const getCellTextColor = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    const isSelected = selectedCell && selectedCell[0] === likelihood && selectedCell[1] === impact;
    if (isSelected) return "#fff";

    if (score >= 15) return "var(--core-danger)";
    if (score >= 9) return "var(--core-warning)";
    return "var(--core-success)";
  };

  const columns: DataTableColumn<Risk>[] = [
    { key: "name", header: "Risk / Threat", sortable: true },
    { key: "category", header: "Risk Category", sortable: true },
    { key: "likelihood", header: "Likelihood", sortable: true },
    { key: "impact", header: "Impact", sortable: true },
    {
      key: "score",
      header: "Severity Score",
      sortable: true,
      render: (row) => (
        <span style={{ color: getScoreColor(row.score), fontWeight: 700, fontSize: "15px" }}>
          {row.score}
        </span>
      )
    },
    { key: "owner", header: "Mitigation Owner", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => {
        let color = "var(--core-warning)";
        let bg = "var(--core-warning-soft)";
        if (row.status === "Mitigated") {
          color = "var(--core-success)";
          bg = "var(--core-success-soft)";
        } else if (row.status === "Escalated") {
          color = "var(--core-danger)";
          bg = "var(--core-danger-soft)";
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
            {row.status}
          </span>
        );
      }
    }
  ];

  return (
    <ExecutiveShell activePath="/executive/risks">
      <PageHeader
        title="Enterprise Risk Register"
        description="Monitor organization-level operational risks, track mitigation actions, and manage escalations."
      />

      {/* KPI Cards */}
      <div className="core-grid" style={{ marginBottom: 32 }}>
        <MetricCard label="Active Escalations" value={risks.filter((r) => r.status === "Escalated").length}>
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-danger)" }}>
            High severity issues requiring urgent corporate mitigation.
          </div>
        </MetricCard>
        <MetricCard label="Highest Risk Score" value="16 (GPU Supply)">
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-text-muted)" }}>
            Infrastructure category, rated 4x4 (Almost Certain & Major).
          </div>
        </MetricCard>
        <MetricCard label="Mitigation Health" value="70%">
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--core-text-muted)" }}>
            Aggregate progress across all current action items.
          </div>
        </MetricCard>
      </div>

      {/* Heatmap Grid & Matrix Guide */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Heatmap */}
        <div className="core-panel" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2>Risk Heatmap Matrix (5x5)</h2>
            {selectedCell && (
              <button
                type="button"
                className="core-button core-button-sm"
                onClick={() => setSelectedCell(null)}
                style={{ minHeight: 26, padding: "0 8px", fontSize: "11px" }}
              >
                Clear Matrix Filter
              </button>
            )}
          </div>
          <p style={{ fontSize: "12px", color: "var(--core-text-muted)", marginBottom: 16 }}>
            Click on a cell below to filter the registry list. Columns: Likelihood (1-5), Rows: Impact (1-5).
          </p>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Impact Row 5 down to 1 */}
            {[5, 4, 3, 2, 1].map((impactVal) => (
              <div key={impactVal} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ width: 80, fontSize: "11px", fontWeight: 600, color: "var(--core-text-subtle)", textAlign: "right", paddingRight: 8 }}>
                  Impact {impactVal}
                </span>
                {[1, 2, 3, 4, 5].map((likeVal) => {
                  const count = getCellCount(likeVal, impactVal);
                  return (
                    <div
                      key={likeVal}
                      style={{
                        flex: 1,
                        height: "36px",
                        borderRadius: "var(--core-radius-sm)",
                        background: getCellBg(likeVal, impactVal),
                        border: getCellBorder(likeVal, impactVal),
                        color: getCellTextColor(likeVal, impactVal),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor: "pointer",
                        userSelect: "none"
                      }}
                      onClick={() => setSelectedCell([likeVal, impactVal])}
                      title={`Likelihood ${likeVal} x Impact ${impactVal}`}
                    >
                      {count > 0 ? `${count}` : ""}
                    </div>
                  );
                })}
              </div>
            ))}
            {/* Likelihood Label Row */}
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
              <span style={{ width: 80 }} />
              {[1, 2, 3, 4, 5].map((likeVal) => (
                <span key={likeVal} style={{ flex: 1, fontSize: "10px", fontWeight: 600, color: "var(--core-text-subtle)", textAlign: "center" }}>
                  L{likeVal}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Matrix Legend / Help Guide */}
        <div className="core-panel" style={{ display: "flex", flexDirection: "column" }}>
          <h2>Strategic Mitigation Action Matrix</h2>
          <p style={{ fontSize: "12px", color: "var(--core-text-muted)", marginBottom: 16 }}>
            Understanding risk severity ratings and threshold requirements.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "start", gap: 10, padding: 8, borderRadius: "var(--core-radius-sm)", border: "1px solid #fee2e2", background: "#fee2e2" }}>
              <span style={{ color: "var(--core-danger)", marginTop: 2, display: "flex" }}>
                <WarningIcon />
              </span>
              <div>
                <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--core-danger)", margin: "0 0 2px" }}>High Risk (Score 15-25)</p>
                <p style={{ fontSize: "11px", color: "var(--core-text-muted)", margin: 0 }}>Requires immediate mitigation roadmap updates and weekly review by executive sponsors.</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "start", gap: 10, padding: 8, borderRadius: "var(--core-radius-sm)", border: "1px solid #fef3c7", background: "#fef3c7" }}>
              <span style={{ color: "var(--core-warning)", marginTop: 2, display: "flex" }}>
                <WarningIcon />
              </span>
              <div>
                <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--core-warning)", margin: "0 0 2px" }}>Medium Risk (Score 9-14)</p>
                <p style={{ fontSize: "11px", color: "var(--core-text-muted)", margin: 0 }}>Requires assigned mitigation owner and bi-weekly milestone status briefings.</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "start", gap: 10, padding: 8, borderRadius: "var(--core-radius-sm)", border: "1px solid #dcfce7", background: "#dcfce7" }}>
              <span style={{ color: "var(--core-success)", marginTop: 2, display: "flex" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              </span>
              <div>
                <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--core-success)", margin: "0 0 2px" }}>Low Risk (Score 1-8)</p>
                <p style={{ fontSize: "11px", color: "var(--core-text-muted)", margin: 0 }}>Logged and monitored in department trackers. Low operational impacts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table search toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--core-text-subtle)", display: "flex" }}>
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Search risk register..."
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
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
          <option value="All">All Categories</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="Compliance">Compliance</option>
          <option value="Performance">Performance</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Financial">Financial</option>
        </select>

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
          <option value="Open">Open</option>
          <option value="Escalated">Escalated</option>
          <option value="Mitigated">Mitigated</option>
        </select>
      </div>

      {/* Risk table */}
      <DataTable
        columns={columns}
        rows={filteredRisks}
        rowKey={(row) => row.id}
        rowActions={(row) => [
          { label: "Inspect Mitigation", onClick: (row) => setSelectedRisk(row) }
        ]}
      />

      {/* Detail drawer */}
      <DetailDrawer
        isOpen={selectedRisk !== null}
        onClose={() => setSelectedRisk(null)}
        title={selectedRisk?.name ?? ""}
        subtitle={`Category: ${selectedRisk?.category}`}
        status={
          selectedRisk ? (
            <span style={{
              padding: "4px 8px",
              borderRadius: "var(--core-radius-sm)",
              backgroundColor: selectedRisk.status === "Mitigated" ? "var(--core-success-soft)" : selectedRisk.status === "Escalated" ? "var(--core-danger-soft)" : "var(--core-warning-soft)",
              color: selectedRisk.status === "Mitigated" ? "var(--core-success)" : selectedRisk.status === "Escalated" ? "var(--core-danger)" : "var(--core-warning)",
              fontSize: "12px",
              fontWeight: 600
            }}>
              {selectedRisk.status}
            </span>
          ) : undefined
        }
        footerLeft={
          selectedRisk && selectedRisk.status !== "Escalated" && (
            <button
              type="button"
              className="core-button core-button-danger"
              onClick={() => handleEscalateRisk(selectedRisk.id)}
            >
              Escalate Risk
            </button>
          )
        }
        footerRight={
          selectedRisk && selectedRisk.status !== "Mitigated" && (
            <button
              type="button"
              className="core-button core-button-primary"
              onClick={() => handleMitigateRisk(selectedRisk.id)}
            >
              Mark Mitigated
            </button>
          )
        }
      >
        {selectedRisk && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <DrawerSection title="Details">
              <DrawerField label="Impact Rating" value={`${selectedRisk.impact} / 5`} />
              <DrawerField label="Likelihood Rating" value={`${selectedRisk.likelihood} / 5`} />
              <DrawerField label="Severity Score" value={selectedRisk.score.toString()} />
              <DrawerField label="Mitigation Owner" value={selectedRisk.owner} />
            </DrawerSection>

            <DrawerSection title="Mitigation Plan">
              <div style={{ fontSize: "13px", color: "var(--core-text-muted)", lineHeight: 1.6, width: "100%" }}>
                {selectedRisk.mitigation}
              </div>
            </DrawerSection>

            <DrawerSection title="Mitigation Progress">
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "12px", fontWeight: 500 }}>
                  <span>Mitigation Accomplished</span>
                  <span>{selectedRisk.progress}%</span>
                </div>
                <div style={{ width: "100%", height: 8, background: "var(--core-border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${selectedRisk.progress}%`, height: "100%", background: getScoreColor(selectedRisk.score) }} />
                </div>
              </div>
            </DrawerSection>
          </div>
        )}
      </DetailDrawer>
    </ExecutiveShell>
  );
}
