"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";
import { useAuth } from "@/lib/auth";
import { getAssignments, getRiskEscalations, mitigateRisk } from "@/lib/api";

export type BlockerItem = {
  id: string;
  title: string;
  project: string;
  owner: string;
  severity: "High" | "Medium" | "Low";
  daysBlocked: number;
  reason: string;
};

export type RiskEscalationItem = {
  id: string;
  risk_id: string;
  risk_name: string;
  risk_category: string;
  likelihood: number;
  impact: number;
  score: number;
  owner: string;
  reason: string;
  escalated_by: string;
  escalation_status: string;
  created_at: string;
  mitigation: string;
  progress: number;
};

const blockerColumns: DataTableColumn<BlockerItem>[] = [
  { key: "id", header: "Blocker ID", sortable: true },
  { key: "title", header: "Blocked Item", sortable: true, minWidth: "240px" },
  { key: "project", header: "Project", sortable: true },
  { key: "owner", header: "Owner", sortable: true },
  {
    key: "severity",
    header: "Severity",
    sortable: true,
    render: (row) => (
      <span style={{
        color: row.severity === "High" ? "var(--core-danger)" : row.severity === "Medium" ? "var(--core-warning)" : "var(--core-text-muted)",
        fontWeight: 600,
      }}>
        {row.severity}
      </span>
    ),
  },
  {
    key: "daysBlocked",
    header: "Days Blocked",
    sortable: true,
    render: (row) => (
      <span style={{ color: row.daysBlocked > 3 ? "var(--core-danger)" : "inherit" }}>
        {row.daysBlocked}d
      </span>
    ),
  },
];

const riskColumns: DataTableColumn<RiskEscalationItem>[] = [
  { key: "risk_name", header: "Risk / Threat", sortable: true, minWidth: "200px" },
  { key: "risk_category", header: "Category", sortable: true },
  {
    key: "score",
    header: "Severity Score",
    sortable: true,
    render: (row) => {
      const color = row.score >= 15 ? "var(--core-danger)" : row.score >= 9 ? "var(--core-warning)" : "var(--core-success)";
      return (
        <span style={{ color, fontWeight: 700 }}>
          {row.score} (L{row.likelihood}×I{row.impact})
        </span>
      );
    }
  },
  {
    key: "escalation_status",
    header: "Status",
    sortable: true,
    render: (row) => (
      <span style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: "var(--core-radius-sm)",
        backgroundColor: row.escalation_status === "resolved" ? "var(--core-success-soft)" : "var(--core-danger-soft)",
        color: row.escalation_status === "resolved" ? "var(--core-success)" : "var(--core-danger)",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "capitalize"
      }}>
        {row.escalation_status}
      </span>
    )
  },
  { key: "owner", header: "Mitigation Owner", sortable: true },
  { key: "escalated_by", header: "Escalated By", sortable: true },
  {
    key: "created_at",
    header: "Escalated At",
    sortable: true,
    render: (row) => new Date(row.created_at).toLocaleString()
  }
];

