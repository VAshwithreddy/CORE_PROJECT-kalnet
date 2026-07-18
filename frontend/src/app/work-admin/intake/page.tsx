"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkAdminShell } from "@/components/work-admin-shell";
import { PageHeader } from "@/components/page-header";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DetailDrawer, DrawerSection, DrawerField } from "@/components/detail-drawer";
import { StatusBadge } from "@/components/status-badge";
import { SelectInput } from "@/components/form-controls";
import { getRequests, subscribe, type RequestItem, routeRequest, createAuditEvent } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/mock-session";

const columns: DataTableColumn<RequestItem>[] = [
  { key: "id", header: "Request ID", sortable: true },
  {
    key: "title",
    header: "Subject",
    sortable: true,
    minWidth: "240px",
    render: (row) => (
      <div>
        <strong>{row.title}</strong>
        <div style={{ fontSize: "var(--core-text-xs)", color: "var(--core-text-muted)", marginTop: 2 }}>{row.type}</div>
      </div>
    ),
  },
  { key: "submitted", header: "Submitted", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusBadge status={row.status} size="sm" label={row.statusLabel} />,
  },
  { key: "assignee", header: "Handler", sortable: true },
];

export default function IntakePage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRequests(getRequests());
    return subscribe(() => setRequests(getRequests()));
  }, []);

  const filtered = useMemo(
    () => requests.filter((r) => typeFilter === "all" || r.type === typeFilter),
    [requests, typeFilter]
  );

  const pending = requests.filter((r) => r.status === "waiting").length;

  if (!mounted) return null;

  return (
    <WorkAdminShell activePath="/work-admin/intake">
      <PageHeader
        title="Work Intake"
        description="Review, route, and action all incoming requests from across the organisation."
        breadcrumbs={[{ label: "Operations", href: "/work-admin/home" }, { label: "Intake" }]}
      />

      {notice && (
        <div className="alert-strip alert-strip--success" style={{ marginBottom: 16 }}>
          <span>{notice}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ padding: "10px 16px", background: "var(--core-warning-soft)", borderRadius: "var(--core-radius-sm)", fontWeight: 600, color: "var(--core-warning)" }}>
          ⏳ {pending} Pending Approval
        </div>
        <SelectInput
          label=""
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: "all", label: "All Types" },
            { value: "IT Support", label: "IT Support" },
            { value: "Access", label: "Access" },
            { value: "Time Off", label: "Time Off" },
            { value: "HR", label: "HR" },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        rowActions={(row) => [
          { label: "View Details", onClick: (r) => setSelected(r) },
          {
            label: "Route to Default Dept",
            onClick: () => {
              const targetDept = row.type === "IT Support" || row.type === "Access" ? "IT Operations" : row.type === "Time Off" ? "People Ops" : "HR";
              routeRequest(row.id, targetDept);
              createAuditEvent({
                actor: getCurrentUser().name,
                role: getCurrentUser().role,
                action: "Routed Request",
                target: `${row.id} to ${targetDept}`,
                outcome: "in-progress",
                outcomeLabel: "Routed",
              });
              setNotice(`${row.id} routed to ${targetDept}.`);
              setTimeout(() => setNotice(""), 3000);
            }
          }
        ]}
      />

      <DetailDrawer
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        subtitle={`${selected?.type} • ${selected?.id}`}
        status={selected ? <StatusBadge status={selected.status} label={selected.statusLabel} size="sm" /> : undefined}
      >
        {selected && (
          <DrawerSection title="Request Details">
            <DrawerField label="Description" value={selected.description} />
            <DrawerField label="Submitted" value={selected.submitted} />
            <DrawerField label="Last Updated" value={selected.updated} />
            <DrawerField label="Assigned Handler" value={selected.assignee} />
          </DrawerSection>
        )}
      </DetailDrawer>
    </WorkAdminShell>
  );
}
