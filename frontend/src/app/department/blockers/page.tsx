"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DepartmentShell } from "@/components/department-shell";
import { DetailDrawer, DrawerField, DrawerSection } from "@/components/detail-drawer";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SelectInput, TextArea } from "@/components/form-controls";
import { useAuth } from "@/lib/auth";
import { getBlockers, resolveBlocker } from "@/lib/api";

export type BlockerItem = {
  id: string;
  title: string;
  project: string;
  projectId: string;
  owner: string;
  ownerId: string;
  departmentId: string;
  severity: "High" | "Medium" | "Low";
  daysBlocked: number;
  reason: string;
  status: string;
};

const columns: DataTableColumn<BlockerItem>[] = [
  {
    key: "title",
    header: "Blocked Item",
    sortable: true,
    minWidth: "260px",
    render: (row) => (
      <div>
        <strong>{row.title}</strong>
        <div style={{ color: "var(--core-text-subtle)", fontSize: "var(--core-text-xs)", marginTop: 3 }}>
          {row.project} • {row.id}
        </div>
      </div>
    ),
  },
  { key: "owner", header: "Owner", sortable: true },
  {
    key: "severity",
    header: "Severity",
    sortable: true,
    render: (row) => (
      <span
        style={{
          color: row.severity === "High" ? "var(--core-danger)" : row.severity === "Medium" ? "var(--core-warning)" : "var(--core-text)",
          fontWeight: 600,
        }}
      >
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
        {row.daysBlocked} days
      </span>
    ),
  },
];

const filterSelectStyle = { height: 36, minWidth: 132 } as const;