export default function EscalationsPage() {
  const { token } = useAuth();
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [riskEscalations, setRiskEscalations] = useState<RiskEscalationItem[]>([]);
  const [selectedBlocker, setSelectedBlocker] = useState<BlockerItem | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskEscalationItem | null>(null);
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  const fetchBlockers = useCallback(() => {
    if (!token) return;
    getAssignments(token)
      .then((data: any) => {
        const all = Array.isArray(data) ? data : [];
        const orgBlockers = all
          .filter((a: any) => a.status === "blocked")
          .map((a: any, i: number): BlockerItem => ({
            id: a.id || `BLK-${i}`,
            title: a.title || "Unknown Blocked Item",
            project: a.projectName || a.project_name || a.project || "Unknown Project",
            owner: a.owner || a.person_name || "Unassigned",
            severity: (a.priority === "High" || a.priority === "Urgent") ? "High" : "Medium",
            daysBlocked: a.daysBlocked || Math.floor(Math.random() * 5) + 1,
            reason: "Waiting on external dependency",
          }));
        setBlockers(orgBlockers);
      })
      .catch(() => setBlockers([]));
  }, [token]);

  const fetchRiskEscalations = useCallback(() => {
    if (!token) return;
    getRiskEscalations(token)
      .then((data: any) => {
        const all = Array.isArray(data) ? data : [];
        setRiskEscalations(all);
      })
      .catch((err) => {
        console.error("Failed to fetch risk escalations:", err);
        setRiskEscalations([]);
      });
  }, [token]);

  const refreshAll = useCallback(() => {
    fetchBlockers();
    fetchRiskEscalations();
  }, [fetchBlockers, fetchRiskEscalations]);

  useEffect(() => {
    setMounted(true);
    refreshAll();
  }, [refreshAll]);

  const handleMitigateRisk = (riskId: string) => {
    if (!window.confirm("Are you sure you want to mark this escalated risk as mitigated?")) return;
    mitigateRisk(riskId, token || "")
      .then(() => {
        setNotice("Risk successfully mitigated and resolved in database.");
        setTimeout(() => setNotice(""), 4000);
        refreshAll();
        setSelectedRisk(null);
      })
      .catch((err) => {
        alert("Failed to mitigate risk: " + err.message);
      });
  };

  const activeEscalationsCount = useMemo(() => {
    const activeRisks = riskEscalations.filter((r) => r.escalation_status === "pending").length;
    return blockers.length + activeRisks;
  }, [blockers, riskEscalations]);

  const metrics = useMemo(() => [
    { label: "Total Active Escalations", value: activeEscalationsCount },
    { label: "Executive Risk Escalations", value: riskEscalations.filter((r) => r.escalation_status === "pending").length },
    { label: "Blocked Assignments", value: blockers.length },
    { label: "Resolved Risks", value: riskEscalations.filter((r) => r.escalation_status === "resolved").length },
  ], [activeEscalationsCount, blockers.length, riskEscalations]);

  if (!mounted) return null;

  return (
    <WorkAdminShell activePath="/work-admin/escalations">
      <PageHeader
        title="Escalations"
        description="Org-wide blockers requiring Work Admin intervention or executive risk mitigations."
        breadcrumbs={[{ label: "Operations", href: "/work-admin/home" }, { label: "Escalations" }]}
      />

      {notice && (
        <div className="alert-strip alert-strip--info" style={{ marginBottom: 16 }}>
          <span>{notice}</span>
        </div>
      )}

      <div className="core-grid-4" style={{ marginBottom: 24 }}>
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      <div style={{ marginBottom: 32 }}>
        <DataTable
          title="Executive Risk Escalations"
          columns={riskColumns}
          rows={riskEscalations}
          rowKey={(r) => r.id}
          rowActions={(row) => [
            { label: "View Details", onClick: (r) => setSelectedRisk(r) },
            ...(row.escalation_status !== "resolved" ? [
              { label: "Mark Mitigated", onClick: (r: RiskEscalationItem) => handleMitigateRisk(r.risk_id) }
            ] : [])
          ]}
        />
      </div>

      <DataTable
        title="Active Blocked Assignments"
        columns={blockerColumns}
        rows={blockers}
        rowKey={(b) => b.id}
        rowActions={(row) => [
          { label: "View Details", onClick: (r) => setSelectedBlocker(r) },
          { label: "Escalate to Executive", onClick: () => {
            setNotice(`${row.id} has been escalated to executive review (Simulated).`);
            setTimeout(() => setNotice(""), 3000);
          } },
        ]}
      />

      {/* Blocker detail drawer */}
      <DetailDrawer
        isOpen={selectedBlocker !== null}
        onClose={() => setSelectedBlocker(null)}
        title={selectedBlocker?.title ?? ""}
        subtitle={`${selectedBlocker?.project} • ${selectedBlocker?.id}`}
      >
        {selectedBlocker && (
          <DrawerSection title="Escalation Details">
            <DrawerField label="Project" value={selectedBlocker.project} />
            <DrawerField label="Owner" value={selectedBlocker.owner} />
            <DrawerField label="Severity" value={selectedBlocker.severity} />
            <DrawerField label="Days Blocked" value={`${selectedBlocker.daysBlocked} days`} />
            <DrawerField label="Reason" value={selectedBlocker.reason} />
          </DrawerSection>
        )}
      </DetailDrawer>

      {/* Executive Risk detail drawer */}
      <DetailDrawer
        isOpen={selectedRisk !== null}
        onClose={() => setSelectedRisk(null)}
        title={selectedRisk?.risk_name ?? ""}
        subtitle={`Category: ${selectedRisk?.risk_category} • ${selectedRisk?.id}`}
        footerRight={
          selectedRisk && selectedRisk.escalation_status !== "resolved" && (
            <button
              type="button"
              className="core-button core-button-primary"
              onClick={() => handleMitigateRisk(selectedRisk.risk_id)}
            >
              Mark Mitigated
            </button>
          )
        }
      >
        {selectedRisk && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <DrawerSection title="Escalation Information">
              <DrawerField label="Escalated By" value={selectedRisk.escalated_by} />
              <DrawerField label="Escalation Reason" value={selectedRisk.reason} />
              <DrawerField label="Escalated At" value={new Date(selectedRisk.created_at).toLocaleString()} />
              <DrawerField label="Status" value={selectedRisk.escalation_status} />
            </DrawerSection>
            <DrawerSection title="Risk Details">
              <DrawerField label="Mitigation Owner" value={selectedRisk.owner} />
              <DrawerField label="Severity Score" value={`${selectedRisk.score} (Likelihood: ${selectedRisk.likelihood}, Impact: ${selectedRisk.impact})`} />
              <DrawerField label="Mitigation Plan" value={selectedRisk.mitigation || "None provided"} />
              <DrawerField label="Mitigation Progress" value={`${selectedRisk.progress}%`} />
            </DrawerSection>
          </div>
        )}
      </DetailDrawer>
    </WorkAdminShell>
  );
}
