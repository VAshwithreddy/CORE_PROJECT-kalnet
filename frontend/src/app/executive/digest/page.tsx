"use client";

import { useState } from "react";
import { ExecutiveShell } from "@/components/executive-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";

// Custom SVGs
const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface DigestHistory {
  id: string;
  week: string;
  date: string;
  author: string;
  status: "Draft" | "Published";
}

export default function ExecutiveDigestPage() {
  const [selectedWeek, setSelectedWeek] = useState("week-28-2026");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  // Editable briefing narrative state
  const [briefingText, setBriefingText] = useState("");

  const history: DigestHistory[] = [
    { id: "h-27", week: "Week 27, 2026", date: "July 09, 2026", author: "Michael Kim (CEO)", status: "Published" },
    { id: "h-26", week: "Week 26, 2026", date: "July 02, 2026", author: "Michael Kim (CEO)", status: "Published" },
    { id: "h-25", week: "Week 25, 2026", date: "June 25, 2026", author: "David L. (Eng Head)", status: "Published" },
  ];

  const columns: DataTableColumn<DigestHistory>[] = [
    { key: "week", header: "Reporting Period", sortable: true },
    { key: "date", header: "Date Generated", sortable: true },
    { key: "author", header: "Assembled By", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <span style={{
          display: "inline-block",
          padding: "3px 8px",
          borderRadius: "var(--core-radius-sm)",
          backgroundColor: "var(--core-success-soft)",
          color: "var(--core-success)",
          fontSize: "12px",
          fontWeight: 600
        }}>
          {row.status}
        </span>
      )
    },
    {
      key: "id" as any,
      header: "Actions",
      render: (row) => (
        <button
          type="button"
          className="core-button core-button-sm core-button-ghost"
          style={{ minHeight: 28, fontSize: "12px" }}
          onClick={() => {
            setBriefingText(`[Archive Log - ${row.week}]\nCORE project operations proceeded at stable metrics. Key milestones completed include RDS failover testing and GDPR compliance review mappings.`);
            setHasGenerated(true);
          }}
        >
          View Log
        </button>
      )
    }
  ];

  // Simulate assembling narrative UI (no backend AI requested)
  const handleAssembleBriefing = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setBriefingText(
        `WEEKLY BRIEFING: COHORT MOVEMENT SUMMARY\n` +
        `-----------------------------------------\n` +
        `This week, organizational milestones achieved an aggregate progress of 68% for Q3 OKRs. \n` +
        `Engineering has completed database sharding audits and launched Phase 2 Cloud Migrations on schedule. \n\n` +
        `AI/ML research velocity remains optimal but faces critical blocker escalations regarding GPU instance limits. \n` +
        `Product management EMEA launch operations are on track, pending final regulatory compliance sign-offs.`
      );
      setIsGenerating(false);
      setHasGenerated(true);
    }, 1000);
  };

  return (
    <ExecutiveShell activePath="/executive/digest">
      <PageHeader
        title="Weekly Leadership Briefings"
        description="Review structured updates, key department accomplishments, and critical decisions gathered from operational registers."
      />

      {/* Assembly Control Panel */}
      <div className="core-panel" style={{ marginBottom: 32, background: "var(--core-surface-muted)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "14px" }}>Select Reporting Period:</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
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
              <option value="week-28-2026">Week 28, 2026 (July 10 - July 16)</option>
              <option value="week-29-2026">Week 29, 2026 (Forecast)</option>
            </select>
          </div>
          
          <button
            type="button"
            className="core-button core-button-primary"
            onClick={handleAssembleBriefing}
            disabled={isGenerating}
            style={{ background: "var(--core-executive)", borderColor: "var(--core-executive)" }}
          >
            <SparklesIcon />
            {isGenerating ? "Assembling Briefing..." : "Assemble Weekly Briefing"}
          </button>
        </div>
      </div>

      {/* Generating Skeleton Loader */}
      {isGenerating && (
        <div className="core-panel" style={{ marginBottom: 32, textAlign: "center", padding: "48px 0" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid var(--core-border)",
            borderTop: "3px solid var(--core-executive)",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite"
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ fontWeight: 600, margin: 0 }}>Reading department datastores and compiling narrative...</p>
        </div>
      )}

      {/* Active Briefing Editor and Highlights */}
      {hasGenerated && !isGenerating && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, marginBottom: 32 }}>
          
          {/* Live Editor */}
          <div className="core-panel" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ display: "flex", alignItems: "center" }}>
                <span style={{ display: "flex", color: "var(--core-executive)" }}><EditIcon /></span>
                Digest Narrative Editor
              </h2>
              <button
                type="button"
                className="core-button core-button-sm"
                onClick={() => alert("Simulated Export: Briefing has been copied to clipboard!")}
                style={{ fontSize: "12px", minHeight: 28 }}
              >
                <ExportIcon />
                Export
              </button>
            </div>
            <textarea
              value={briefingText}
              onChange={(e) => setBriefingText(e.target.value)}
              style={{
                flex: 1,
                minHeight: "220px",
                padding: 16,
                borderRadius: "var(--core-radius-sm)",
                border: "1px solid var(--core-border)",
                fontFamily: "var(--core-font-sans)",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--core-text)",
                background: "var(--core-bg)",
                resize: "vertical"
              }}
            />
          </div>

          {/* Highlights & Decisions Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Highlights */}
            <div className="core-panel" style={{ flex: 1 }}>
              <h3 style={{ borderBottom: "1px solid var(--core-border)", paddingBottom: 8, color: "var(--core-success)", display: "flex", alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}><polyline points="20 6 9 17 4 12" /></svg>
                Key Weekly Highlights
              </h3>
              <ul style={{ paddingLeft: 16, margin: "12px 0 0", fontSize: "13px", color: "var(--core-text-muted)", lineHeight: 1.6 }}>
                <li>Cloud database migration Phase 2 finalized with RDS database level.</li>
                <li>Design team completed the accessibility tokens audit for all shells.</li>
                <li>Budget expenditure remains optimal at -1.2% variance in Engineering.</li>
              </ul>
            </div>

            {/* Decisions Needed */}
            <div className="core-panel" style={{ flex: 1 }}>
              <h3 style={{ borderBottom: "1px solid var(--core-border)", paddingBottom: 8, color: "var(--core-warning)", display: "flex", alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                Critical Decisions Needed
              </h3>
              <ul style={{ paddingLeft: 16, margin: "12px 0 0", fontSize: "13px", color: "var(--core-text-muted)", lineHeight: 1.6 }}>
                <li>Approve EMEA expansion budget variance to initiate local office setup.</li>
                <li>Reallocate alternate cloud capacity cluster to resolve GPU limits blocker.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Historical Logs */}
      <DataTable
        title="Briefing Assembly Log History"
        columns={columns}
        rows={history}
        rowKey={(row) => row.id}
      />
    </ExecutiveShell>
  );
}