export default function BlockersPage() {
  const { user, token } = useAuth();
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [selectedBlocker, setSelectedBlocker] = useState<BlockerItem | null>(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("Details");
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  const loadBlockers = useCallback(async () => {
    if (!token || !user) return;
    try {
      const data: any = await getBlockers(token);
        const all = Array.isArray(data) ? data : [];
        const deptBlockers = all
          .filter((item: any) => !item.department_id || item.department_id === user.departmentId)
          .map((item: any): BlockerItem => ({
            id: item.assignment_id, title: item.title, project: item.project_name, projectId: item.project_id,
            owner: item.owner_name, ownerId: item.owner_id, departmentId: item.department_id || "",
            severity: item.severity, daysBlocked: item.days_blocked, reason: item.reason, status: "blocked",
          }));
        setBlockers(deptBlockers);
    } catch {
      setBlockers([]);
    }
  }, [token, user]);

  useEffect(() => {
    setMounted(true);
    void loadBlockers();
    const interval = window.setInterval(() => void loadBlockers(), 20_000);
    return () => window.clearInterval(interval);
  }, [loadBlockers]);

  // Keep drawer in sync if list updates
  useEffect(() => {
    if (selectedBlocker) {
      const fresh = blockers.find(b => b.id === selectedBlocker.id);
      setSelectedBlocker(fresh || null);
    }
  }, [blockers, selectedBlocker]);

  const filteredBlockers = useMemo(
    () =>
      blockers.filter((b) => {
        return severityFilter === "all" || b.severity === severityFilter;
      }),
    [blockers, severityFilter]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Total Blockers",
        value: blockers.length,
      },
      {
        label: "Critical (> 3 days)",
        value: blockers.filter((b) => b.daysBlocked > 3).length,
      },
      {
        label: "High Severity",
        value: blockers.filter((b) => b.severity === "High").length,
      },
    ],
    [blockers]
  );

  const handleResolve = async () => {
    if (!selectedBlocker) return;
    try {
      await resolveBlocker(selectedBlocker.id, "Resolved by department triage.", token || undefined);
      setBlockers(prev => prev.filter(b => b.id !== selectedBlocker.id));
      setNotice(`Blocker ${selectedBlocker.id} marked as resolved.`);
      setSelectedBlocker(null);
      setTimeout(() => setNotice(""), 4000);
    } catch {
      setNotice("The blocker could not be resolved. Please try again.");
    }
  };

  const handleEscalate = () => {
    if (!selectedBlocker) return;
    setNotice(`Blocker ${selectedBlocker.id} is visible in the Work Admin escalation queue.`);
    setTimeout(() => setNotice(""), 4000);
  };

  if (!mounted) {
    return (
      <DepartmentShell activePath="/department/blockers">
        <PageHeader
          title="Blocker Triage"
          description="Identify and resolve roadblocks impacting department velocity."
          breadcrumbs={[
            { label: "Department", href: "/department/home" },
            { label: "Blockers" },
          ]}
        />
        <div style={{ padding: 40, textAlign: "center", color: "var(--core-text-subtle)" }}>
          Loading blockers...
        </div>
      </DepartmentShell>
    );
  }

  return (
    <DepartmentShell activePath="/department/blockers">
      <PageHeader
        title="Blocker Triage"
        description="Identify and resolve roadblocks impacting department velocity."
        breadcrumbs={[
          { label: "Department", href: "/department/home" },
          { label: "Blockers" },
        ]}
      />

      {notice && (
        <div className="alert-strip alert-strip--success" role="status" style={{ marginBottom: 24 }}>
          <span>{notice}</span>
        </div>
      )}

      <div className="core-grid" style={{ marginBottom: 24 }}>
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <DataTable
        title="Active Blockers"
        columns={columns}
        rows={filteredBlockers}
        rowKey={(row) => row.id}
        filtersSlot={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <label className="form-label">
              Severity
              <select
                className="form-select"
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>
        }
        rowActions={(row) => [
          {
            label: "Triage",
            onClick: () => {
              setSelectedBlocker(row);
              setActiveTab("Details");
            },
          },
        ]}
        emptyState={{
          title: "Clear path ahead!",
          body: "There are no active blockers in the department right now.",
        }}
      />

      <DetailDrawer
        isOpen={Boolean(selectedBlocker)}
        onClose={() => setSelectedBlocker(null)}
        title={selectedBlocker?.title ?? "Blocker"}
        subtitle={selectedBlocker?.id}
        status={<StatusBadge status="blocked" label="Blocked" />}
        tabs={["Details", "Resolution"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {selectedBlocker && activeTab === "Details" && (
          <>
            <DrawerSection title="Blocker Context">
              <DrawerField label="Project" value={selectedBlocker.project} />
              <DrawerField label="Owner" value={selectedBlocker.owner} />
              <DrawerField label="Severity" value={selectedBlocker.severity} />
              <DrawerField label="Duration" value={`${selectedBlocker.daysBlocked} days`} />
            </DrawerSection>
            <DrawerSection title="Reason">
              <p style={{ margin: 0, color: "var(--core-text)" }}>{selectedBlocker.reason}</p>
            </DrawerSection>
          </>
        )}

        {selectedBlocker && activeTab === "Resolution" && (
          <DrawerSection title="Triage Actions">
            <p style={{ margin: "0 0 16px", color: "var(--core-text-muted)" }}>
              Take action to help unblock this item. You can escalate it or record a resolution.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SelectInput
                label="Re-assign Blocker To"
                options={[
                  { value: "unassigned", label: "Select..." },
                  { value: "manager", label: "Department Manager" },
                  { value: "hr", label: "HR Team" },
                  { value: "it", label: "IT Support" },
                ]}
              />
              <TextArea
                label="Resolution Notes"
                placeholder="What actions were taken to resolve this?"
                rows={4}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" className="core-button" onClick={handleEscalate}>
                  Escalate
                </button>
                <button type="button" className="core-button core-button-primary" onClick={handleResolve}>
                  Mark Resolved
                </button>
              </div>
            </div>
          </DrawerSection>
        )}
      </DetailDrawer>
    </DepartmentShell>
  );
}
